"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Spinner } from "@/components/all/spiner";
import { Button } from "@/components/login/buttonAction";
import { ButtonAction } from "@/components/all/buttonAction";
import { Input } from "@/components/inputs";
import Link from "next/link";
import IncellLogo from "../../../public/assets/file Incell.png";

import { IoMdMale, IoMdFemale } from "react-icons/io";
import { IoMaleFemale } from "react-icons/io5";
import { FaRegStar, FaMale } from "react-icons/fa";
import { TbHearts } from "react-icons/tb";
import { AiOutlineWhatsApp } from "react-icons/ai";
import { IoMdClose } from "react-icons/io";
import { HiMiniUsers } from "react-icons/hi2";
import { FaUserGraduate } from "react-icons/fa6";
import toast from "react-hot-toast";
import { Select } from "@/components/select";
import { BiEdit, BiTrash } from "react-icons/bi";

/* ===================== TYPES ===================== */

type CelulaType = {
  id: string;
  nome: string;
  genero: "masculino" | "feminina" | "kids" | "adolescente" | "jovens" | "mista" | "casal" | "par";
};

type DiscipulosType = {
  id: string;
  nome: string;
  cargo: string;
  contato: string;
  dataNascimento: string;
  celula_id?: string;
};

/* ===================== COMPONENT ===================== */

export default function Celula() {
  const { user } = useAuth();

  const [celula, setCelula] = useState<CelulaType | null>(null);
  const [discipulos, setDiscipulos] = useState<DiscipulosType[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOption, setModalOption] = useState(false);
  const [discipleEdit, setDiscipleEdit] = useState<DiscipulosType | null>(null);
  const [searchName, setSearchName] = useState("");
  const [filterCargo, setFilterCargo] = useState("");

  /* ===================== CACHE CONTROL ===================== */

  function clearCacheIfUserChanged(userId: string) {
    const lastUser = localStorage.getItem("last_user_id");

    if (lastUser !== userId) {
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("celula_responsavel_") ||
          key.startsWith("discipulos_")
        ) {
          localStorage.removeItem(key);
        }
      });

      localStorage.setItem("last_user_id", userId);
    }
  }

  /* ===================== FETCH CÉLULA ===================== */

  const fetchCelula = async () => {
    if (!user?.id) return;

    try {
      clearCacheIfUserChanged(user.id);

      const { data, error } = await supabase
        .from("celulas")
        .select("*")
        .eq("responsavel_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        localStorage.setItem(
          `celula_responsavel_${user.id}`,
          JSON.stringify(data)
        );
        setCelula(data);
      } else {
        setCelula(null);
      }
    } catch (err) {
      console.error("Erro ao buscar célula", err);
      setCelula(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchCelula();
    }
  }, [user?.id]);

  /* ===================== FETCH DISCÍPULOS ===================== */

  const fetchDiscipulos = async () => {
    if (!celula?.id) return;

    try {
      const { data, error } = await supabase
        .from("discipulos")
        .select("*")
        .eq("celula_id", celula.id);

      if (error) throw error;

      localStorage.setItem(
        `discipulos_${celula.id}`,
        JSON.stringify(data || [])
      );

      setDiscipulos(data || []);
    } catch (err) {
      console.error("Erro ao buscar discípulos", err);
      setDiscipulos([]);
    }
  };

  useEffect(() => {
    if (celula?.id) {
      fetchDiscipulos();
    }
  }, [celula?.id]);

  /* ===================== FILTER ===================== */

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredDiscipulos = useMemo(() => {
    let arr = [...discipulos];

    if (searchName) {
      const s = normalize(searchName);
      arr = arr.filter((d) => normalize(d.nome).includes(s));
    }

    if (filterCargo) {
      arr = arr.filter(
        (d) => normalize(d.cargo) === normalize(filterCargo)
      );
    }

    return arr;
  }, [discipulos, searchName, filterCargo]);

  /* ===================== DELETE ===================== */

  async function handleDeleteDisciple(id: string) {
    if (!celula?.id) return;

    const { error } = await supabase
      .from("discipulos")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao deletar discípulo");
      return;
    }

    setDiscipulos((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      localStorage.setItem(
        `discipulos_${celula.id}`,
        JSON.stringify(updated)
      );
      return updated;
    });

    toast.success("Discípulo deletado com sucesso");
  }

  /* ===================== DATE ===================== */

  function formatDate(date: string) {
    if (!date) return "";
    const [ano, mes, dia] = date.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  /* ===================== LOADING ===================== */

  if (!user || loading) {
    return (
      <main className="w-full h-screen flex justify-center items-center text-white">
        <Spinner />
      </main>
    );
  }

  /*====================== MODAL ========================= */

  function handleOpenEditModal(discipulo: DiscipulosType) {
    setDiscipleEdit(discipulo);
    setModalOption(true);
  }


  async function handleUpdateDisciple(e: React.FormEvent) {
    e.preventDefault();
    if (!discipleEdit) return;

    const { error } = await supabase
      .from("discipulos")
      .update({
        nome: discipleEdit.nome,
        cargo: discipleEdit.cargo,
        contato: discipleEdit.contato,
        dataNascimento: discipleEdit.dataNascimento,
      })
      .eq("id", discipleEdit.id);

    if (error) {
      toast.error("Erro ao atualizar discípulo");
      return;
    }

    setDiscipulos((prev) =>
      prev.map((d) => (d.id === discipleEdit.id ? discipleEdit : d))
    );

    toast.success("Discípulo atualizado com sucesso");
    setModalOption(false);
  }


  /* ===================== RENDER ===================== */
  return (
    <ProtectedLayout>

      {!celula && (
        <>
          <main className="w-full h-screen flex justify-center items-center text-white">
            <div className="flex flex-col items-center gap-6">
              <Image src={IncellLogo} alt="Logo Incell" className="w-64" />
              <span className="font-manrope font-semibold text-3xl">
                Você não possui uma célula cadastrada
              </span>
              <Link 
              className="text-xl font-manrope font-light text-blue-400 hover:underline"
              href={"/dashboard"}>
                Voltar para dashboard
              </Link>
            </div>
          </main>
        </>
      )}

      {celula && (
        <>
          <>
            <main className="max-w-full h-screen flex">
              <Navbar />
              <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto px-4">
                <header className="w-full flex justify-end pt-6">
                  <Image
                    className="w-12 h-12 rounded-full border border-white"
                    src={user?.foto || ""}
                    width={12}
                    height={12}
                    alt="Perfil"
                    priority
                  />
                </header>

                {/* ==================== PAGE CELULA PRINCIPAL ==================== */}

                <section className="w-full">
                  <h1 className="font-bold text-4xl font-manrope">
                    <span className="text-xl font-manrope font-light">Célula</span>{" "}
                    {celula?.nome}
                  </h1>

                  <div className="mt-2 flex gap-2">
                    <span className="font-manrope">Tipo de célula:</span>
                    {celula?.genero === "masculino" && (
                      <>
                        <div className="p-1 w-fit bg-blue-500 rounded-full">
                          <IoMdMale size={16} color="#000" />
                        </div>
                        <span>Masculina</span>
                      </>
                    )}

                    {celula?.genero === "feminina" && (
                      <>
                        <div className="p-1 w-fit bg-pink-500 rounded-full">
                          <IoMdFemale size={16} color="#000" />
                        </div>
                        <span>Feminina</span>
                      </>
                    )}

                    {celula?.genero === "kids" && (
                      <>
                        <div className="p-1 w-fit bg-yellow-500 rounded-full">
                          <FaRegStar size={16} color="#000" />
                        </div>
                        <span>Kids</span>
                      </>
                    )}

                    {celula?.genero === "mista" && (
                      <>
                        <div className="p-1 w-fit bg-green-500 rounded-full">
                          <IoMaleFemale size={16} color="#000" />
                        </div>
                        <span>Mista</span>
                      </>
                    )}

                    {celula?.genero === "adolescente" && (
                      <>
                        <div className="p-1 w-fit bg-orange-500 rounded-full">
                          <FaMale size={16} color="#000" />
                        </div>
                        <span>Adolescente</span>
                      </>
                    )}


                    {celula?.genero === "jovens" && (
                      <>
                        <div className="p-1 w-fit bg-cyan-500 rounded-full">
                          <FaUserGraduate size={16} color="#000" />
                        </div>
                        <span>Jovens</span>
                      </>
                    )}

                    {celula?.genero === "casal" && (
                      <>
                        <div className="p-1 w-fit bg-red-500 rounded-full">
                          <TbHearts size={16} color="#000" />
                        </div>
                        <span>Casal</span>
                      </>
                    )}

                    {celula?.genero === "par" && (
                      <>
                        <div className="p-1 w-fit bg-purple-500 rounded-full">
                          <HiMiniUsers size={16} color="#000" />
                        </div>
                        <span>Par</span>
                      </>
                    )}
                  </div>

                  <div className="w-full flex justify-between items-end mt-6">
                    <h1 className="font-bold text-3xl font-manrope">Liderança</h1>

                    <div className="w-max flex gap-4">
                      <div className="w-64">
                        {/* Input de busca por nome ligado ao state */}
                        <Input
                          placeholder="Buscar discípulo por nome"
                          value={searchName}
                          onChange={(e: any) => setSearchName(e.target.value)}
                        />
                      </div>

                      <select
                        name="funcao"
                        value={filterCargo}
                        onChange={(e) => setFilterCargo(e.target.value)}
                        className="bg-[#514F4F]/10 p-3 pr-10 rounded-lg border border-white font-manrope hover:border-blue-400 focus:border-blue-500 focus:ring-blue-400 focus:outline-none"
                      >
                        <option value="" className="text-black font-semibold">Filtrar cargo</option>
                        <option value="Anfitrião" className="text-black font-semibold">Anfitrião</option>
                        <option value="LT" className="text-black font-semibold">LT</option>
                        <option value="Discípulo" className="text-black font-semibold">Discípulo</option>
                      </select>
                    </div>
                  </div>

                  {/* TABELA DE DADOS DA CÉLULA */}

                  <div className="w-full mt-6 overflow-x-auto">
                    <table className="w-full border-collapse text-white">
                      {/* CABEÇALHO */}
                      <thead>
                        <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                          <th className="p-3 text-left rounded-tl-xl">Nome</th>
                          <th className="p-3 text-left">Função</th>
                          <th className="p-3 text-left">Telefone</th>
                          <th className="p-3 text-left">Data de Nascimento</th>
                          <th className="p-3 text-left rounded-tr-xl">Ações</th>
                        </tr>
                      </thead>

                      {/* CORPO */}
                      <tbody>
                        {filteredDiscipulos.length > 0 ? (
                          filteredDiscipulos.map((d) => (
                            <tr
                              key={d.id}
                              className="odd:bg-zinc-900/60 even:bg-zinc-800/10 hover:bg-zinc-800 transition-colors border-b border-zinc-700"
                            >
                              <td className="px-3 py-2 font-manrope font-light">
                                {d.nome}
                              </td>
                              <td className="px-3 py-2 font-manrope font-light capitalize">
                                {d.cargo}
                              </td>
                              <td className="px-3 py-2 font-manrope font-light">
                                {d.contato}
                              </td>
                              <td className="px-3 py-2 font-manrope font-light">
                                {formatDate(d.dataNascimento)}
                              </td>
                              <td className="px-3 py-2 font-manrope font-light text-center flex gap-6 justify-end">
                                {/* WHATSAPP */}
                                <Link href={`https://wa.me/55${d?.contato.slice(1).replace(/\D/g, "")}`} target="_blank">
                                  <ButtonAction type="button" color={"bg-green-600"}>
                                    <div className="w-full flex gap-2">
                                      <AiOutlineWhatsApp size={24} />
                                      Whatsapp
                                    </div>
                                  </ButtonAction>
                                </Link>

                                {/* EDITAR */}
                              <ButtonAction
                                type="button"
                                color={"bg-yellow-600"}
                                onClick={() => handleOpenEditModal(d)}
                              >
                                <div className="w-full flex gap-2">
                                  <BiEdit size={24} />
                                  Editar
                                </div>
                              </ButtonAction>

                                {/* DELETAR */}
                                <ButtonAction type="button" color={"bg-red-600"} onClick={() => handleDeleteDisciple(d.id)}>
                                  <div className="w-full flex gap-2">
                                    <BiTrash size={24} />
                                    Deletar
                                  </div>
                                </ButtonAction>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center p-20 text-white font-manrope font-semibold"
                            >
                              Nenhum discípulo encontrado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* MODAL DE EDIÇÃO DE DISCÍPULOS*/}

                  {modalOption && (
                    <div className="fixed inset-0 bg-black/70 flex justify-center items-start pt-20 z-50">
                      <div className="bg-black border border-white rounded-xl p-6 w-[500px] h-[500px] overflow-y-auto">
                        <div className="flex justify-between items-center pt-4">
                          <div className="w-full flex flex-col">
                            <div className="flex justify-between">
                              <h1 className="text-3xl font-bold font-manrope">Editar Discípulo</h1>
                              <IoMdClose
                              className="hover:cursor-pointer bg-red-600 rounded-sm"
                              onClick={()=> setModalOption(false)}
                              size={24} />
                            </div>
                            <h2 className="text-xl font-light font-manrope text-gray-300 mt-1">{celula?.nome}</h2>

                            <form
                              className="w-full mt-6 flex flex-col gap-4"
                              onSubmit={handleUpdateDisciple}
                            >
                              <Input
                                type="text"
                                nome="Nome do discípulo"
                                value={discipleEdit?.nome || ""}
                                onChange={(e: any) =>
                                  setDiscipleEdit((prev) =>
                                    prev ? { ...prev, nome: e.target.value } : prev
                                  )
                                }
                              />

                              <Select
                                nome="Cargo do discípulo"
                                value={discipleEdit?.cargo || ""}
                                onChange={(e: any) =>
                                  setDiscipleEdit((prev) =>
                                    prev ? { ...prev, cargo: e.target.value } : prev
                                  )
                                }
                              >
                                <>
                                  <option value="" className="text-black font-bold">Selecione...</option>
                                  <option value="LT" className="text-black font-bold">LT</option>
                                  <option value="Anfitrião" className="text-black font-bold">Anfitrião</option>
                                  <option value="Discípulo" className="text-black font-bold">Discípulo</option>
                                </>
                              </Select>

                              <Input
                                nome="WhatsApp"
                                type="text"
                                value={discipleEdit?.contato || ""}
                                onChange={(e: any) =>
                                  setDiscipleEdit((prev) =>
                                    prev ? { ...prev, contato: e.target.value } : prev
                                  )
                                }
                              />

                              <Input
                                nome="Data de Nascimento"
                                type="date"
                                value={discipleEdit?.dataNascimento || ""}
                                onChange={(e: any) =>
                                  setDiscipleEdit((prev) =>
                                    prev ? { ...prev, dataNascimento: e.target.value } : prev
                                  )
                                }
                              />

                              <div className="flex gap-2">
                                <button 
                                type="button"
                                onClick={()=> setModalOption(false)}
                                className="w-full font-manrope bg-gray-600 p-3 rounded font-bold transition-all
                                hover:bg-gray-500 hover:cursor-pointer">
                                  Cancelar
                                </button>

                                <button 
                                type="submit"
                                className="w-full font-manrope bg-blue-600 p-3 rounded font-bold transition-all
                                hover:bg-blue-500 hover:cursor-pointer">
                                  Alterar
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  <div className="w-full flex justify-end mt-10">
                    <div className="w-max">
                      <Link href={"/celula/criar"}>
                        <Button nome="Cadastrar Discípulo" />
                      </Link>
                    </div>
                  </div>
                </section>
              </main>
            </main>
          </>
        </>
      )}
      </ProtectedLayout>
  );
}
