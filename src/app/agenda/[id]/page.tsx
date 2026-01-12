"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/useUser";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import toast from "react-hot-toast";
import ModalCriarReuniao from "@/components/modais/ModalCriarReuniao";
import ModalReunioesDoDia from "@/components/modais/ModalReunioesDoDia";
import ProtectedLayout from "@/app/middleware/protectedLayout";

export default function Agenda() {
  const { user } = useAuth();

  const [eventos, setEventos] = useState<any[]>([]);
  const [eventosDoDia, setEventosDoDia] = useState<any[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);

  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [modalDiaAberto, setModalDiaAberto] = useState(false);

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

  return (
    <ProtectedLayout>
        <main className="max-w-full h-screen flex">
          <Navbar />
          <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto px-4">

            <header className="w-full flex justify-end pt-6">
              <Image
                className="w-12 h-12 rounded-full border border-white"
                src={user?.foto || ""}
                width={50}
                height={50}
                alt="Perfil"
                priority
              />
            </header>

            <h1 className="text-3xl font-manrope font-semibold mb-6">Agenda</h1>

            <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locales={[ptBrLocale]}
            locale="pt-br"
            events={eventos}
            displayEventTime={false}
            dateClick={(info) => {
              const filtrados = eventos.filter((e) =>
                e.start.startsWith(info.dateStr)
              );

              setEventosDoDia(filtrados);
              setDataSelecionada(info.dateStr);
              setModalDiaAberto(true);
            }}
          />


            {modalCriarAberto && (
              <ModalCriarReuniao
                data={dataSelecionada}
                onClose={() => setModalCriarAberto(false)}
                onCreated={(novoEvento) =>
                  setEventos((prev) => [...prev, novoEvento])
                }
              />
            )}

            {modalDiaAberto && dataSelecionada && (
              <ModalReunioesDoDia
                data={dataSelecionada}
                eventos={eventosDoDia}
                onClose={() => setModalDiaAberto(false)}
                onDeleted={(id) =>
                  setEventos((prev) => prev.filter((e) => e.id !== id))
                }
                onCreated={(novoEvento) =>
                  setEventos((prev) => [...prev, novoEvento])
                }
              />
              )}
          </main>
      </main>
    </ProtectedLayout>
  );
}
