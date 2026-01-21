"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import { useEffect, useMemo, useState, ReactNode } from "react";
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


/* ============================================================
   📊 DASHBOARD PAGE
============================================================ */
export default function Dashboard() {
  const { user } = useAuth();
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
  const [gdlEvents, setGdlEvents] = useState<Array<{ start: string }>>([]);

  const {
    scrollRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useHorizontalDragScroll();

  const {
    discipulos,
    totalLideres,
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


  useEffect(() => {
  if (!user?.id) return;

  async function getDateGDL() {
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
        toast.error("Erro ao carregar agenda");
        return;
      }

      const reunioesGDL = json.eventos.filter(
        (evento: any) => evento.title === "GDL"
      );


      for (let i = 0; i < reunioesGDL.length; i++) {
        const dataISO = reunioesGDL[i].start;
        const data = new Date(dataISO);
        const dia = data.getDate();
        const mes = data.toLocaleString("pt-BR", { month: "short" });
        reunioesGDL[i].start = `${dia} ${mes.charAt(0).toUpperCase() + mes.slice(1)}`;
      }

      setGdlEvents(reunioesGDL);

    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado");
    }
  }

  getDateGDL();
}, [user?.id, user?.cargo]);



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
                    ["lider", "supervisor", "coordenador"].includes(user?.cargo)
                      ? "overflow-x-auto touch-pan-x cursor-grab active:cursor-grabbing"
                      : "overflow-visible"
                  }`}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                >
                  <div className="flex gap-10 w-full justify-start">
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
                      <Card title="Supervisores" value={<CountUp duration={3.5} end={0} />} />
                    )}

                    {/* ======== CARDS DE REUNIÕES (DINÂMICOS) ======== */}
                    {user?.cargo === "lider" && (
                      <MeetingCard title="Reunião GDL" date={gdlEvents[0]?.start || "S/D"} />
                    )}

                    {user?.cargo === "supervisor" && (
                      <MeetingCard title="Reunião GDS" date="15 Set" />
                    )}

                    {user?.cargo === "coordenador" && (
                      <MeetingCard title="Reunião GDC" date="20 Set" />
                    )}

                    {user && <MeetingCard title="Reunião GD" date="20 Set" />}
                  </div>
                </section>

                {/* ======== RELATÓRIOS E NOTIFICAÇÕES ======== */}
                <section className="w-full flex flex-col md:flex-row justify-between gap-12 mt-10 mb-10">
                  <div className="w-full md:w-1/2 flex flex-col gap-6">
                    <InfoBox title="Últimos Relatórios" items={[]} />
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
                <div className="max-w-full w-full flex flex-col items-start bg-[#514F4F]/40 px-6 py-6 gap-8 rounded-md">
                  <span className="text-2xl font-manrope font-bold">
                    Estatísticas
                  </span>
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
  <div className="max-w-72 w-72 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-md">
    <span className="text-lg font-manrope font-semibold">{title}</span>
    <span className="text-6xl font-manrope font-bold">
      {value}
    </span>
  </div>
);

const MeetingCard = ({ title, date }: { title: string; date: string }) => (
  <div className="max-w-72 w-72 flex flex-col items-start bg-blue-500/60 px-6 py-8 gap-4 rounded-md">
    <span className="text-lg font-manrope font-semibold">{title}</span>
    <span className="text-6xl font-manrope font-bold">
      <span className="text-5xl font-extralight">{date}</span>
    </span>
  </div>
);

const InfoBox = ({ title, items }: { title: string; items: string[] }) => (
  <div className="max-w-full w-full h-full flex flex-col items-start bg-[#514F4F]/40 px-6 py-6 gap-8 rounded-md">
    <span className="text-2xl font-manrope font-bold">{title}</span>
    {items && ( 
      <>
        <ul className="w-full px-6 flex flex-col gap-4">
          {items.map((item, i) => (
            <li key={i} className="font-poppins list-disc text-lg">
              {item}
            </li>
          ))}
        </ul>
      </>
    )}
    {items.length === 0 && (
      <>
        <div className="w-full h-full flex flex-col justify-center items-center mb-20">
          <span className="text-xl font-manrope font-normal">Nenhuma notificação recebida</span>
        </div>
      </>
    )}
  </div>
);
