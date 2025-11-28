// app/admin/celulas/page.tsx 
"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import Perfil from "../../../../public/assets/perfil teste.avif";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { ButtonAction } from "@/components/all/buttonAction";

interface CelulaProps {
  id: string;
  nome: string;
  genero: string;
  dia_semana: string;
  responsavel_id: string;
  supervisor_id: string;
  horario: string;
  bairro: string;
  idade: string;
}

interface UsuarioProps {
  id: string;
  nome: string;
  cargo: string;
}

export default function AdminCelulas() {
  const [celulasS, setCelulasS] = useState<CelulaProps[]>([]);
  const [usuariosS, setUsuariosS] = useState<UsuarioProps[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function buscarCelulas() {
      const { data, error } = await supabase
        .from("celulas")
        .select("id, nome, genero, responsavel_id, supervisor_id, dia_semana, horario, bairro, idade")

      if (!error && data) {
        setCelulasS(data);
      }

      setLoading(false);
    }

    buscarCelulas();
    buscarUsuarios();
  }, []);


  async function buscarUsuarios() {
    const { data: usuarios, error } = await supabase
      .from("users")
      .select("id, nome, cargo");

    if (error) throw error;

    setUsuariosS(usuarios);
  }


  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-full w-full overflow-x-hidden xl:mx-auto px-6">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image className="w-12 rounded-full border border-white" src={Perfil} alt="Perfil" />
          </header>

          <section className="max-w-full w-full md:mt-14">
            <h1 className="font-bold text-4xl font-manrope">Células</h1>

            {loading ? (
              <p className="text-white mt-10">Carregando...</p>
            ) : (
              <div className="w-full mt-10 overflow-x-auto">
                <table className="w-full border-collapse text-white">
                  <thead>
                    <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                      <th className="p-3 text-left rounded-tl-xl">Nome de Célula e Líder</th>
                      <th className="p-3 text-left">Superv.</th>
                      <th className="p-3 text-left">Tipo</th>
                      <th className="p-3 text-left">Bairro</th>
                      <th className="p-3 text-left rounded-tr-xl">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {celulasS.length > 0 ? (
                      celulasS.map((item) => {

                        // LÍDER
                        const lider = usuariosS.find(u => u.id === item.responsavel_id && u.cargo === "lider");

                        // SUPERVISOR
                        const supervisor = usuariosS.find(u => u.id === item.supervisor_id && u.cargo === "supervisor");

                        return (
                          <tr
                            key={item.id}
                            className="border flex justify-between odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                          >
                            {/* Nome + Líder */}
                            <td className="flex flex-col px-3 py-2 font-manrope font-light">
                              <span className="text-xl font-semibold">{item.nome}</span>

                              {lider ? (
                                <span className="text-gray-300">{lider.nome}</span>
                              ) : (
                                <span className="text-gray-500 italic">Sem líder</span>
                              )}
                            </td>

                            {/* SUPERVISOR */}
                            <td className="flex flex-col px-3 py-2 font-manrope font-light">
                              {supervisor ? (
                                <span>{supervisor.nome}</span>
                              ) : (
                                <span className="text-gray-500 italic">Sem supervisor</span>
                              )}
                            </td>

                            {/* TIPO */}
                            <td className="flex flex-col px-3 py-2 font-manrope font-light">
                              <span>{item.genero}</span>
                            </td>

                            {/* BAIRRO */}
                            <td className="flex flex-col px-3 py-2 font-manrope font-light">
                              <span>{item.bairro}</span>
                            </td>

                            {/* AÇÕES */}
                            <td className="px-3 py-2 flex gap-6 justify-end">
                              <ButtonAction type="button" color={"bg-blue-600"}>
                                <span className="font-manrope text-xl">Botão</span>
                              </ButtonAction>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center p-6 text-white font-manrope font-semibold"
                        >
                          Nenhuma célula registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
