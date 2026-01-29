"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import { useEffect, useMemo, useState, ReactNode, useRef } from "react";
import Link from "next/link";
import { useDashboardData } from "../hook/dashboard";
import { useHorizontalDragScroll } from "../hook/useHorizontalDragScroll";
import { Spinner } from "@/components/all/spiner";
import { supabase } from "@/lib/supabaseClient";
import CountUp from 'react-countup';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import toast from "react-hot-toast";
import * as echarts from "echarts";


/* ============================================================
   📊 DASHBOARD PAGE
============================================================ */
export default function Dashboard() {
  const { user } = useAuth();
  const chartAdminRef = useRef<HTMLDivElement>(null);
  const [discipulosAdmin, setDiscipulosAdmin] = useState<
    { id: string; criado_em: string }[]
  >([]);

  const [eventos, setEventos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<Array<{ 
    id: string; 
    nome: string; 
    cargo: string 
  }>>([]);
  const [celulas, setCelulas] = useState<Array<{ 
    id: string; 
    nome: string; 
  }>>([]);
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [gdlEvents, setGdlEvents] = useState<Array<{ start: string }>>([]);
  const [gdsEvents, setGdsEvents] = useState<Array<{ start: string }>>([]);
  const [gdcEvents, setGdcEvents] = useState<Array<{ start: string }>>([]);
  const [gdEvents, setGdEvents] = useState<Array<{ start: string }>>([]);
  

  const {
    scrollRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useHorizontalDragScroll();

  const {
    discipulos,
    totalLideres,
    totalSupervisores,
    totalCoordenadores,
    loading,
  } = useDashboardData(user?.id);

  /* ====================== FUNÇÕES ====================== */

  const pegarUsuarios = async () => {
    try {
      const { data: usuarios, error } = await supabase
        .from("users")
        .select("id, nome, cargo");

        if (error) throw error;
        
      setUsuarios(usuarios || []);
    }
    catch (error) {
      console.error("Erro ao pegar usuários:", error);
    }
  }


  const pegarCelulas = async () => {
    try {
      const { data: celulas, error } = await supabase
        .from("celulas")
        .select("id, nome");

        if (error) throw error;
        
      setCelulas(celulas || []);
    }
    catch (error) {
      console.error("Erro ao pegar usuários:", error);
    }
  }

  useEffect(() => {
    pegarUsuarios();
    pegarCelulas();
  }, []);

  useEffect(() => {
    if (!user) return;

    async function carregarAgenda() {
      const res = await fetch("/api/reunioes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          cargo: user?.cargo,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.log(json)
        toast.error("Erro ao carregar agenda");
        return;
      }

      setEventos(json.eventos);
    }

    carregarAgenda();
  }, [user]);


  const agruparPorMes = (dados: { criado_em: string }[]) => {
  const map = new Map<string, number>();

  dados.forEach((d) => {
    const date = new Date(d.criado_em);
    const mes = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    map.set(mes, (map.get(mes) ?? 0) + 1);
  });

  return Array.from(map.entries()).map(([mes, total]) => ({
    mes,
    total,
  }));
};



  useEffect(() => {
  async function carregarDiscipulos() {
    try {
      const { data, error } = await supabase
        .from("discipulos")
        .select("id, criado_em");

      if (error) throw error;

      setDiscipulosAdmin(data ?? []);
    } catch (err) {
      console.error("Erro ao buscar discípulos:", err);
    }
  }

  carregarDiscipulos();
}, []);

function formatarDataCurta(dataISO: string) {
  const data = new Date(dataISO);
  const dia = data.getDate();
  const mes = data.toLocaleString("pt-BR", { month: "short" });
  return `${dia} ${mes.charAt(0).toUpperCase() + mes.slice(1)}`;
}



useEffect(() => {
  if (!chartAdminRef.current || discipulosAdmin.length === 0) return;

  const chart = echarts.init(chartAdminRef.current);

  const dados = agruparPorMes(discipulosAdmin);

  chart.setOption({
    tooltip: { trigger: "axis" },
    grid: {
      left: "3%",
      right: "3%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: dados.map((d) => d.mes),
      axisLabel: { color: "#fff" },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#fff" },
    },
    series: [
      {
        name: "Discípulos",
        data: dados.map((d) => d.total),
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 10,
        label: {
          show: true,
          position: "top",
          color: "#fff",
          fontWeight: "bold",
        },
        areaStyle: {
          opacity: 0.3,
        },
      },
    ],
  });

  return () => chart.dispose();
}, [discipulosAdmin]);




  useEffect(() => {
  if (!user?.id) return;

  async function carregarDatasReunioes() {
    try {
      const res = await fetch("/api/reunioes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          cargo: user?.cargo,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error(json);
        toast.error("Erro ao carregar reuniões");
        return;
      }

      const eventos = json.eventos || [];

      const gdl = eventos
        .filter((e: any) => e.title === "GDL")
        .map((e: any) => ({ start: formatarDataCurta(e.start) }));

      const gds = eventos
        .filter((e: any) => e.title === "GDS")
        .map((e: any) => ({ start: formatarDataCurta(e.start) }));

      const gdc = eventos
        .filter((e: any) => e.title === "GDC")
        .map((e: any) => ({ start: formatarDataCurta(e.start) }));

      const gd = eventos
        .filter((e: any) => e.title === "GD")
        .map((e: any) => ({ start: formatarDataCurta(e.start) }));

      setGdlEvents(gdl);
      setGdsEvents(gds);
      setGdcEvents(gdc);
      setGdEvents(gd);

    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao carregar reuniões");
    }
  }

  carregarDatasReunioes();
}, [user?.id, user?.cargo]);




async function buscarRelatorios() {
  if (!user) return [];

  let responsaveis: string[] = [user.id];
  let tipos: string[] = [];

  /* ================= LÍDER ================= */
  if (user.cargo === "lider") {
    tipos = ["CELULA", "DISCIPULADO"];
  }

  /* ================= SUPERVISOR ================= */
  if (user.cargo === "supervisor") {
    tipos = ["CELULA", "DISCIPULADO", "GDL"];

    // 1️⃣ Descobrir a supervisão do supervisor
    const { data: supervisao } = await supabase
      .from("supervisoes")
      .select("id")
      .eq("supervisor_id", user.id)
      .single();

    if (supervisao) {
      // 2️⃣ Buscar líderes dessa supervisão
      const { data: lideres } = await supabase
        .from("celulas")
        .select("lider_id")
        .eq("supervisao_id", supervisao.id);

      const lideresIds = lideres?.map(l => l.lider_id) || [];
      responsaveis.push(...lideresIds);
    }
  }

  /* ================= COORDENADOR ================= */
  if (user.cargo === "coordenador") {
    tipos = ["CELULA", "DISCIPULADO", "GDS"];

    // 1️⃣ Descobrir a coordenação do coordenador
    const { data: coordenacao } = await supabase
      .from("coordenacoes")
      .select("id")
      .eq("coordenador_id", user.id)
      .single();

    if (coordenacao) {
      // 2️⃣ Buscar supervisões dessa coordenação
      const { data: supervisoes } = await supabase
        .from("coordenacao_supervisoes")
        .select("supervisao_id")
        .eq("coordenacao_id", coordenacao.id);

      const supervisoesIds = supervisoes?.map(s => s.supervisao_id) || [];

      // 3️⃣ Buscar usuários supervisores dessas supervisões
      if (supervisoesIds.length > 0) {
        const { data: supervisoresUsers } = await supabase
          .from("users")
          .select("id")
          .in("supervisao_id", supervisoesIds);

        const supervisoresIds = supervisoresUsers?.map(u => u.id) || [];
        responsaveis.push(...supervisoresIds);
      }
    }
  }

  /* ================= PASTOR ================= */
  if (user.cargo === "pastor") {
    tipos = ["CELULA", "DISCIPULADO", "GDC"];

    const { data: coordenadores } = await supabase
      .from("users")
      .select("id")
      .eq("cargo", "coordenador");

    const coordenadoresIds = coordenadores?.map(c => c.id) || [];
    responsaveis.push(...coordenadoresIds);
  }

  /* ================= QUERY FINAL ================= */
  const { data, error } = await supabase
    .from("relatorios")
    .select("*")
    .in("responsavel", responsaveis)
    .in("tipo", tipos)
    .order("criado_em", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Erro ao buscar relatórios:", error);
    return [];
  }

  return data;
}

useEffect(() => {
  buscarRelatorios().then(setRelatorios);
}, [user?.id]);

const itensRelatorios = useMemo(() => {
  return relatorios.map(r => (
    <div
      key={r.id}
      className="odd:bg-zinc-900/60 even:bg-zinc-800/10 rounded-md p-3"
    >
      {r.tipo === "CELULA" && (
        <span>
          Relatório de Célula <br />
          {formatarDataCurta(r.criado_em)}
        </span>
      )}

      {r.tipo === "DISCIPULADO" && (
        <span>
          Relatório de Discipulado <br />
          {formatarDataCurta(r.criado_em)}
        </span>
      )}

      {r.tipo === "GDL" && (
        <span>
          Relatório GDL <br />
          {formatarDataCurta(r.criado_em)}
        </span>
      )}

      {r.tipo === "GDS" && (
        <span>
          Relatório GDS <br />
          {formatarDataCurta(r.criado_em)}
        </span>
      )}

      {r.tipo === "GDC" && (
        <span>
          Relatório GDC <br />
          {formatarDataCurta(r.criado_em)}
        </span>
      )}
    </div>
  ));
}, [relatorios]);



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
        <main className="w-full overflow-x-hidden">
          <header className="w-full flex justify-end pe-4 pt-6">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              src={user?.foto || ""}
              width={12}
              height={12}
              alt="Perfil"
              priority
            />
          </header>

          {/* ==================== DASHBOARD NORMAL ==================== */}
          {user?.cargo !== "admin" ? (
            <section className="w-full flex justify-center items-center mt-10">
              <div className="w-full max-w-7xl flex flex-col justify-center px-4">

                <h1 className="font-bold text-4xl font-manrope">Dashboard</h1>

                {/* ======== CARDS PRINCIPAIS ======== */}
                <section
                  ref={scrollRef}
                  className={`w-full mt-5 hide-scrollbar ${
                    ["supervisor", "coordenador"].includes(user?.cargo)
                      ? "overflow-x-auto touch-pan-x cursor-grab active:cursor-grabbing"
                      : "overflow-visible"
                  }`}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                >
                  <div className="flex flex-nowrap gap-10 min-w-max">
                    {/* CARD DISCÍPULOS */}
                    {user?.cargo !== "pastor" && (
                      <Card title="Discípulos" value={<CountUp duration={3.5} end={discipulos?.length} />} />
                    )}

                    {/* CARD LÍDERES */}
                    {user?.cargo === "supervisor" && (
                      <Card title="Líderes" value={<CountUp duration={3.5} end={totalLideres} />} />
                    )}

                    {/* CARD SUPERVISORES */}
                    {user?.cargo === "coordenador" && (
                      <Card title="Supervisores" value={<CountUp duration={3.5} end={totalSupervisores} />} />
                    )}

                    {/* CARD COORDENADORES */}
                    {user?.cargo === "pastor" && (
                      <Card title="Coordenadores" value={<CountUp duration={3.5} end={totalCoordenadores} />} />
                    )}


                    {/* ======== CARDS DE REUNIÕES (DINÂMICOS) ======== */}
                    {(user?.cargo === "lider" || user?.cargo === "supervisor") && (
                      <MeetingCard title="Reunião GDL" date={gdlEvents[0]?.start || "S/D"} />
                    )}

                    {(user?.cargo === "supervisor" || user?.cargo === "coordenador") && (
                      <MeetingCard title="Reunião GDS" date={gdsEvents[0]?.start || "S/D"} />
                    )}

                    {(user?.cargo === "coordenador" || user?.cargo === "pastor") && (
                      <MeetingCard title="Reunião GDC" date={gdcEvents[0]?.start || "S/D"} />
                    )}

                    {user && <MeetingCard title="Reunião GD" date={gdEvents[0]?.start || "S/D"} />}
                  </div>
                </section>

                {/* ======== RELATÓRIOS E NOTIFICAÇÕES ======== */}
                <section className="w-full flex flex-col md:flex-row justify-between gap-12 mt-10 mb-10">
                  {/* EXIBIÇÃO DOS RELATÓRIOS PRÉ PRONTOS QUE FORAM FEITOS (COM NOME, TIPO DO EVENTO, HORA PARA SEREM EXIBIDAS AQUI */}
                  
                  <div className="w-full md:w-1/2 flex flex-col gap-6">
                    <InfoBox title="Últimos Relatórios" items={itensRelatorios} />
                  </div>

                  <div className="w-full md:w-1/2 flex flex-col bg-[#514F4F]/40 px-6 py-6 rounded-md">
                    <span className="text-2xl font-manrope font-bold mb-6">Calendário</span>
                    
                    <Link href={`/agenda/${user.id}`}>
                      <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locales={[ptBrLocale]}
                        locale="pt-br"
                        events={eventos}
                        displayEventTime={false}
                        eventContent={(arg) => {
                          const color =
                            arg.event.backgroundColor ||
                            arg.event.borderColor ||
                            "#3b82f6";

                          return (
                            <div
                              className="w-2 h-2 rounded-full mx-auto mt-1"
                              style={{ backgroundColor: color }}
                            />
                          );
                        }}
                      />
                    </Link>
                  </div>
                </section>
              </div>
            </section>
            ) : (
            /* ==================== DASHBOARD ADMIN ==================== */
            <section className="mx-auto flex flex-col 
            md:mt-14 md:px-4
            2xl:w-7xl">
              <h1 className="text-left font-bold text-4xl font-manrope">Admin</h1>
              <section className="mt-5 flex justify-between gap-4
              md:max-w-6xl
              xl:max-w-7xl">
                {["Líderes", "Supervisores", "Coordenadores", "Células"].map((t, i) => (
                <Card key={i} title={t} value={
                    t === "Líderes" ? (
                      <CountUp duration={3.5} end={usuarios.filter(u => u.cargo === "lider").length} />
                    ) : t === "Supervisores" ? (
                      <CountUp duration={3.5} end={usuarios.filter(u => u.cargo === "supervisor").length} />
                    ) : t === "Coordenadores" ? (
                      <CountUp duration={3.5} end={usuarios.filter(u => u.cargo === "coordenador").length} />
                    ) : (
                      <CountUp duration={3.5} end={usuarios.length - 1} />
                    )
                  }
                />
              ))}

              </section>

              <section className="max-w-[81rem] w-full flex gap-12 mt-10 mb-10">
                <div className="max-w-full w-full flex flex-col items-start bg-[#514F4F]/40 px-6 py-6 gap-6 rounded-md">
                  
                  <span className="text-3xl font-manrope font-bold">
                    Estatísticas
                  </span>

                  <div
                    ref={chartAdminRef}
                    className="w-full h-[360px]"
                  />
                </div>
              </section>
            </section>
          )}
        </main>
      </main>
    </ProtectedLayout>
  );
}

/* ============================================================
   🧩 COMPONENTES REUTILIZÁVEIS
============================================================ */


const Card = ({ title, value }: { title: string; value: ReactNode }) => (
  <div className="w-72 shrink-0 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-md">
    <span className="text-lg font-manrope font-semibold">{title}</span>
    <span className="text-6xl font-manrope font-bold">
      {value}
    </span>
  </div>
);

const MeetingCard = ({ title, date }: { title: string; date: string }) => (
  <div className="w-72 shrink-0 flex flex-col items-start bg-blue-500/60 px-6 py-8 gap-4 rounded-md">
    <span className="text-lg font-manrope font-semibold">{title}</span>
    <span className="text-6xl font-manrope font-bold">
      <span className="text-5xl font-extralight">{date}</span>
    </span>
  </div>
);

const InfoBox = ({ title, items }: { title: string; items: ReactNode[] }) => (
  <div className="max-w-full w-full h-full flex flex-col items-start bg-[#514F4F]/40 px-6 py-6 gap-8 rounded-md">
    <span className="text-2xl font-manrope font-bold">{title}</span>
    {items && ( 
      <>
        <div className="w-full flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="font-manrope font-bold">{item}</div>
          ))}
        </div>
      </>
    )}
    {items.length === 0 && (
      <>
        <div className="w-full h-full flex flex-col justify-center items-center mb-20">
          <span className="text-xl font-manrope font-normal">Nenhum relatório encontrado</span>
        </div>
      </>
    )}
  </div>
);
