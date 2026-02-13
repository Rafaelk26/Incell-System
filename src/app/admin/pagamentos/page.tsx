"use client";

import Image from "next/image";
import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import { useAuth } from "@/app/context/useUser";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ordenarPorTexto } from "@/functions/formatAZ";
import { MdOutlineError } from "react-icons/md";
import { FaCircleCheck } from "react-icons/fa6";
import { HiDocumentCurrencyDollar } from "react-icons/hi2";

/* ===================== TYPES ===================== */

type Lider = {
  id: string;
  nome: string;
  cargo: string;
  celula_nome?: string | null;
};

type Pagamento = {
  id: string;
  responsavel_id: string;
  file_path: string;
  created_at: string;
};

type ReuniaoGD = {
  id: string;
  data: string;
};

/* ===================== COMPONENT ===================== */

export default function Pagamentos() {
  const { user } = useAuth();

  const [lideres, setLideres] = useState<Lider[]>([]);
  const [payments, setPayments] = useState<Pagamento[]>([]);
  const [gdAtual, setGdAtual] = useState<ReuniaoGD | null>(null);

  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [filtroPagamento, setFiltroPagamento] =
    useState<"" | "pago" | "nao_pago">("");

  /* ===================== PAGAMENTOS ===================== */

  const lideresQuePagaram = useMemo(() => {
    return new Set(payments.map(p => p.responsavel_id));
  }, [payments]);

  function formatarDataBR(dataISO: string) {
  if (!dataISO) return "S/D";

  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}


  /* ===================== FETCH GD ===================== */

  async function fetchGDAtual() {
    const hoje = new Date().toISOString();

    // 🔎 Próximo GD futuro
    const { data, error } = await supabase
      .from("reunioes")
      .select("id, data")
      .eq("tipo", "GD")
      .gte("data", hoje)
      .order("data", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error("Erro ao buscar GD:", error);
      return;
    }

    setGdAtual(data);
  }

  /* ===================== LIMPEZA AUTOMÁTICA ===================== */

  async function limparPagamentosAntigos() {
    const hoje = new Date();

    const { data: ultimoGD } = await supabase
      .from("reunioes")
      .select("data")
      .eq("tipo", "GD")
      .lt("data", hoje.toISOString())
      .order("data", { ascending: false })
      .limit(1)
      .single();

    if (ultimoGD) {
      await supabase.from("pagamentos").delete().neq("id", "");
      console.log("Pagamentos antigos apagados (novo GD iniciado)");
    }
  }

  /* ===================== FETCH LÍDERES ===================== */

  async function fetchLideres() {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        nome,
        cargo,
        celulas:celulas ( nome )
      `)
      .neq("cargo", "admin");

    if (error) return;

    setLideres(
      (data ?? []).map((u: any) => ({
        id: u.id,
        nome: u.nome,
        cargo: u.cargo,
        celula_nome: u.celulas?.[0]?.nome ?? null,
      }))
    );
  }

  /* ===================== FETCH PAGAMENTOS ===================== */

  async function fetchPayments() {
    const { data } = await supabase.from("pagamentos").select("*");
    setPayments(data ?? []);
  }

  /* ===================== FILTROS ===================== */

  const lideresFiltrados = useMemo(() => {
    return ordenarPorTexto(
      lideres.filter(l => {
        const pagou = lideresQuePagaram.has(l.id);

        return (
          l.nome.toLowerCase().includes(filtroNome.toLowerCase()) &&
          (filtroCargo ? l.cargo === filtroCargo : true) &&
          (filtroPagamento === ""
            ? true
            : filtroPagamento === "pago"
            ? pagou
            : !pagou)
        );
      }),
      "nome"
    );
  }, [lideres, filtroNome, filtroCargo, filtroPagamento, lideresQuePagaram]);


/* ===================== MÉTRICAS FIXAS (SEM FILTRO) ===================== */
const { totalLideres, totalPagos, porcentagem } = useMemo(() => {
  const totalLideres = lideres.length;

  const totalPagos = lideres.reduce((acc, lider) => {
    return lideresQuePagaram.has(lider.id) ? acc + 1 : acc;
  }, 0);

  const porcentagem = totalLideres
    ? Math.round((totalPagos / totalLideres) * 100)
    : 0;

  return { totalLideres, totalPagos, porcentagem };
}, [lideres, lideresQuePagaram]);

function getPagamentoDoLider(liderId: string) {
  return payments.find(p => p.responsavel_id === liderId);
}



  /* ===================== INIT ===================== */

  useEffect(() => {
    limparPagamentosAntigos().then(() => {
      fetchGDAtual();
      fetchLideres();
      fetchPayments();
    });
  }, []);

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

          <section className="w-full flex flex-col mt-6 items-center
          md:mt-14 md:px-6">
            <div className="w-96 flex justify-between flex-col items-center
            md:flex-row md:w-full">
                <div className="flex flex-col gap-2 mb-6 items-center
                md:items-start">
                  <h1 className="text-center font-bold text-4xl font-manrope">
                    Pagamentos GD
                  </h1>

                  {/* Data do GD */}
                  <div>
                    {gdAtual ? (
                      <>
                        <span className="font-manrope">{formatarDataBR(gdAtual.data)}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-manrope">S/D</span>
                      </>
                    )}
                  </div>
                </div>

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

                    {/* FILTRO POR PAGAMENTO */}
                    <select
                      value={filtroPagamento}
                      onChange={(e) =>
                        setFiltroPagamento(e.target.value as "" | "pago" | "nao_pago")
                      }
                      className="w-full max-w-full px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Status</option>
                      <option value="pago">Pago</option>
                      <option value="nao_pago">Não Pago</option>
                    </select>


                </div>
            </div>

            <div className="w-96 mb-4
            md:w-full">
              <div className="w-full rounded-full bg-zinc-700">
                <div
                  className="rounded-full p-1 bg-blue-500 transition-all"
                  style={{ width: `${porcentagem}%` }}
                />
              </div>
              <span className="font-manrope text-blue-400">
                {porcentagem}% dos líderes efetuaram pagamento
              </span>
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
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-right rounded-tr-xl">
                      Comprovante
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
                        <div className="flex flex-col">
                          <span className="font-manrope text-lg">
                            {lider.nome}
                          </span>

                          <span className="font-manrope font-light text-gray-200 text-md">
                            {lider.celula_nome}
                          </span>
                          
                        </div>
                      </td>

                      <td className="px-3 py-3 font-manrope">
                        {lider.cargo.charAt(0).toUpperCase() +
                          lider.cargo.slice(1)}
                      </td>

                      <td className="px-3 py-3">
                        {lideresQuePagaram.has(lider.id) ? (
                          <FaCircleCheck className="text-green-500 text-xl" />
                        ) : (
                          <MdOutlineError className="text-red-500 text-xl" />
                        )}
                      </td>

                      
                      <td className="w-max px-3 py-3 text-right">
                      {(() => {
                        const pagamento = getPagamentoDoLider(lider.id);

                        if (!pagamento) {
                          return <span className="text-zinc-500">—</span>;
                        }

                        const { data } = supabase.storage
                          .from("pagamentos")
                          .getPublicUrl(pagamento.file_path);

                        return (
                          <a
                            href={data.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver comprovante"
                            className="inline-flex justify-end"
                          >
                            <HiDocumentCurrencyDollar className="text-white hover:text-green-300 text-xl cursor-pointer" />
                          </a>
                        );
                      })()}
                    </td>


                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
