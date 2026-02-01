"use client";

import Image from "next/image";
import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import { useAuth } from "@/app/context/useUser";
import { ButtonAction } from "@/components/all/buttonAction";
import { BiTrash } from "react-icons/bi";
import { FaAnglesUp } from "react-icons/fa6";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===================== TYPES ===================== */

type Lider = {
  id: string;
  nome: string;
  cargo: string;
};

/* ===================== COMPONENT ===================== */

export default function Promover() {
  const { user } = useAuth();

  const [lideres, setLideres] = useState<Lider[]>([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");

  /* ===== MODAIS ===== */
  const [modalPromover, setModalPromover] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);

  const [liderSelecionado, setLiderSelecionado] = useState<Lider | null>(null);
  const [novoCargo, setNovoCargo] = useState("");

  /* ===================== FETCH ===================== */

  async function fetchLideres() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, nome, cargo")
        .neq("cargo", "admin");

      if (error) throw error;

      setLideres(data ?? []);
    } catch (error) {
      console.error("Erro ao buscar líderes:", error);
    }
  }

  /* ===================== FILTROS ===================== */

  const lideresFiltrados = useMemo(() => {
    return lideres.filter((lider) => {
      const matchNome = lider.nome
        .toLowerCase()
        .includes(filtroNome.toLowerCase());

      const matchCargo = filtroCargo
        ? lider.cargo === filtroCargo
        : true;

      return matchNome && matchCargo;
    });
  }, [lideres, filtroNome, filtroCargo]);

  /* ===================== PROMOVER ===================== */

  async function promoverLider() {
    if (!liderSelecionado || !novoCargo) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ cargo: novoCargo })
        .eq("id", liderSelecionado.id);

      if (error) throw error;

      setModalPromover(false);
      setNovoCargo("");
      setLiderSelecionado(null);

      fetchLideres();
    } catch (error) {
      console.error("Erro ao promover líder:", error);
    }
  }

  /* ===================== EXCLUIR ===================== */

  async function excluirLider() {
    if (!liderSelecionado) return;

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", liderSelecionado.id);

      if (error) throw error;

      setModalExcluir(false);
      setLiderSelecionado(null);

      fetchLideres();
    } catch (error) {
      console.error("Erro ao excluir líder:", error);
    }
  }

  useEffect(() => {
    fetchLideres();
  }, [user?.id]);

  /* ===================== UI ===================== */

  return (
    <ProtectedLayout>
      <main className="max-w-full h-dvh flex 
      md:h-screen">
        <Navbar />

        <main className="max-w-[84rem] w-full overflow-x-hidden 
        xl:mx-auto">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              width={48}
              height={48}
              src={user?.foto || ""}
              alt="Perfil"
            />
          </header>

          <section className="w-full flex flex-col mt-10 items-center
          md:mt-14 md:px-6">
            <div className="w-96 flex justify-between flex-col 
            md:flex-row md:w-full">
                <h1 className="text-center font-bold text-4xl font-manrope mb-6">
                    Usuários
                </h1>

                {/* SELECT DE FILTRAGEM DOS NOMES E CARGOS */}
                <div className="flex flex-col gap-4 mb-6 md:flex-row">
                    
                    {/* FILTRO POR NOME */}
                    <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={filtroNome}
                    onChange={(e) => setFiltroNome(e.target.value)}
                    className="w-full max-w-sm px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />

                    {/* FILTRO POR CARGO */}
                    <select
                    value={filtroCargo}
                    onChange={(e) => setFiltroCargo(e.target.value)}
                    className="w-full max-w-full px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                    <option value="">Todos os cargos</option>
                    <option value="lider">Líder</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="coordenador">Coordenador</option>
                    <option value="pastor">Pastor</option>
                    </select>

                </div>
            </div>


            {/* TABELA DE LÍDERES */}   
            <div className="w-full max-h-[500px] px-4 overflow-y-auto rounded-xl md:px-0">
              <table className="w-full min-w-[550px] border-collapse text-white 
              md:w-full">
                <thead>
                  <tr className="bg-zinc-950/90">
                    <th className="p-3 text-left rounded-tl-xl">
                      Nome do Líder
                    </th>
                    <th className="p-3 text-left">Cargo</th>
                    <th className="p-3 text-right rounded-tr-xl">
                      Ações
                    </th>
                  </tr>
                </thead>

                {/* Altura fixa + scroll */}
                <tbody>
                  {lideresFiltrados.map((lider) => (
                    <tr
                      key={lider.id}
                      className="odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                    >
                      <td className="px-3 py-3 font-semibold font-manrope">
                        {lider.nome}
                      </td>

                      <td className="px-3 py-3 font-manrope">
                        {lider.cargo.charAt(0).toUpperCase() +
                          lider.cargo.slice(1)}
                      </td>

                      <td className="px-3 py-3 flex gap-4 justify-end">
                        <ButtonAction
                          type="button"
                          color="bg-green-600"
                          onClick={() => {
                            setLiderSelecionado(lider);
                            setModalPromover(true);
                          }}
                        >
                        <div className="flex items-center gap-1">
                            <FaAnglesUp size={20} />
                            Promover
                        </div>
                        </ButtonAction>

                        <ButtonAction
                          type="button"
                          color="bg-red-600"
                          onClick={() => {
                            setLiderSelecionado(lider);
                            setModalExcluir(true);
                          }}
                        >
                        <div className="flex items-center gap-1">
                          <BiTrash size={22} />
                          Deletar
                        </div>

                        </ButtonAction>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* ===================== MODAL PROMOVER ===================== */}
        {modalPromover && liderSelecionado && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-md text-white">
              <h2 className="text-2xl font-bold mb-4">
                Promover {liderSelecionado.cargo.charAt(0).toUpperCase() + liderSelecionado.cargo.slice(1)}
              </h2>

              <p className="mb-1">
                <strong>Nome:</strong> {liderSelecionado.nome}
              </p>
              <p className="mb-4">
                <strong>Cargo atual:</strong>{" "}
                {liderSelecionado.cargo.charAt(0).toUpperCase() + liderSelecionado.cargo.slice(1)}
              </p>

              {/* Input de novo cargo */}
              <select
                className="w-full p-2 rounded bg-zinc-800 mb-6"
                value={novoCargo}
                onChange={(e) => setNovoCargo(e.target.value)}
              >
                <option value="">Selecione o novo cargo</option>
                <option value="lider">Líder</option>
                <option value="supervisor">Supervisor</option>
                <option value="coordenador">Coordenador</option>
                <option value="pastor">Pastor</option>
              </select>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setModalPromover(false)}
                  className="px-4 py-2 bg-zinc-700 rounded hover:cursor-pointer hover:scale-105 transition-transform"
                >
                  Cancelar
                </button>
                <button
                  onClick={promoverLider}
                  className="px-4 py-2 bg-green-600 rounded hover:cursor-pointer hover:scale-105 transition-transform"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== MODAL EXCLUIR ===================== */}
        {modalExcluir && liderSelecionado && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-md text-white">
              <h2 className="text-2xl font-bold mb-4 text-red-500">
                Atenção!
              </h2>

              <p className="mb-4">
                Ao excluir <strong>{liderSelecionado.nome}</strong>,
                <span className="text-red-400 font-semibold">
                  {" "}
                  TODOS os vínculos abaixo também serão removidos:
                </span>
              </p>

              <ul className="list-disc ml-5 mb-6 text-sm text-gray-300">
                <li>Célula vinculada</li>
                <li>Supervisão vinculada</li>
                <li>Coordenação vinculada</li>
                <li>Histórico de liderança e registros</li>
              </ul>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setModalExcluir(false)}
                  className="px-4 py-2 bg-zinc-700 rounded hover:cursor-pointer hover:scale-105 transition-transform"
                >
                  Cancelar
                </button>
                <button
                  onClick={excluirLider}
                  className="px-4 py-2 bg-red-600 rounded hover:cursor-pointer hover:scale-105 transition-transform"
                >
                  Excluir definitivamente
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedLayout>
  );
}
