// app/admin/criar/ministerios/coordenacao/page.tsx 
"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import { Input } from "@/components/inputs";
import { Select } from "@/components/select";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ButtonAction } from "@/components/all/buttonAction";
import { SpinnerLoading } from "@/components/all/spinnerLoading";
import { useAuth } from "@/app/context/useUser";

type MinisterioCoordenacaoForm = {
  nome: string;
  coordenador_id?: string;
  genero: string;
};

interface CelulaComSupervisores {
  id: string; 
  nome_supervisao: string;
  super_nome: string; 
  supervisao_id: string;
  supervisor_user_id?: string | null;
  super_cargo?: string | null;
}

interface SupersItem {
  supervisao_id: string;
  nome?: string;
  celula?: string;
}

interface Coordenadores {
  id: string;
  nome: string;
  cargo: string;
}

export default function CriarMinisterioCoordenacao() {

  const { user } = useAuth();

  const { register, handleSubmit } = useForm<MinisterioCoordenacaoForm>();
  const [celulasComLider, setCelulasComLider] = useState<CelulaComSupervisores[]>([]);
  const [supersArray, setSupersArray] = useState<SupersItem[]>([]);
  const [coordenadores, setCoordenadores] = useState<Coordenadores[]>([]);
  const [ useLoading, setUseLoading ] = useState<boolean>(false)
  const [coordenadoresComCoordenacao, setCoordenadoresComCoordenacao] = useState<string[]>([]);
  const [supervisoesComCoordenacao, setSupervisoesComCoordenacao] = useState<string[]>([]);
  const [filtroNome, setFiltroNome] = useState("");


  useEffect(() => {
    buscarSupervisoesComCelas();
    buscarCoordenadores();
    buscarVinculosCoordenacao();
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

  
  async function buscarVinculosCoordenacao() {
  try {
    // 🔹 Coordenadores já vinculados
    const { data: coordenacoes, error: errorCoordenacoes } = await supabase
      .from("coordenacoes")
      .select("coordenador_id");

    if (errorCoordenacoes) throw errorCoordenacoes;

    setCoordenadoresComCoordenacao(
      coordenacoes.map((c) => c.coordenador_id)
    );

    // 🔹 Supervisões já vinculadas
    const { data: coordenacaoSupervisores, error: errorSupervisores } = await supabase
      .from("coordenacao_supervisoes")
      .select("supervisao_id");

    if (errorSupervisores) throw errorSupervisores;

    setSupervisoesComCoordenacao(
      coordenacaoSupervisores.map((s) => s.supervisao_id)
    );
  } catch (error) {
    console.error("Erro ao buscar vínculos de coordenação:", error);
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


  const supervisoresFiltrados = useMemo(() => {
  return celulasComLider
    .filter(item =>
      item.super_cargo?.trim().toLowerCase() === "supervisor" &&
      item.supervisao_id &&
      !supervisoesComCoordenacao.includes(item.supervisao_id)
    )
    .filter(item =>
      item.super_nome
        ?.toLowerCase()
        .includes(filtroNome.toLowerCase())
    )
    .sort((a, b) =>
      (a.super_nome ?? "").localeCompare(b.super_nome ?? "", "pt-BR")
    );
}, [celulasComLider, supervisoesComCoordenacao, filtroNome]);



  // enviar tudo ao backend somente quando o usuário clicar "Registrar"
  const handleSubmitCoordenacao = async (data: MinisterioCoordenacaoForm) => {
    setUseLoading(true)
    if (!data.nome?.trim()) return toast.error("Informe o nome.");
    if (!data.coordenador_id) return toast.error("Selecione um coordenador.");
    if (!data.genero) return toast.error("Selecione o tipo.");
    if (supersArray.length === 0) return toast.error("Selecione ao menos um supervisor.");

    try {
      const formData = new FormData();
      formData.append("nome", data.nome);
      formData.append("coordenador_id", data.coordenador_id);
      formData.append("genero", data.genero);
      formData.append("supers", JSON.stringify(supersArray));

      const response = await fetch("/api/ministerios/criar/coordenacao", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erro ao criar coordenação.");
        return;
      }

      setUseLoading(false)
      toast.success("Coordenação criada com sucesso!");
      setSupersArray([]);
    } catch (err) {
      setUseLoading(false)
      console.error("Erro ao submeter coordenação:", err);
      toast.error("Erro ao criar coordenação.");
    }
  };

  return (
    <ProtectedLayout>
      { useLoading && (
        <>
          <SpinnerLoading />
        </>
      )}
      <main className="max-w-full h-dvh flex md:h-screen">
        <Navbar />
        <main className="max-w-full w-full overflow-x-hidden xl:mx-auto px-6">
          <header className="w-full flex justify-end px-2 pt-6 md:px-10">
            <Image className="w-12 h-12 rounded-full border border-white"
            src={user?.foto || ""}
            alt="Perfil"
            width={12}
            height={12} />
          </header>

          <section className="max-w-full w-full mt-10 mb-10 md:mt-4">
            <h1 className="text-center font-bold text-4xl font-manrope 
            md:text-start">Criar Coordenação</h1>

            <form onSubmit={handleSubmit(handleSubmitCoordenacao)} 
            className="mt-10 flex flex-col gap-4">
              <div className="w-full flex flex-col gap-4
              md:flex-row md:gap-10">
                <Input nome="Nome da Coordenação" type="text" {...register("nome", { required: true })} />

                <Select nome="Coord. da Coordenação" {...register("coordenador_id", { required: true })}>
                  <option className="text-black" value="">
                    Selecione
                  </option>

                  {coordenadores
                    .filter(coor => !coordenadoresComCoordenacao.includes(coor.id))
                    .map((coor) => (
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
                </Select>
              </div>

              {coordenadores.filter(c => !coordenadoresComCoordenacao.includes(c.id)).length === 0 && (
                <p className="text-yellow-400 mt-2 font-manrope">
                  Todos os coordenadores já possuem uma coordenação.
                </p>
              )}


              <div className="w-full flex flex-col mx-auto justify-end gap-4 mb-6 md:flex-row md:mx-0">
                {/* FILTRO POR NOME */}
                  <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  className="w-full max-w-full mt-10 px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-400 text-white 
                  md:max-w-84 md:mt-0
                  focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
              </div>


              {/* TABELA */}
              <div className="w-full overflow-x-auto max-h-[300px] overflow-y-scroll">
                <table className="min-w-max w-full border-collapse text-white 
                    md:w-full md:min-w-full">
                  <thead>
                    <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                      <th className="text-left rounded-tl-xl">Supervisões Disponíveis</th>
                      <th className="text-left rounded-tr-xl"></th>
                    </tr>
                  </thead>
                  <tbody>
                  {supervisoresFiltrados
                    .filter(item => item.super_cargo?.trim().toLowerCase() === "supervisor")
                    .filter(item => !supervisoesComCoordenacao.includes(item.supervisao_id))
                    .length > 0 ? (

                    supervisoresFiltrados
                      .filter(item => item.super_cargo?.trim().toLowerCase() === "supervisor")
                      .filter(item => !supervisoesComCoordenacao.includes(item.supervisao_id))
                      .map((item) => {
                        const isAdded = supersArray.some(
                          (s) => s.supervisao_id === item.supervisao_id
                        );

                        return (
                          <tr
                            key={item.supervisao_id}
                            className="flex justify-between odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                          >
                            <td className="flex flex-col px-3 py-2 font-manrope font-light">
                              <span className="text-xl font-semibold">{item.nome_supervisao}</span>
                              <span className="text-gray-300">{item.super_nome}</span>
                            </td>

                            <td className="px-3 py-2 flex gap-6 justify-end">
                              <ButtonAction
                                type="button"
                                color={isAdded ? "bg-green-600" : "bg-blue-600"}
                                onClick={() => toggleSupervisor(item)}
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
                        Nenhuma supervisão disponível para adicionar à coordenação.
                      </td>
                    </tr>
                  )}
                </tbody>

                </table>
              </div>

              <button 
              type="submit"
              className="w-full p-4 bg-blue-600 text-white font-manrope font-bold rounded-lg transition-all
              hover:hover:bg-blue-500 hover:cursor-pointer">
                Registrar
              </button>
            </form>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
