"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Spinner } from "@/components/all/spiner";
import { Button } from "@/components/login/buttonAction";
import { ButtonAction } from "@/components/all/buttonAction";
import { Input } from "@/components/inputs";
import Perfil from "../../../public/assets/perfil teste.avif";
import Link from "next/link";
import { IoMdMale, IoMdFemale } from "react-icons/io";
import { IoMaleFemale } from "react-icons/io5";
import { FaRegStar } from "react-icons/fa";
import { TbHearts } from "react-icons/tb";

import { FaWhatsapp } from "react-icons/fa";
import { GoPencil, GoTrash } from "react-icons/go";


type CelulaType = {
  id: string;
  nome: string;
  genero: string;
};

type DiscipulosType = {
  id: string;
  nome: string;
  cargo: string;
  contato: string;
  dataNascimento: string;
  celula_id?: string; // importante para filtrar por célula
};

/* ============================================================
   📊 CELULA PAGE
============================================================ */
export default function Celula() {
  const { user } = useAuth();
  const [celulas, setCelulas] = useState<CelulaType[]>([]);
  const [discipulos, setDiscipulos] = useState<DiscipulosType[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [searchName, setSearchName] = useState("");
  const [filterCargo, setFilterCargo] = useState(""); // "" => todos, ou "Anfitrião","LT","Discípulo"

  /* ============================================================
     📡 BUSCA DE DADOS (SUPABASE + CACHE LOCAL)
  ============================================================ */

  const requestCelulas = useCallback(async () => {
    if (!user?.id) return;

    try {
      const cacheKey = `celulas_${user.id}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        setCelulas(JSON.parse(cachedData));
        setLoading(false);
      }

      const { data, error } = await supabase
        .from("celulas")
        .select("*")
        .eq("responsavel_id", user.id);

      if (error) throw error;

      if (data && JSON.stringify(data) !== cachedData) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        setCelulas(data);
      }
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // FUNÇÃO PARA RESGATAR OS DISCÍPULOS (traz todos e filtramos por célula no cliente)
  const requestDiscipulos = useCallback(async () => {
    try {
      const cacheKey = `discipulos_all`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        setDiscipulos(JSON.parse(cachedData));
      }

      const { data, error } = await supabase.from("discipulos").select("*");

      if (error) throw error;

      if (data) {
        // salva em cache para respostas mais rápidas posteriormente
        localStorage.setItem(cacheKey, JSON.stringify(data));
        setDiscipulos(data);
      }
    } catch (err) {
      console.error("Erro ao resgatar os discípulos no banco.", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      requestCelulas();
      requestDiscipulos();
    }
  }, [user, requestCelulas, requestDiscipulos]);

  function formatDate(date: string) {
    if (!date) return "";

    const [ano, mes, dia] = date.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const normalize = (s: string | undefined) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const currentCelulaId = celulas?.[0]?.id;

  const filteredDiscipulos = useMemo(() => {
    if (!discipulos || discipulos.length === 0) return [];

    // primeiro filtra por célula (se tivermos a célula)
    let arr = discipulos;
    if (currentCelulaId) {
      arr = arr.filter((d) => d.celula_id === currentCelulaId);
    }

    // filtra por nome
    if (searchName.trim() !== "") {
      const s = normalize(searchName);
      arr = arr.filter((d) => normalize(d.nome).includes(s));
    }

    // filtra por cargo (se selecionado)
    if (filterCargo && filterCargo !== "") {
      const target = normalize(filterCargo);
      arr = arr.filter((d) => normalize(d.cargo) === target);
    }

    // ordenação customizada
    const ordem: Record<string, number> = {
      anfitriao: 1,
      lt: 2,
      discipulo: 3,
    };

    // retorna uma cópia ordenada (não muta original)
    return [...arr].sort((a, b) => {
      const pesoA = ordem[normalize(a.cargo)] ?? 99;
      const pesoB = ordem[normalize(b.cargo)] ?? 99;

      if (pesoA !== pesoB) return pesoA - pesoB;

      // se mesmo peso, ordena por nome como fallback
      return normalize(a.nome).localeCompare(normalize(b.nome));
    });
  }, [discipulos, currentCelulaId, searchName, filterCargo]);

  /* ============================================================
     ⏳ CARREGAMENTO
  ============================================================ */
  if (!user || loading) {
    return (
      <main className="w-full h-screen flex justify-center items-center text-white">
        <Spinner />
      </main>
    );
  }

  /* ============================================================
     🎨 RENDERIZAÇÃO PRINCIPAL
  ============================================================ */
  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto px-4">
          <header className="w-full flex justify-end pt-6">
            <Image
              className="w-12 rounded-full border border-white"
              src={Perfil}
              alt="Perfil"
              priority
            />
          </header>

          {/* ==================== PAGE CELULA PRINCIPAL ==================== */}

          <section className="w-full">
            <h1 className="font-bold text-4xl font-manrope">
              <span className="text-xl font-manrope font-light">Célula</span>{" "}
              {celulas[0]?.nome ?? ""}
            </h1>

            <div className="mt-2 flex gap-2">
              <span className="font-manrope">Tipo de célula:</span>
              {celulas[0]?.genero === "masculino" && (
                <>
                  <div className="p-1 w-fit bg-blue-500 rounded-full">
                    <IoMdMale size={16} color="#000" />
                  </div>
                  <span>Masculina</span>
                </>
              )}

              {celulas[0]?.genero === "feminina" && (
                <>
                  <div className="p-1 w-fit bg-pink-500 rounded-full">
                    <IoMdFemale size={16} color="#000" />
                  </div>
                  <span>Feminina</span>
                </>
              )}

              {celulas[0]?.genero === "kids" && (
                <>
                  <div className="p-1 w-fit bg-yellow-500 rounded-full">
                    <FaRegStar size={16} color="#000" />
                  </div>
                  <span>Kids</span>
                </>
              )}

              {celulas[0]?.genero === "mista" && (
                <>
                  <div className="p-1 w-fit bg-green-500 rounded-full">
                    <IoMaleFemale size={16} color="#000" />
                  </div>
                  <span>Mista</span>
                </>
              )}

              {celulas[0]?.genero === "casal" && (
                <>
                  <div className="p-1 w-fit bg-red-500 rounded-full">
                    <TbHearts size={16} color="#000" />
                  </div>
                  <span>Casal</span>
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
                  <option value="" className="text-black font-semibold">Todos</option>
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
                    <th className="p-3 text-center rounded-tr-xl">Ações</th>
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
                          <ButtonAction color="bg-green-600" link="#">
                            <FaWhatsapp size={22} color="#fff" />
                          </ButtonAction>

                          {/* EDITAR */}
                          <ButtonAction color="bg-yellow-700" link="#">
                            <GoPencil size={21} color="#fff" />
                          </ButtonAction>

                          {/* DELETAR */}
                          <ButtonAction color="bg-red-700" link="#">
                            <GoTrash size={21} color="#fff" />
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
                        Não possui cadastro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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
    </ProtectedLayout>
  );
}
