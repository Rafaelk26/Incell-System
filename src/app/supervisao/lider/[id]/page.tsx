"use client"

import { useAuth } from "@/app/context/useUser";
import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AiFillFilePdf } from "react-icons/ai";


/* ===================== TYPES ===================== */

type Lider = {
    id: string;
    nome: string;
    foto: string;
}

type Celula = {
    nome: string;
}

type Relatorios = {
    id: string;
    conteudo: {
        signed_url: string;
    }
    tipo: string;
    responsavel: string;
    criado_em: string;
}


export default function detalheLider(){

    const { user } = useAuth();
    const params = useParams();
    const idLider = params.id;
    const [lider, setLider] = useState<Lider[]>();
    const [celula, setCelula] = useState<Celula[]>();
    const [relatorios, setRelatorios] = useState<Relatorios[]>();
    const [loading, setLoading] = useState(true);


    /*==================== BUSCAR DADOS ================ */

    const fetchData = async () => {
        try{
            const {data: lider, error: fetchError} = await supabase
            .from('users')
            .select('id, nome, foto')
            .eq('id', idLider)
            .single();

            if (fetchError) throw fetchError;

            const { data: celula, error: celulaError } = await supabase
            .from('celulas')
            .select('nome')
            .eq('responsavel_id', idLider)
            .single();

            if (celulaError) throw celulaError;

            setLider([lider]);
            setCelula([celula]);
        }
        catch(error){
            console.error("Erro ao buscar líder:", error);
        }
    }


    /*==================== RELATÓRIOS ==================== */

    const fetchRelatorios = async () => {
        try {
            const { data: relatorios, error } = await supabase
                .from('relatorios')
                .select('id, conteudo, tipo, responsavel, criado_em')
                .eq('responsavel', idLider);

            if (error) throw error;

            setRelatorios(relatorios);
        }
        catch (error) {
            console.error("Erro ao buscar relatórios:", error);
        }
    }

    useEffect(() => {
    if (!idLider) return;

    const loadAllData = async () => {
        try {
        setLoading(true);

        await Promise.all([
            fetchData(),
            fetchRelatorios()
        ]);
        } catch (error) {
        console.error("Erro ao carregar dados:", error);
        } finally {
        setLoading(false);
        }
    };

    loadAllData();
    }, [idLider]);




    /* ==================== DATA BR ==================== */
 
    function formatDateBR(dateString: string) {
        if (!dateString) return "-";

        const date = new Date(dateString).getTime() - (3 * 60 * 60 * 1000);

        return new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    }



    
    /* ===================== RENDER ===================== */
    if (loading) {
    return (
        <ProtectedLayout>
        <div className="w-full h-dvh flex items-center justify-center text-white md:h-screen">
            <span className="text-center animate-pulse text-lg font-manrope">
            Carregando informações do líder...
            </span>
        </div>
        </ProtectedLayout>
    );
    }



    return (
    <ProtectedLayout>
        <>
            <>
            <main className="max-w-full h-dvh flex md:h-screen">
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

                {/* ==================== PAGE SUPERVISÃO PRINCIPAL ==================== */}

                <section className="w-full">
                    <div className="w-full flex flex-col items-center gap-6 mt-6 justify-center md:flex-row md:gap-4">
                        <Image
                        className="w-16 h-16 rounded-full object-cover border border-white"
                        src={lider?.[0]?.foto || ""}
                        alt="Foto líder"
                        height={50}
                        width={50}
                        />
                        <div className="flex flex-col text-center 
                        md:w-full md:text-start">
                            <h1 className="font-bold text-4xl font-manrope">{lider?.[0]?.nome}</h1>
                            <h2 className="font-light text-xl font-manrope">{celula?.[0]?.nome}</h2>
                        </div>
                    </div>
                </section>


                {/* HISTÓRICO */}

                <div className="w-full h-[300px] overflow-x-auto mt-14
                md:h-[400px] md:mt-6">
                    <table className="min-w-[600px] border-collapse text-white
                    md:w-full md:min-w-full">
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
                                    <tr>
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