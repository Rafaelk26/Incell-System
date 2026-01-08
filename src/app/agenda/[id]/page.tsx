"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/useUser";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import toast from "react-hot-toast";
import ModalCriarReuniao from "@/components/modais/ModalCriarReuniao";
import ModalReunioesDoDia from "@/components/modais/ModalReunioesDoDia";

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
        toast.error("Erro ao carregar agenda");
        return;
      }

      setEventos(json.eventos);
    }

    carregarAgenda();
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-manrope mb-6">Agenda</h1>

      <button
        onClick={() => setModalCriarAberto(true)}
        className="mb-4 px-4 py-2 rounded-md bg-blue-500 text-white font-bold"
      >
        + Nova reunião
      </button>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
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

      {modalDiaAberto && (
        <ModalReunioesDoDia
          data={dataSelecionada}
          eventos={eventosDoDia}
          onClose={() => setModalDiaAberto(false)}
          onDeleted={(id) =>
            setEventos((prev) => prev.filter((e) => e.id !== id))
          }
        />
      )}
    </div>
  );
}
