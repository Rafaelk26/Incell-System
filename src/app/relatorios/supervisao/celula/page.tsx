"use client";

export const dynamic = "force-dynamic";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../../../context/useUser";
import { Navbar } from "@/components/all/navBar";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Incell from "../../../../../public/assets/file Incell black.png";
import Image from "next/image";
import Link  from "next/link";
import { ButtonAction } from "@/components/all/buttonAction";
import { IoIosAdd } from "react-icons/io";

/* =========================
   TYPES
========================= */

export default function CelulasSupervisao() {
  const { user } = useAuth();

  const [leaders, setLeaders] = useState<any[]>([]);

  const getLeaders = useCallback(async () => {
    if (!user) return;

    // PARA CARGOS DE SUPERVISOR

    if(user.cargo === "supervisor") {
      try {

      /* 🔎 buscar supervisão do supervisor */
      const { data: supervisao } = await supabase
        .from("supervisoes")
        .select("id")
        .eq("supervisor_id", user.id)
        .single();

      if (!supervisao) return;

      /* 🔎 buscar líderes + células */
      const { data, error } = await supabase
        .from("supervisao_lideres")
        .select(`
          lider:lider_id (
            id,
            nome,
            celulas (
              id,
              nome
            )
          )
        `)
        .eq("supervisao_id", supervisao.id);

      if (error) throw error;

      const formatted =
        data?.map((item: any) => ({
          id: item.lider.id,
          nome: item.lider.nome,
          celula_id: item.lider.celulas?.[0]?.id,
          celula_nome: item.lider.celulas?.[0]?.nome,
        })) || [];

      setLeaders(formatted);

      } catch (error) {
        console.error("Erro ao buscar líderes:", error);
      }
    }

    // PARA CARGOS DE COORDENADOR

    if(user.cargo === "coordenador") {
      try {

      /* 🔎 buscar coordenação do coordenador */
      const { data: coordenacao } = await supabase
        .from("coordenacoes")
        .select("id")
        .eq("coordenador_id", user.id)
        .single();

      if (!coordenacao) return;

      /* 🔎 buscar supervisões da coordenação */
      const { data: supervisoes } = await supabase
        .from("coordenacao_supervisoes")
        .select(`
          supervisao:supervisao_id (
            id,
            supervisor:supervisor_id (
              id,
              nome,
              celulas (
                id,
                nome
              )
            )
          )
        `)
        .eq("coordenacao_id", coordenacao.id);

      if (!supervisoes) return;

      const formatted =
        supervisoes.map((item: any) => ({
          id: item.supervisao.supervisor.id,
          nome: item.supervisao.supervisor.nome,
          celula_id: item.supervisao.supervisor.celulas?.[0]?.id,
          celula_nome: item.supervisao.supervisor.celulas?.[0]?.nome,
        }));

      setLeaders(formatted);
        
      
      } catch (error) {
        console.error("Erro ao buscar supervisores:", error);
      }
    }

    
  }, [user]);

  useEffect(() => {
    getLeaders();
  }, [getLeaders]);

  /* =========================
   COMPONENT
  ========================= */

  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto">
          <header className="w-full flex justify-end px-6 pt-6 md:px-10">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              width={12}
              height={12}
              src={user?.foto || ""}
              alt="Perfil"
            />
          </header>

          <section className="max-w-6xl w-full px-10 flex flex-col justify-center 
          md:mt-4 md:mb-10">
            <h1 className="font-bold text-3xl font-manrope text-center mt-4
            md:text-4xl md:text-start md:mt-0">
              Selecionar Célula
            </h1>

            <section className="w-full mt-6 flex flex-col items-center">
              <table className="min-w-[1100px] border-collapse text-white 
                    md:w-full md:min-w-full">
                      {/* CABEÇALHO */}
                      <thead>
                        <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                          <th className="p-3 text-left rounded-tl-xl">Célula</th>
                          <th className="p-3 text-left">Líder</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>

                      {/* CORPO */}
                      <tbody>
                        {leaders.map((leader) => (
                          <tr
                              key={leader.id}
                              className="odd:bg-zinc-900/60 even:bg-zinc-800/10 hover:bg-zinc-800 transition-colors border-b border-zinc-700"
                            >
                              <td className="px-3 py-2 font-manrope font-light">
                                {leader.celula_nome || "Não encontrado"}
                              </td>
                              <td className="px-3 py-2 font-manrope font-light">
                                {leader.nome || "Não encontrado"}
                              </td>

                              <td className="px-3 py-2 font-manrope font-light text-center">
                                {/* ADICIONAR */}

                                <Link
                                  href={`/relatorios/supervisao/celulas/${leader.id}`}
                                >
                                  <ButtonAction type="button" color={"bg-green-600 hover:bg-green-500"}>
                                    <div className="flex gap-2 items-center">
                                        <IoIosAdd size={24} color="#fff" />
                                        <span className="text-sm">Selecionar</span>
                                    </div>
                                  </ButtonAction>
                                </Link>
                              </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
