"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import { useMemo } from "react";
import { useDashboardData } from "../hook/dashboard";
import { useHorizontalDragScroll } from "../hook/useHorizontalDragScroll";
import { Spinner } from "@/components/all/spiner";


/* ============================================================
   📊 DASHBOARD PAGE
============================================================ */
export default function Dashboard() {
  const { user } = useAuth();

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

  const perfilImage = useMemo(() => user?.foto || "", []);

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
              className="w-16 h-16 rounded-full border border-white"
              src={perfilImage}
              width={16}
              height={16}
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
                      <Card title="Discípulos" value={discipulos?.length} />
                    )}

                    {/* CARD LÍDERES */}
                    {user?.cargo === "supervisor" && (
                      <Card title="Líderes" value={totalLideres} />
                    )}

                    {/* CARD SUPERVISORES */}
                    {user?.cargo === "coordenador" && (
                      <Card title="Supervisores" value={5} />
                    )}

                    {/* ======== CARDS DE REUNIÕES (DINÂMICOS) ======== */}
                    {user?.cargo === "lider" && (
                      <MeetingCard title="Reunião GDL" date="12 Set" />
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
                    <InfoBox title="Notificações Recentes" items={[]} />
                  </div>

                  <div className="w-full md:w-1/2 flex flex-col items-start bg-[#514F4F]/40 px-6 py-6 rounded-md">
                    <span className="text-2xl font-manrope font-bold">Calendário</span>
                  </div>
                </section>
              </div>
            </section>
            ) : (
            /* ==================== DASHBOARD ADMIN ==================== */
            <section className="w-full md:mt-14 md:px-4">
              <h1 className="font-bold text-4xl font-manrope">Admin</h1>
              <section className="mt-5 flex justify-between gap-4">
                {["Líderes", "Supervisores", "Coordenadores", "Células"].map(
                  (t, i) => (
                    <Card key={i} title={t} value={0} />
                  )
                )}
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
const Card = ({ title, value }: { title: string; value: number | string }) => (
  <div className="max-w-72 w-72 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-md">
    <span className="text-lg font-manrope font-semibold">{title}</span>
    <span className="text-6xl font-manrope font-bold">{value}</span>
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
  <div className="max-w-full w-full flex flex-col items-start bg-[#514F4F]/40 px-6 py-6 gap-8 rounded-md">
    <span className="text-2xl font-manrope font-bold">{title}</span>
    <ul className="w-full px-6 flex flex-col gap-4">
      {items.map((item, i) => (
        <li key={i} className="font-poppins list-disc text-lg">
          {item}
        </li>
      ))}
    </ul>
  </div>
);
