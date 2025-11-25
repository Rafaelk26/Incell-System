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

type MinisterioSupervisaoForm = {
  nome: string;
  supervisor_id?: string;
  genero: string;
  idade: string;
};

interface CelulaComLider {
  id: string;
  celula_nome: string;
  lider_nome: string;
  lider_id: string | null;
  lider_cargo: string | null
}

interface Leaders {
  id: string;    
  nome: string;
  celula: string;
}

interface Supervisores {
  id: string;
  nome: string;
  cargo: string;
}

export default function CriarMinisterioSupervisao() {
  const { register, handleSubmit } = useForm<MinisterioSupervisaoForm>();
  const [celulasComLider, setCelulasComLider] = useState<CelulaComLider[]>([]);
  const [leadersArray, setLeadersArray] = useState<Leaders[]>([]);
  const [supervisores, setSupervisores] = useState<Supervisores[]>([]);

  // Buscar células + líderes
  useEffect(() => {
    buscarCelulasComLider();
    buscarSupervisores();
  }, []);

  async function buscarCelulasComLider() {
    try {
      const { data: celulas, error: errorCelulas } = await supabase
        .from("celulas")
        .select("id, nome, responsavel_id");

      if (errorCelulas) throw errorCelulas;

      const { data: users, error: errorUsers } = await supabase
        .from("users")
        .select("id, nome, cargo");

      if (errorUsers) throw errorUsers;

      const resultado: CelulaComLider[] = celulas
        .filter((c) => c.responsavel_id)
        .map((c) => {
          const lider = users.find((u) => u.id === c.responsavel_id);
          return {
            id: c.id,
            celula_nome: c.nome,
            lider_nome: lider ? lider.nome : "Sem líder",
            lider_id: lider ? lider.id : null,
            lider_cargo: lider ? lider.cargo : "",
          };
        });

      setCelulasComLider(resultado);
    } catch (err) {
      console.error("Erro ao buscar células com líder:", err);
    }
  }

  async function buscarSupervisores() {
    const { data: supervisores, error: errorSupervisores } = await supabase
      .from("users")
      .select("id, nome, cargo");

    if (errorSupervisores) throw errorSupervisores;

    const listaSupervisores = supervisores.filter(
      (user) => user.cargo?.toLowerCase() === "supervisor"
    );

    return setSupervisores(listaSupervisores);
  }

  // Adicionar / remover líderes SEM tocar no banco
  const toggleLeader = (leader: Leaders) => {
    const exists = leadersArray.some((l) => l.id === leader.id);

    if (exists) {
      setLeadersArray((prev) => prev.filter((l) => l.id !== leader.id));
      toast.error("Líder removido");
    } else {
      setLeadersArray((prev) => [...prev, leader]);
      toast.success("Líder adicionado");
    }
  };

  // Enviar para o banco somente ao clicar em Registrar
  const handleSubmitSupervisao = async (data: MinisterioSupervisaoForm) => {
    if (!data.nome.trim()) return toast.error("Informe o nome.");
    if (!data.supervisor_id) return toast.error("Selecione um supervisor.");
    if (!data.genero) return toast.error("Selecione o tipo.");
    if (!data.idade) return toast.error("Selecione a faixa etária.");
    if (leadersArray.length === 0) return toast.error("Selecione ao menos um líder.");

    const formData = new FormData();

    formData.append("nome", data.nome);
    formData.append("supervisor_id", data.supervisor_id);
    formData.append("genero", data.genero);
    formData.append("idade", data.idade);
    formData.append("leaders", JSON.stringify(leadersArray));

    const response = await fetch("/api/ministerios/criar/supervisao", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.error || "Erro ao criar supervisão.");
      return;
    }

    toast.success("Supervisão criada com sucesso!");
  };

  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-full w-full overflow-x-hidden xl:mx-auto px-6">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image
              className="w-12 rounded-full border border-white"
              src={Perfil}
              alt="Perfil"
            />
          </header>

          <section className="max-w-full w-full md:mt-14">
            <h1 className="font-bold text-4xl font-manrope">Criar Supervisão</h1>

            {/* FORM */}
            <form
              onSubmit={handleSubmit(handleSubmitSupervisao)}
              className="mt-10 flex flex-col gap-4"
            >
              <div className="w-full flex gap-10">
                <Input
                  nome="Nome da Supervisão"
                  type="text"
                  {...register("nome", { required: true })}
                />

                <Select nome="Supervisor da Supervisão" {...register("supervisor_id", { required: true })}>
                  <option value="">Selecione</option>
                  {supervisores.map((sup) => (
                    <option className="text-black" value={sup.id} key={sup.id}>
                      {sup.nome}
                    </option>
                  ))}
                </Select>

                <Select nome="Tipo da Supervisão" {...register("genero", { required: true })}>
                  <option className="text-black" value="">Selecione</option>
                  <option className="text-black" value="masculina">Masculina</option>
                  <option className="text-black" value="feminina">Feminina</option>
                  <option className="text-black" value="kids">Kids</option>
                </Select>

                <Select nome="Faixa Etária" {...register("idade", { required: true })}>
                  <option className="text-black" value="">Selecione</option>
                  <option className="text-black" value="05-10">05 a 10 anos</option>
                  <option className="text-black" value="11-17">11 a 17 anos</option>
                  <option className="text-black" value="18-40">18 a 40 anos</option>
                  <option className="text-black" value="40+">40+</option>
                </Select>
              </div>

              {/* TABELA */}
              <div className="w-full mt-10 overflow-x-auto">
                <table className="w-full border-collapse text-white">
                  <thead>
                    <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                      <th className="p-3 text-left rounded-tl-xl">
                        Líderes da Supervisão
                      </th>
                      <th className="p-3 text-left rounded-tr-xl"></th>
                    </tr>
                  </thead>
                    <tbody>
                      {celulasComLider.length > 0 ? (
                        celulasComLider
                          .filter(item => item.lider_cargo?.trim().toLowerCase() === "lider")
                          .map((item) => {
                            const isAdded = leadersArray.some(
                              (l) => l.id === item.lider_id
                            );

                            return (
                              <tr
                                key={item.id}
                                className="flex justify-between odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                              >
                                <td className="flex flex-col px-3 py-2 font-manrope font-light">
                                  <span className="text-xl font-semibold">
                                    {item.lider_nome}
                                  </span>
                                  <span className="text-gray-300">
                                    {item.celula_nome}
                                  </span>
                                </td>

                                <td className="px-3 py-2 flex gap-6 justify-end">
                                  <ButtonAction
                                    type="button"
                                    color={isAdded ? "bg-green-600" : "bg-blue-600"}
                                    onClick={() =>
                                      toggleLeader({
                                        id: item.lider_id!,
                                        nome: item.lider_nome,
                                        celula: item.celula_nome,
                                      })
                                    }
                                  >
                                    <span className="font-manrope text-xl">
                                      {isAdded ? "Adicionado" : "Adicionar"}
                                    </span>
                                  </ButtonAction>
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center p-6 text-white font-manrope font-semibold"
                          >
                            Nenhuma célula com líder registrada.
                          </td>
                        </tr>
                      )}
                    </tbody>

                </table>
              </div>

              <button
                className="w-25 p-4 bg-blue-400 text-white font-manrope font-bold rounded-lg mt-6"
                type="submit"
              >
                Registrar
              </button>
            </form>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
