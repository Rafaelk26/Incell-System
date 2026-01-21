"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Spinner } from "@/components/all/spiner";
import { ButtonAction } from "@/components/all/buttonAction";
import { Input } from "@/components/inputs";
import Link from "next/link";
import IncellLogo from "../../../public/assets/file Incell.png";

import { IoMdMale, IoMdFemale } from "react-icons/io";
import { AiOutlineWhatsApp } from "react-icons/ai";
import { FaRegEye } from "react-icons/fa";


/* ===================== TYPES ===================== */

type SupervisaoType = {
  id: string;
  nome: string;
  genero: "masculina" | "feminina";
  coordenador_id: string;
};

type SupervisaoRenderType = {
  id: string;
  nome: string;
  genero: "masculina" | "feminina";
  supervisor: {
    id: string;
    nome: string;
    telefone: string;
    dataNascimento: string;
  };
};

type CoordenacaoSupervisoesRow = {
  supervisoes: {
    id: string;
    nome: string;
    genero: "masculina" | "feminina";
    supervisor: {
      id: string;
      nome: string;
      telefone: string;
      dataNascimento: string;
    } | null;
  } | null;
};



type PDFsType = {
  id: string;
  responsavel: string;
  tipo: string;
  conteudo: {
    signed_url: string;
  };
  celula_id: string;
  file_path: string;
};

/* ===================== COMPONENT ===================== */

export default function Coordenacoes() {
  const { user } = useAuth();

  const [coordenacao, setCoordenacao] = useState<SupervisaoType | null>(null);
  const [supervisores, setSupervisores] = useState<SupervisaoRenderType[]>([]);
  const [pdfs, setPDFs] = useState<PDFsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  

  /* ===================== COORDENAÇÃO ===================== */

  const fetchCoordenacao = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("coordenacoes")
        .select("*")
        .eq("coordenador_id", user.id)
        .single();

      if (error) throw error;

      setCoordenacao(data);
    } catch (err) {
      console.error("Erro ao buscar supervisão", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordenacao();
  }, [user?.id]);

  /* ===================== LÍDERES ===================== */

  const fetchSupervisoes = async (coordenacaoId: string) => {
  try {
    const { data, error } = await supabase
      .from("coordenacao_supervisoes")
      .select(`
        supervisoes (
          id,
          nome,
          genero,
          supervisor:users (
            id,
            nome,
            telefone,
            dataNascimento
          )
        )
      `)
      .eq("coordenacao_id", coordenacaoId)
      .returns<CoordenacaoSupervisoesRow[]>(); // 👈 CRÍTICO

    if (error) throw error;

    const supervisoesFormatadas: SupervisaoRenderType[] =
      data
        ?.map((item) => item.supervisoes)
        .filter(
          (sup): sup is NonNullable<CoordenacaoSupervisoesRow["supervisoes"]> =>
            !!sup && !!sup.supervisor
        )
        .map((sup) => ({
          id: sup.id,
          nome: sup.nome,
          genero: sup.genero,
          supervisor: sup.supervisor!,
        })) ?? [];

    setSupervisores(supervisoesFormatadas);
  } catch (err) {
    console.error("Erro ao buscar supervisões", err);
  }
};



useEffect(() => {
  if (coordenacao?.id) {
    fetchSupervisoes(coordenacao.id);
  }
}, [coordenacao?.id]);




  /* ===================== RELATÓRIOS (PDFs) ===================== */

  const fetchPDFs = async (liderIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from("relatorios")
        .select("*")
        .in("responsavel", liderIds);

      if (error) throw error;

      console.log(data)
      setPDFs(data ?? []);
    } catch (err) {
      console.error("Erro ao buscar relatórios", err);
    }
  };

  useEffect(() => {
    if (supervisores.length > 0) {
      const ids = supervisores.map((l) => l.id);
      fetchPDFs(ids);
    }
  }, [supervisores]);

  /* ===================== FILTRO ===================== */

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredSupervisores = useMemo(() => {
    if (!searchName) return supervisores;
    const s = normalize(searchName);
    return supervisores.filter((l) => normalize(l.nome).includes(s));
  }, [supervisores, searchName]);

  const pdfPorSupervisor = useMemo(() => {
  const map = new Map<string, PDFsType>();

  pdfs.forEach((pdf) => {
    map.set(pdf.responsavel, pdf);
  });

  return map;
}, [pdfs]);


  /* ===================== HELPERS ===================== */

  const formatDate = (date: string) => {
    const [ano, mes, dia] = date.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const gerarLinkWhatsApp = (telefone: string) => {
    const numero = telefone.replace(/\D/g, "");
    return `https://wa.me/${numero.startsWith("55") ? numero : `55${numero}`}`;
  };

  /* ===================== LOADING ===================== */

  if (!user || loading) {
    return (
      <main className="w-full h-screen flex justify-center items-center text-white">
        <Spinner />
      </main>
    );
  }

  /* ===================== SEM COORDENAÇÃO ===================== */

  if (!coordenacao) {
    return (
      <ProtectedLayout>
        <main className="w-full h-screen flex justify-center items-center text-white">
          <div className="flex flex-col items-center gap-6">
            <Image src={IncellLogo} alt="Logo Incell" className="w-64" />
            <span className="text-2xl font-semibold font-manrope">
              Você não possui uma coordenação cadastrada
            </span>
          </div>
        </main>
      </ProtectedLayout>
    );
  }

  /* ===================== RENDER ===================== */
  return (
    <ProtectedLayout>
        <>
          <>
            <main className="max-w-full h-screen flex">
              <Navbar />
              <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto px-4">
                <header className="w-full flex justify-end pt-6">
                  <Image
                    className="w-12 h-12 rounded-full border border-white"
                    width={12}
                    height={12}
                    src={user?.foto || ""}
                    alt="Perfil"
                    priority
                  />
                </header>

                {/* ==================== PAGE SUPERVISÃO PRINCIPAL ==================== */}

                <section className="w-full">
                  <h1 className="font-bold text-4xl font-manrope">
                    <span className="text-xl font-manrope font-light">Coordenação</span>{" "}
                    {coordenacao?.nome}
                  </h1>

                  <div className="mt-2 flex gap-2">
                    <span className="font-manrope">Tipo de coordenação:</span>
                    {coordenacao?.genero === "masculina" && (
                      <>
                        <div className="p-1 w-fit bg-blue-500 rounded-full">
                          <IoMdMale size={16} color="#000" />
                        </div>
                        <span>Masculina</span>
                      </>
                    )}

                    {coordenacao?.genero === "feminina" && (
                      <>
                        <div className="p-1 w-fit bg-pink-500 rounded-full">
                          <IoMdFemale size={16} color="#000" />
                        </div>
                        <span>Feminina</span>
                      </>
                    )}
                  </div>

                  <div className="w-full flex justify-between items-end mt-6">
                    <h1 className="font-bold text-3xl font-manrope">Supervisões</h1>

                    <div className="w-max flex gap-4">
                      <div className="w-64">
                        {/* Input de busca por nome ligado ao state */}
                        <Input
                          placeholder="Buscar supervisão por nome"
                          value={searchName}
                          onChange={(e: any) => setSearchName(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* TABELA DE DADOS DA CÉLULA */}

                  <div className="w-full h-[380px] mt-6 overflow-x-auto">
                    <table className="w-full border-collapse text-white">
                      {/* CABEÇALHO */}
                      <thead>
                        <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                          <th className="p-3 text-left rounded-tl-xl">Nome</th>
                          <th className="p-3 text-left">Telefone</th>
                          <th className="p-3 text-left">Data de Nascimento</th>
                          <th className="p-3 text-right">Ações</th>
                          <th className="p-3 text-center rounded-tr-xl">Visualizar</th>
                        </tr>
                      </thead>

                      {/* CORPO */}
                      <tbody>
                        {filteredSupervisores.length > 0 ? (
                          filteredSupervisores.map((d) => (
                            <tr
                              key={d.id}
                              className="odd:bg-zinc-900/60 even:bg-zinc-800/10 hover:bg-zinc-800 transition-colors border-b border-zinc-700"
                            >
                              {/* NOME SUPERVISOR + SUPERVISÃO */}
                              <td className="px-3 py-2">
                                <div className="flex flex-col">
                                  <span className="font-manrope font-medium">
                                    {d.supervisor.nome}
                                  </span>
                                  <span className="text-sm text-zinc-400 font-manrope">
                                    {d.nome}
                                  </span>
                                </div>
                              </td>

                              {/* TELEFONE */}
                              <td className="px-3 py-2 font-manrope font-light">
                                {d.supervisor.telefone}
                              </td>

                              {/* DATA NASCIMENTO */}
                              <td className="px-3 py-2 font-manrope font-light">
                                {formatDate(d.supervisor.dataNascimento)}
                              </td>

                              {/* AÇÕES */}
                              <td className="px-3 py-2">
                                <div className="flex justify-end gap-4">
                                  <Link
                                    href={gerarLinkWhatsApp(d.supervisor.telefone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ButtonAction type="button" color="bg-green-600">
                                      <div className="flex items-center gap-2">
                                        <AiOutlineWhatsApp size={20} />
                                        Whatsapp
                                      </div>
                                    </ButtonAction>
                                  </Link>
                                </div>
                              </td>

                              {/* VISUALIZAR */}
                              <td className="px-3 py-2 text-center">
                                <Link href={`/coordenacao/supervisor/${d.id}`}>
                                  <ButtonAction type="button" color="transparent">
                                    <FaRegEye size={22} color="#fff" />
                                  </ButtonAction>
                                </Link>
                              </td>
                            </tr>

                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center p-20 text-white font-manrope font-semibold"
                            >
                              Nenhuma supervisão encontrada
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </main>
            </main>
          </>
        </>
      </ProtectedLayout>
  );
}
