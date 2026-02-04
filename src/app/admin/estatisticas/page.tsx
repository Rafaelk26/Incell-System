"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import { useAuth } from "@/app/context/useUser";
import Image from "next/image";
import Incell from "../../../../public/assets/file Incell black.png";
import { supabase } from "@/lib/supabaseClient";
import { Spinner } from "@/components/all/spiner";
import { ordenarPorTexto } from '@/functions/formatAZ'
import * as echarts from "echarts";
import jsPDF from "jspdf";

/* ===================== TYPES ===================== */

type UserType = {
  id: string;
  nome: string;
};

type CelulaType = {
  id: string;
  nome: string;
  genero: string;
  responsavel_id: string;
  lider_nome: string;
};

type DiscipuloType = {
  id: string;
  celula_id: string;
  criado_em: string;
};

type SerieMensal = {
  mes: string;
  total: number;
};

/* ===================== COMPONENT ===================== */

export default function Estatisticas() {
  const { user } = useAuth();

  const chartRef = useRef<HTMLDivElement>(null); 
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);


  const [loading, setLoading] = useState(true);
  const [celulas, setCelulas] = useState<CelulaType[]>([]);
  const [discipulos, setDiscipulos] = useState<DiscipuloType[]>([]);
  const [celulaSelecionada, setCelulaSelecionada] = useState<CelulaType | null>(null);

  /* ===================== HELPERS ===================== */

  const formatMes = (date: string) => {
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const agruparPorMes = (dados: DiscipuloType[]) => {
    const map = new Map<string, number>();

    dados.forEach((d) => {
      const mes = formatMes(d.criado_em);
      map.set(mes, (map.get(mes) ?? 0) + 1);
    });

    return Array.from(map.entries()).map(([mes, total]) => ({
      mes,
      total,
    }));
  };

  /* ===================== EXPORTAR PDF ===================== */

    const fileToBase64 = (file: File) =>
        new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
    });

    const urlToBase64 = async (url: string) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return fileToBase64(blob as File);
    };


    const aplicarEstiloPDF = () => {
    if (!chartInstanceRef.current) return;

    chartInstanceRef.current.setOption({
        series: [
        {
            label: {
            show: true,
            color: "#000000",
            fontSize: 12,
            fontWeight: "bold",
            },
        },
        ],
    });
    };

    const restaurarEstiloTela = () => {
        if (!chartInstanceRef.current) return;

        chartInstanceRef.current.setOption({
            series: [
            {
                label: {
                show: true,
                color: "#ffffff",
                fontSize: 12,
                fontWeight: "bold",
                },
            },
            ],
        });
    };




  const exportarPDF = async () => {
    const chart = echarts.init(chartRef.current);
    chartInstanceRef.current = chart;

    aplicarEstiloPDF();

    if (!chartInstanceRef.current) return;

    const doc = new jsPDF("landscape");

    let currentY = 10;

    // LOGO CENTRALIZADA NO TOPO
    const logoBase64 = await urlToBase64(Incell.src);
    doc.addImage(logoBase64, "PNG", 128, currentY, 40, 20);

    currentY += 28;

    const titulo = celulaSelecionada
        ? `${celulaSelecionada.nome} - ${celulaSelecionada.lider_nome}`
        : "ADAC Church";


    const total = celulaSelecionada
        ? discipulos.filter(d => d.celula_id === celulaSelecionada.id).length
        : discipulos.length;

    // TÍTULO
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text(titulo, 148, currentY, { align: "center" });

    currentY += 10;

    // SUBTÍTULO
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Total de discípulos: ${total}`, 148, currentY, {
        align: "center",
    });

    currentY += 10;

    // IMAGEM DO GRÁFICO
    const imgData = chartInstanceRef.current.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#ffffff",
    });

    doc.addImage(imgData, "PNG", 15, currentY, 270, 120);

    currentY += 130;

    // RODAPÉ
    doc.setFontSize(10);
    doc.text(
        `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
        148,
        currentY,
        { align: "center" }
    );

    // NOME DO ARQUIVO
    const nomeArquivo = celulaSelecionada
        ? `estatisticas-celula-${celulaSelecionada.nome}.pdf`
        : "estatisticas-gerais.pdf";

    restaurarEstiloTela();

    doc.save(nomeArquivo);
    };



    const celulasOrdenadas = useMemo(() => {
      return ordenarPorTexto(celulas, "nome");
    }, [celulas]);


  /* ===================== FETCH DATA ===================== */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        /* 1️⃣ USERS */
        const usersRes = await supabase
          .from("users")
          .select("id, nome");

        if (usersRes.error) throw usersRes.error;

        const usersMap = new Map(
          (usersRes.data ?? []).map((u: UserType) => [u.id, u.nome])
        );

        /* 2️⃣ CÉLULAS */
        const celulasRes = await supabase
          .from("celulas")
          .select("id, nome, genero, responsavel_id");

        if (celulasRes.error) throw celulasRes.error;

        const celulasFormatadas: CelulaType[] =
          (celulasRes.data ?? []).map((c: any) => ({
            id: c.id,
            nome: c.nome,
            genero: c.genero,
            responsavel_id: c.responsavel_id,
            lider_nome: usersMap.get(c.responsavel_id) ?? "—",
          }));

        setCelulas(celulasFormatadas);

        /* 3️⃣ DISCÍPULOS */
        const discipulosRes = await supabase
          .from("discipulos")
          .select("id, celula_id, criado_em");

        if (discipulosRes.error) throw discipulosRes.error;

          console.log(discipulosRes.data);
          
        setDiscipulos(discipulosRes.data ?? []);
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* ===================== DADOS DOS GRÁFICOS ===================== */

  const dadosGerais: SerieMensal[] = useMemo(() => {
    return agruparPorMes(discipulos);
  }, [discipulos]);

  const dadosCelula: SerieMensal[] = useMemo(() => {
    if (!celulaSelecionada) return [];
    return agruparPorMes(
      discipulos.filter((d) => d.celula_id === celulaSelecionada.id)
    );
  }, [discipulos, celulaSelecionada]);

  /* ===================== RENDER GRÁFICO ===================== */

  useEffect(() => {
  if (!chartRef.current) return;

  const chart = echarts.init(chartRef.current);
  chartInstanceRef.current = chart;

  const dados = celulaSelecionada ? dadosCelula : dadosGerais;

  chart.setOption({
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: dados.map((d) => d.mes),
    },
    yAxis: { type: "value" },
    series: [
        {
            data: dados.map((d) => d.total),
            type: "line",
            smooth: true,
            areaStyle: {},
            symbol: "circle",
            symbolSize: 8,
            label: {
            show: true,
            position: "top",
            fontSize: 12,
            fontWeight: "bold",
            color: "#ffffff",
            },
            emphasis: {
            focus: "series",
            },
        },
    ],

  });

  return () => {
    chart.dispose();
    chartInstanceRef.current = null;
  };
}, [dadosGerais, dadosCelula, celulaSelecionada]);


  /* ===================== LOADING ===================== */

  if (loading || !user) {
    return (
      <main className="w-full h-screen flex justify-center items-center text-white">
        <Spinner />
      </main>
    );
  }

  /* ===================== RENDER ===================== */

  return (
    <ProtectedLayout>
      <main className="max-w-full h-dvh flex md:h-screen">
        <Navbar />

        <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto px-4">
          <header className="w-full flex justify-end px-2 pt-6 md:px-10">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              width={50}
              height={50}
              src={user.foto || ""}
              alt="Perfil"
            />
          </header>

          <h1 className="mt-10 text-center text-4xl font-manrope font-bold mb-6
          md:text-start md:mt-0">
            Estatísticas
          </h1>

          <section className="w-full flex gap-6 flex-col h-min
          md:flex-row md:h-[500px]">
            {/* ==================== GRÁFICO ==================== */}
            <section className="w-full bg-zinc-900/40 rounded-2xl p-4 md:w-3/4">
            <div className="w-full flex flex-col justify-between items-center mb-4 px-2
            md:flex-row">
                <h2 className="text-md font-manrope font-bold mb-4
                md:text-xl">
                    {celulaSelecionada
                    ? `${celulaSelecionada.nome}: ${discipulos.filter((d) => d.celula_id === celulaSelecionada.id).length} discípulos`
                    : `ADAC Church: ${discipulos.length} discípulos`}
                </h2>
                <button 
                onClick={exportarPDF}
                className="bg-blue-600 text-white font-manrope px-4 py-2 rounded-lg transition-all
                hover:bg-blue-700 hover:cursor-pointer">
                    Exportar PDF
                </button>
            </div>
              

              <div ref={chartRef} className="w-full h-[420px]" />
            </section>

            {/* ==================== CÉLULAS ==================== */}
            <article className="w-full h-[400px] overflow-y-auto bg-gray-200/20 rounded-2xl p-4 space-y-4
            md:w-1/4 md:h-[500px]">
              <h1 className="font-manrope font-bold text-2xl">
                Células
              </h1>

              {celulasOrdenadas.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    setCelulaSelecionada(
                      celulaSelecionada?.id === c.id ? null : c
                    )
                  }
                  className={`w-full text-left p-3 rounded-xl transition hover:cursor-pointer ${
                    celulaSelecionada?.id === c.id
                      ? "bg-blue-600/40"
                      : "bg-zinc-900/40 hover:bg-zinc-800"
                  }`}
                >
                  <p className="font-bold font-manrope text-lg">{c.nome}</p>
                  <div className="flex items-center">
                    <p className="text-sm">{c.lider_nome}</p>
                  </div>
                </button>
              ))}
            </article>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
