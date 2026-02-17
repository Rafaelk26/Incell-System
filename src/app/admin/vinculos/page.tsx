"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import { Input } from "@/components/inputs";
import { Select } from "@/components/select";
import { ButtonAction } from "@/components/all/buttonAction";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import { AiFillCloseCircle } from "react-icons/ai";
import { BiTrash } from "react-icons/bi";
import toast from "react-hot-toast";
import Image from "next/image";
import { useAuth } from "@/app/context/useUser";



interface Celula {
  id: string;
  nome: string;
  lider_nome: string | null;
}

interface Vinculo {
  id: string;
  celula_principal: Celula | null;
  celula_vinculada: Celula | null;
}




export default function AdminVinculos() {
  const { user } = useAuth();

  const [celulas, setCelulas] = useState<Celula[]>([]);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [celulaPrincipal, setCelulaPrincipal] = useState("");
  const [celulaVinculada, setCelulaVinculada] = useState("");

  useEffect(() => {
    buscarCelulas();
    buscarVinculos();
  }, []);

    async function buscarCelulas() {
        const { data, error } = await supabase
            .from("celulas")
            .select(`
            id,
            nome,
            lider:responsavel_id (
                nome
            )
            `)
            .order("nome");

        if (error || !data) {
            toast.error("Erro ao carregar células");
            return;
        }

        const formatadas: Celula[] = data.map((c: any) => ({
            id: c.id,
            nome: c.nome,
            lider_nome: c.lider?.nome ?? null,
        }));

        setCelulas(formatadas);
    }



    async function buscarVinculos() {
        setLoading(true);

        const { data, error } = await supabase
            .from("vinculos")
            .select(`
            id,
            celula_principal:celulas!vinculos_celula_principal_id_fkey (
                id,
                nome,
                lider:responsavel_id ( nome )
            ),
            celula_vinculada:celulas!vinculos_celula_vinculada_id_fkey (
                id,
                nome,
                lider:responsavel_id ( nome )
            )
            `);

        if (error || !data) {
            console.error("Erro buscarVinculos:", error);
            setLoading(false);
            return;
        }

        const vinculosFormatados: Vinculo[] = data.map((v: any) => ({
            id: v.id,
            celula_principal: v.celula_principal
            ? {
                id: v.celula_principal.id,
                nome: v.celula_principal.nome,
                lider_nome: v.celula_principal.lider?.nome ?? null,
                }
            : null,
            celula_vinculada: v.celula_vinculada
            ? {
                id: v.celula_vinculada.id,
                nome: v.celula_vinculada.nome,
                lider_nome: v.celula_vinculada.lider?.nome ?? null,
                }
            : null,
        }));

        setVinculos(vinculosFormatados);
        setLoading(false);
        }




  async function handleCreateVinculo() {
    if (!celulaPrincipal || !celulaVinculada) {
      toast.error("Selecione as duas células");
      return;
    }

    if (celulaPrincipal === celulaVinculada) {
      toast.error("Uma célula não pode ser vinculada a ela mesma");
      return;
    }

    const { error } = await supabase.from("vinculos").insert({
      celula_principal_id: celulaPrincipal,
      celula_vinculada_id: celulaVinculada,
    });

    if (error) {
      toast.error("Erro ao criar vínculo");
      return;
    }

    toast.success("Vínculo criado com sucesso!");
    setModalOpen(false);
    setCelulaPrincipal("");
    setCelulaVinculada("");
    buscarVinculos();
  }


  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("vinculos")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao remover vínculo");
      return;
    }

    toast.success("Vínculo removido");
    buscarVinculos();
  }

  return (
    <ProtectedLayout>
      <main className="max-w-full h-dvh flex md:h-screen">
        <Navbar />

        <main className="max-w-[84rem] w-full xl:mx-auto px-4">
          <header className="w-full flex justify-end px-2 pt-6 md:px-10">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              src={user?.foto || ""}
              width={48}
              height={48}
              alt="Perfil"
            />
          </header>

          <section className="mt-10">
            <div className="flex flex-col justify-center items-center gap-4
            md:justify-between md:flex-row md:gap-0">
              <h1 className="font-bold text-4xl font-manrope">Vínculos de Células</h1>

              <ButtonAction
                type="button"
                color="bg-blue-600"
                onClick={() => setModalOpen(true)}
              >
                Novo Vínculo
              </ButtonAction>
            </div>

            {/* TABELA */}
            {loading ? (
              <p className="mt-10 font-manrope">Carregando...</p>
            ) : (
              <div className="mt-10 overflow-x-auto">
                <table className="min-w-[800px] w-full text-white">
                  <thead>
                    <tr className="bg-zinc-900">
                      <th className="p-3 text-left font-manrope">Célula Principal</th>
                      <th className="p-3 text-left font-manrope">Célula Vinculada</th>
                      <th className="p-3 text-right font-manrope">Ações</th>
                    </tr>
                  </thead>
                    <tbody>
                        {vinculos.length > 0 ? (
                            vinculos.map((v) => (
                                <tr key={v.id} className="odd:bg-zinc-900/60 even:bg-zinc-800/10 hover:bg-zinc-800 transition-colors border-b border-zinc-700">
                                <td className="p-3">
                                    <div className="font-semibold font-manrope">
                                        {v.celula_principal?.nome ?? "—"}
                                    </div>
                                    <div className="text-sm font-manrope text-gray-400">
                                        {v.celula_principal?.lider_nome ?? ""}
                                    </div>
                                    </td>

                                    <td className="p-3">
                                    <div className="font-semibold font-manrope">
                                        {v.celula_vinculada?.nome ?? "—"}
                                    </div>
                                    <div className="text-sm font-manrope text-gray-400">
                                        {v.celula_vinculada?.lider_nome ?? ""}
                                    </div>
                                </td>


                                <td className="p-3 text-right">
                                    <ButtonAction
                                    type="button"
                                    color="bg-red-600"
                                    onClick={() => handleDelete(v.id)}
                                    >
                                    <BiTrash size={20} />
                                    </ButtonAction>
                                </td>
                                </tr>
                            ))
                            ) : (
                            <tr>
                                <td colSpan={3} className="p-6 text-center">
                                Nenhum vínculo criado
                                </td>
                            </tr>
                            )}

                    </tbody>
                </table>
              </div>
            )}
          </section>

          {/* MODAL */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black/70 flex justify-center items-start pt-24 z-50">
              <div className="w-11/12 bg-black border border-white rounded-xl p-6 md:w-[420px]">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Novo Vínculo</h2>
                  <button onClick={() => setModalOpen(false)}>
                    <AiFillCloseCircle size={24} />
                  </button>
                </div>

                <div className="mt-6 flex flex-col gap-4">
                  <Select onChange={(e) => setCelulaPrincipal(e.target.value)}>
                    <option value="" className="font-bold text-black font-manrope">Célula Principal</option>
                    {celulas.map((c) => (
                        <option key={c.id} value={c.id} className="font-bold text-black font-manrope">
                        {c.nome} {c.lider_nome ? `— ${c.lider_nome}` : ""}
                        </option>
                    ))}
                    </Select>

                    <Select onChange={(e) => setCelulaVinculada(e.target.value)}>
                    <option value="" className="font-bold text-black font-manrope">Célula Vinculada</option>
                    {celulas.map((c) => (
                        <option key={c.id} value={c.id} className="font-bold text-black font-manrope">
                        {c.nome} {c.lider_nome ? `— ${c.lider_nome}` : ""}
                        </option>
                    ))}
                </Select>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <ButtonAction
                    type="button"
                    color="bg-gray-600"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </ButtonAction>

                  <ButtonAction
                    type="button"
                    color="bg-blue-600"
                    onClick={handleCreateVinculo}
                  >
                    Salvar
                  </ButtonAction>
                </div>
              </div>
            </div>
          )}
        </main>
      </main>
    </ProtectedLayout>
  );
}
