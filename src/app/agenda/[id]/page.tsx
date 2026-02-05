"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/app/context/useUser";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import toast from "react-hot-toast";
import ModalReunioesDoDia from "@/components/modais/ModalReunioesDoDia";
import ProtectedLayout from "@/app/middleware/protectedLayout";

export default function Agenda() {
  const { user } = useAuth();

  const [eventos, setEventos] = useState<any[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  const [modalDiaAberto, setModalDiaAberto] = useState(false);
  const [loading, setLoading] = useState(false);

  const carregarAgenda = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const res = await fetch("/api/reunioes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        cargo: user.cargo,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error("Erro ao carregar agenda");
      setLoading(false);
      return;
    }

    setEventos(json.eventos);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    carregarAgenda();
  }, [carregarAgenda]);

  const eventosDoDia = useMemo(() => {
    if (!dataSelecionada) return [];
    return eventos.filter((e) =>
      e.start.startsWith(dataSelecionada)
    );
  }, [eventos, dataSelecionada]);

  return (
    <ProtectedLayout>
      <main className="max-w-full h-dvh flex md:h-screen">
        <Navbar />

        <main className="max-w-[84rem] w-full overflow-x-hidden px-4 xl:mx-auto">
          <header className="w-full flex justify-end pt-6">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              src={user?.foto || ""}
              width={48}
              height={48}
              alt="Perfil"
              priority
            />
          </header>

          <h1 className="mt-8 text-3xl font-manrope font-semibold mb-6 md:mt-0">
            Agenda
          </h1>

          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="pt-br"
            locales={[ptBrLocale]}
            events={eventos}
            displayEventTime={false}
            height="auto"
            dateClick={(info) => {
              setDataSelecionada(info.dateStr);
              setModalDiaAberto(true);
            }}
          />

          {modalDiaAberto && dataSelecionada && (
            <ModalReunioesDoDia
              data={dataSelecionada}
              eventos={eventosDoDia}
              onClose={() => setModalDiaAberto(false)}
              onDeleted={async () => {
                await carregarAgenda();
              }}
              onCreated={async () => {
                await carregarAgenda();
              }}
            />
          )}

          {loading && (
            <p className="text-sm text-gray-400 mt-2">
              Atualizando agenda...
            </p>
          )}
        </main>
      </main>
    </ProtectedLayout>
  );
}
