// app/admin/criar/ministerios/coordenacao/page.tsx  (ou onde você mantém essa página)
"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import Perfil from "../../../../../../public/assets/perfil teste.avif";
import { Input } from "@/components/inputs";
import { Select } from "@/components/select";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ButtonAction } from "@/components/all/buttonAction";

type MinisterioCoordenacaoForm = {
  nome: string;
  coordenador_id?: string;
  genero: string;
  idade: string;
};

// cada item corresponde a uma supervisao real (registro na tabela `supervisoes`)
interface CelulaComSupervisores {
  id: string; // id da supervisao (s.id)
  nome_supervisao: string;
  super_nome: string; // nome do user supervisor
  supervisao_id: string; // id da supervisao (mesmo que id, mantemos explicito)
  supervisor_user_id?: string | null; // id do user (opcional, caso precise)
  super_cargo?: string | null;
}

// o que guardamos no array local antes de enviar ao backend
interface SupersItem {
  supervisao_id: string; // ESSENCIAL: id da supervisao (não id do user)
  nome?: string;
  celula?: string;
}

interface Coordenadores {
  id: string;
  nome: string;
  cargo: string;
}

export default function CriarMinisterioCoordenacao() {
  const { register, handleSubmit } = useForm<MinisterioCoordenacaoForm>();
  const [celulasComLider, setCelulasComLider] = useState<CelulaComSupervisores[]>([]);
  const [supersArray, setSupersArray] = useState<SupersItem[]>([]);
  const [coordenadores, setCoordenadores] = useState<Coordenadores[]>([]);

  useEffect(() => {
    buscarSupervisoesComCelas();
    buscarCoordenadores();
  }, []);

  async function buscarSupervisoesComCelas() {
  try {
    // Supervisões
    const { data: supervisoes, error: erroSupervisoes } = await supabase
      .from("supervisoes")
      .select("id, nome, supervisor_id");

    if (erroSupervisoes) throw erroSupervisoes;

    // Usuários (supervisores)
    const { data: users, error: errorUsers } = await supabase
      .from("users")
      .select("id, nome, cargo");

    if (errorUsers) throw errorUsers;

    const resultado: CelulaComSupervisores[] = (supervisoes || []).map((s) => {
      const supervisor = users?.find((u) => u.id === s.supervisor_id);

      return {
        id: s.id,
        supervisao_id: s.id,
        nome_supervisao: s.nome ?? "Sem nome de supervisão",
        super_nome: supervisor?.nome,
        supervisor_user_id: supervisor?.id ?? null,
        super_cargo: supervisor?.cargo ?? "",
      };
    });

    setCelulasComLider(resultado);
  } catch (err) {
    console.error("Erro ao buscar supervisões:", err);
    toast.error("Erro ao buscar supervisões.");
  }
}



  async function buscarCoordenadores() {
    try {
      const { data: coordenadoresData, error: errorCoordenadores } = await supabase
        .from("users")
        .select("id, nome, cargo");

      if (errorCoordenadores) throw errorCoordenadores;

      const listaCoordenadores = (coordenadoresData || []).filter(
        (user: any) => user.cargo?.toLowerCase() === "coordenador"
      );

      setCoordenadores(listaCoordenadores);
    } catch (err) {
      console.error("Erro ao buscar coordenadores:", err);
    }
  }

  // adicionar / remover supervisao no array local (sem tocar no banco)
  const toggleSupervisor = (item: CelulaComSupervisores) => {
  const exists = supersArray.some((s) => s.supervisao_id === item.supervisao_id);

  if (exists) {
    setSupersArray((prev) => prev.filter((s) => s.supervisao_id !== item.supervisao_id));
    toast.error("Supervisão removida");
  } else {
    setSupersArray((prev) => [
      ...prev,
      { supervisao_id: item.supervisao_id, nome: item.nome_supervisao }
    ]);
    toast.success("Supervisão adicionada");
  }
};


  // enviar tudo ao backend somente quando o usuário clicar "Registrar"
  const handleSubmitCoordenacao = async (data: MinisterioCoordenacaoForm) => {
    if (!data.nome?.trim()) return toast.error("Informe o nome.");
    if (!data.coordenador_id) return toast.error("Selecione um coordenador.");
    if (!data.genero) return toast.error("Selecione o tipo.");
    if (!data.idade) return toast.error("Selecione a faixa etária.");
    if (supersArray.length === 0) return toast.error("Selecione ao menos um supervisor.");

    try {
      const formData = new FormData();
      formData.append("nome", data.nome);
      formData.append("coordenador_id", data.coordenador_id);
      formData.append("genero", data.genero);
      formData.append("idade", data.idade);
      formData.append("supers", JSON.stringify(supersArray)); // cada item tem supervisao_id

      const response = await fetch("/api/ministerios/criar/coordenacao", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erro ao criar coordenação.");
        return;
      }

      toast.success("Coordenação criada com sucesso!");
      // opcional: limpar form / array
      setSupersArray([]);
    } catch (err) {
      console.error("Erro ao submeter coordenação:", err);
      toast.error("Erro ao criar coordenação.");
    }
  };

  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-full w-full overflow-x-hidden xl:mx-auto px-6">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image className="w-12 rounded-full border border-white" src={Perfil} alt="Perfil" />
          </header>

          <section className="max-w-full w-full md:mt-14">
            <h1 className="font-bold text-4xl font-manrope">Criar Coordenação</h1>

            <form onSubmit={handleSubmit(handleSubmitCoordenacao)} className="mt-10 flex flex-col gap-4">
              <div className="w-full flex gap-10">
                <Input nome="Nome da Coordenação" type="text" {...register("nome", { required: true })} />

                <Select nome="Coord. da Coordenação" {...register("coordenador_id", { required: true })}>
                  <option className="text-black" value="">
                    Selecione
                  </option>
                  {coordenadores.map((coor) => (
                    <option className="text-black" value={coor.id} key={coor.id}>
                      {coor.nome}
                    </option>
                  ))}
                </Select>

                <Select nome="Tipo da Coordenação" {...register("genero", { required: true })}>
                  <option className="text-black" value="">
                    Selecione
                  </option>
                  <option className="text-black" value="masculina">
                    Masculina
                  </option>
                  <option className="text-black" value="feminina">
                    Feminina
                  </option>
                  <option className="text-black" value="kids">
                    Kids
                  </option>
                </Select>

                <Select nome="Faixa Etária" {...register("idade", { required: true })}>
                  <option className="text-black" value="">
                    Selecione
                  </option>
                  <option className="text-black" value="05-10">
                    05 a 10 anos
                  </option>
                  <option className="text-black" value="11-17">
                    11 a 17 anos
                  </option>
                  <option className="text-black" value="18-40">
                    18 a 40 anos
                  </option>
                  <option className="text-black" value="40+">
                    40+
                  </option>
                </Select>
              </div>

              {/* TABELA */}
              <div className="w-full mt-10 overflow-x-auto">
                <table className="w-full border-collapse text-white">
                  <thead>
                    <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                      <th className="p-3 text-left rounded-tl-xl">Supervisores da Coordenação</th>
                      <th className="p-3 text-left rounded-tr-xl"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {celulasComLider.length > 0 ? (
                      celulasComLider
                        // opcional: filtrar apenas quem tem cargo 'supervisor' no user, se quiser
                        .filter((item) => item.super_cargo?.trim().toLowerCase() === "supervisor")
                        .map((item) => {
                          const isAdded = supersArray.some((s) => s.supervisao_id === item.supervisao_id);
                          return (
                            <tr
                              key={item.supervisao_id}
                              className="flex justify-between odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                            >
                              <td className="flex flex-col px-3 py-2 font-manrope font-light">
                                <span className="text-xl font-semibold">{item.super_nome}</span>
                                <span className="text-gray-300">{item.nome_supervisao}</span>
                              </td>

                              <td className="px-3 py-2 flex gap-6 justify-end">
                                <ButtonAction
                                  type="button"
                                  color={isAdded ? "bg-green-600" : "bg-blue-600"}
                                  onClick={() => toggleSupervisor(item)}
                                >
                                  <span className="font-manrope text-xl">{isAdded ? "Adicionado" : "Adicionar"}</span>
                                </ButtonAction>
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan={2} className="text-center p-6 text-white font-manrope font-semibold">
                          Nenhuma supervisão com supervisor registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <button className="w-25 p-4 bg-blue-400 text-white font-manrope font-bold rounded-lg mt-6" type="submit">
                Registrar
              </button>
            </form>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
