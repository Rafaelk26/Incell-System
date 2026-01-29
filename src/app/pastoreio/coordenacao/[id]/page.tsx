"use client";

import { useAuth } from "@/app/context/useUser";
import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import IncellLogo from "../../../../../public/assets/file Incell.png";
import { AiFillFilePdf } from "react-icons/ai";
import { Button } from "@/components/login/buttonAction";

/* ===================== TYPES ===================== */

type Coordenador = {
  id: string;
  nome: string;
  foto?: string;
};

type Coordenacao = {
  id: string;
  nome: string;
  coordenador_id: Coordenador | Coordenador[] | null;
};


type Relatorios = {
  id: string;
  conteudo: {
    signed_url: string;
  };
  tipo: string;
  responsavel: string;
  criado_em: string;
};

/* ===================== COMPONENT ===================== */

export default function DetalheCoordenador() {
  const { user } = useAuth();
  const params = useParams();

  const idCoordenador =
  typeof params.id === "string" ? params.id : params.id?.[0];

  const [coordenador, setCoordenador] = useState<Coordenador | null>(null);
  const [coordenacao, setCoordenacao] = useState<Coordenacao | null>(null);
  const [relatorios, setRelatorios] = useState<Relatorios[]>([]);
  const [loading, setLoading] = useState(true);

  /* ==================== BUSCAR COORDENAÇÃO ==================== */

  const fetchCoordenacao = async (): Promise<Coordenacao | null> => {
    const { data, error } = await supabase
      .from("coordenacoes")
      .select("id, nome, coordenador_id:users (id, nome, foto)")
      .eq("id", idCoordenador)
      .single();

    if (error || !data) return null;

    const raw = data.coordenador_id;
    const coordenadorResolved: Coordenador | null =
      Array.isArray(raw) ? raw[0] : raw ?? null;

    setCoordenacao(data);
    setCoordenador(coordenadorResolved);

    return data;
  };


  /* ==================== BUSCAR RELATÓRIOS ==================== */

  const fetchRelatorios = async (coordenador: string) => {
    const { data, error } = await supabase
      .from("relatorios")
      .select("*")
      .eq("responsavel", coordenador);
    if (error) throw error;

    setRelatorios(data ?? []);
  };


  useEffect(() => {
    if (!idCoordenador) return;

    const load = async () => {
    try {
      setLoading(true);

      const coordenadorData = await fetchCoordenacao();
      console.log("Coordenador data:", coordenadorData);
      if (!coordenadorData?.id) return;

      if (coordenadorData?.coordenador_id) {
      const coord = Array.isArray(coordenadorData.coordenador_id)
        ? coordenadorData.coordenador_id[0]
        : coordenadorData.coordenador_id;

      await fetchRelatorios(coord.id);
    }

      console.log("Dados carregados com sucesso.", coordenacao);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };


    load();
  }, [idCoordenador]);

  /* ==================== DATA BR ==================== */

  function formatDateBR(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(date);
  }

  /* ==================== LOADING ==================== */

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="w-full h-screen flex items-center justify-center text-white">
          <span className="animate-pulse text-lg font-manrope">
            Carregando informações do coordenador...
          </span>
        </div>
      </ProtectedLayout>
    );
  }

  /* ==================== RENDER ==================== */


    return (
    <ProtectedLayout>
        <>
            <>
            <main className="max-w-full h-screen flex">
                <Navbar />
                <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto px-4">
                <header className="w-full flex justify-end pt-6">
                    <Image
                    className="w-12 h-12 rounded-full border-2 border-white"
                    src={user?.foto || ""}
                    width={12}
                    height={12}
                    alt="Perfil"
                    priority
                    />
                </header>

                {/* ==================== PAGE COORDENAÇÃO PRINCIPAL ==================== */}

                <section className="w-full flex items-center justify-between mt-4">
                    <div className="w-full flex items-center gap-4 mt-6">
                        <Image
                        className="w-16 h-16 rounded-full object-cover"
                        src={coordenador?.foto || ""}
                        alt="Foto coordenador"
                        height={50}
                        width={50}
                        />
                      <div>
                          <h1 className="font-bold text-4xl font-manrope">{coordenador?.nome}</h1>
                          <h2 className="font-light text-xl font-manrope">{coordenacao?.nome}</h2>
                      </div>
                    </div>

                    
                    <div className="w-70">
                      <Link href={`/pastoreio/coordenacao/observar/${coordenacao?.id}`}>
                        <Button nome="Observar Coordenação"></Button>
                      </Link>
                    </div>
                </section>


                {/* HISTÓRICO */}

                <div className="w-full h-[400px] mt-6 overflow-x-auto">
                    <table className="w-full border-collapse text-white">
                    {/* CABEÇALHO */}
                    <thead>
                        <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                            <th className="p-3 text-left rounded-tl-xl">Histórico de Atividades</th>
                            <th className="p-3 text-left">Data</th>
                            <th className="p-3 text-right rounded-tr-xl">Download</th>
                        </tr>
                    </thead>

                    {/* CORPO */}
                    <tbody>

                        {relatorios?.filter(r => r.tipo === 'CELULA').map((relatorio) => (
                                <>
                                <tr
                                key={relatorio.id}
                                className="odd:bg-zinc-900/60 even:bg-zinc-800/10 hover:bg-zinc-800 transition-colors border-b border-zinc-700"
                                >
                                    <td className="px-3 py-3 font-manrope font-light">Relatório de Célula</td>
                                    <td className="px-3 py-3 font-manrope font-light">{formatDateBR(relatorio?.criado_em)}</td>
                                    <td className="px-3 py-3 font-manrope font-light flex justify-end">
                                        <Link href={relatorio?.conteudo.signed_url || ""} target="_blank">
                                            <AiFillFilePdf 
                                            className="cursor-pointer"
                                            size={24} 
                                            color="#fff"/>
                                        </Link>
                                    </td>
                                </tr>
                                </>
                            ))}
                        
                            
                            {relatorios?.filter(r => r.tipo === 'DISCIPULADO').map((relatorio) => (
                                <>
                                    <tr key={relatorio.id}>
                                        <td className="px-3 py-3 font-manrope font-light">Relatório de Discipulado</td>
                                        <td className="px-3 py-3 font-manrope font-light">{formatDateBR(relatorio?.criado_em)}</td>
                                        <td className="px-3 py-3 font-manrope font-light flex justify-end">
                                            <Link href={relatorio?.conteudo.signed_url || ""} target="_blank">
                                                <AiFillFilePdf 
                                                className="cursor-pointer"
                                                size={24} 
                                                color="#fff"/>
                                            </Link>
                                        </td>
                                    </tr>
                                </>
                            ))}


                            {relatorios?.filter(r => r.tipo === 'GDS').map((relatorio) => (
                                <>
                                    <tr key={relatorio.id}>
                                        <td className="px-3 py-3 font-manrope font-light">Relatório de GDS</td>
                                        <td className="px-3 py-3 font-manrope font-light">{formatDateBR(relatorio?.criado_em)}</td>
                                        <td className="px-3 py-3 font-manrope font-light flex justify-end">
                                            <Link href={relatorio?.conteudo.signed_url || ""} target="_blank">
                                                <AiFillFilePdf 
                                                className="cursor-pointer"
                                                size={24} 
                                                color="#fff"/>
                                            </Link>
                                        </td>
                                    </tr>
                                </>
                            ))}

                        {!relatorios || relatorios.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="pt-40 pb-3 py-3 font-manrope font-normal text-center">
                                Nenhum registro de relatório encontrado
                            </td>
                        </tr>
                        ) : <></>}

                    </tbody>
                    </table>
                </div>
                </main>
            </main>
            </>
        </>
        </ProtectedLayout>
    );
}