// app/admin/celulas/page.tsx
"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import { Input } from "@/components/inputs";
import { Select } from "@/components/select";
import Image from "next/image";
import Perfil from "../../../../public/assets/perfil teste.avif";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { ButtonAction } from "@/components/all/buttonAction";
import { AiOutlineWhatsApp, AiFillFilePdf } from "react-icons/ai";
import { BiEdit, BiTrash } from "react-icons/bi";


interface CelulaProps {
  id: string;
  nome: string;
  genero: string;
  dia_semana: string;
  responsavel_id: string;
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
      const { data: celulas, error } = await supabase
        .from("celulas")
        .select("id, nome, genero, responsavel_id, dia_semana, horario, bairro, idade")
        .limit(5);

      if (!error && celulas) {
        setCelulasS(celulas);
      }
      setLoading(false);
    }

    buscarCelulas();
    buscarUsuarios();
  }, []);

  async function buscarUsuarios() {
    const { data: usuarios, error } = await supabase
      .from("users")
      .select("id, nome, cargo")
      .limit(5);

    if (!error && usuarios) {
      setUsuariosS(usuarios);
    }
  }

  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-full w-full overflow-x-hidden xl:mx-auto px-6">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image className="w-12 rounded-full border border-white" src={Perfil} alt="Perfil" />
          </header>

          <section className="max-w-full w-full md:mt-14 mb-10">
            {/* TITLE E BOTÃO DE PDF */}
            <div className="flex justify-between">
              <h1 className="font-bold text-4xl font-manrope">{celulasS.length} Células</h1>

              <ButtonAction
                type="button"
                color={"bg-blue-600 hover:bg-blue-800"}>
                <div className="flex gap-2 items-center">
                  <AiFillFilePdf size={24} />
                  <span className="font-manrope text-xl">Gerar PDF</span>
                </div>
              </ButtonAction>
            </div>

            {/* FILTROS */}
            <div className="mt-6 flex gap-4 justify-between items-center">
              <span className="font-manrope text-xl">Filtrar</span>

              <Input placeholder="Nome do Líder (ou) Nome da Célula" />

              <Select>
                <option className="text-black font-semibold" value="">
                  Bairro
                </option>
                {/* ...restante das opções */}
              </Select>

              <Select>
                <option value="" className="text-black font-semibold">
                  Tipo da Célula
                </option>
                {/* ...restante das opções */}
              </Select>

              <ButtonAction type="button" color={"bg-blue-600"}>
                <div className="flex gap-2 items-center">
                  <span className="font-manrope text-md">Limpar</span>
                </div>
              </ButtonAction>
            </div>

            {loading ? (
              <p className="text-white mt-16 font-manrope">Carregando...</p>
            ) : (
              <div className="w-full mt-10 overflow-x-auto max-h-[20em] overflow-y-scroll">
                <table className="w-full border-collapse text-white h-10">
                  <thead>
                    <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                      <th className="p-3 text-left rounded-tl-xl">Nome de Célula e Líder</th>
                      <th className="p-3 text-left">Tipo</th>
                      <th className="p-3 text-left">Bairro</th>
                      <th className="p-3 text-left rounded-tr-xl">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {celulasS.length > 0 ? (
                      celulasS.map((item) => {
                        const lider = usuariosS.find(
                          (u) => u.id === item.responsavel_id && u.cargo === "lider"
                        );

                        return (
                          <tr
                            key={item.id}
                            className="odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                          >
                            <td className="px-3 py-2 font-manrope">
                              <span className="text-xl font-semibold">{item.nome}</span>
                              {lider ? (
                                <div className="text-gray-300">{lider.nome}</div>
                              ) : (
                                <div className="text-gray-500 italic">Sem líder</div>
                              )}
                            </td>

                            <td className="px-3 py-2 font-manrope">
                              {item.genero.charAt(0).toUpperCase() + item.genero.substring(1)}
                            </td>

                            <td className="px-3 py-2 font-manrope">{item.bairro}</td>

                            <td className="px-3 py-3 flex gap-6 justify-end">
                              <ButtonAction type="button" color={"bg-green-600"}>
                                <div className="flex gap-2 items-center">
                                  <AiOutlineWhatsApp size={24} />
                                  <span className="font-manrope text-md">Whatsapp</span>
                                </div>
                              </ButtonAction>

                              <ButtonAction type="button" color={"bg-yellow-600"}>
                                <div className="flex gap-2 items-center">
                                  <BiEdit size={24} />
                                  <span className="font-manrope text-md">Editar</span>
                                </div>
                              </ButtonAction>

                              <ButtonAction type="button" color={"bg-red-600"}>
                                <div className="flex gap-2 items-center">
                                  <BiTrash size={24} />
                                  <span className="font-manrope text-md">Deletar</span>
                                </div>
                              </ButtonAction>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
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
