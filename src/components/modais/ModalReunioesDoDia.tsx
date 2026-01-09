import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { IoMdClose } from "react-icons/io";
import ModalCriarReuniao from "./ModalCriarReuniao";

type Evento = {
  id: string;
  title: string;
  start: string;
  editable?: boolean;
  extendedProps?: {
    discipulado?: string | null;
  };
};

type ModalReuniaoProps = {
  data: string;
  eventos: Evento[];
  onClose: () => void;
  onDeleted: (id: string) => void;
  onCreated: (evento: Evento) => void;
};

export default function ModalReunioesDoDia({
  data,
  eventos,
  onClose,
  onDeleted,
  onCreated,
}: ModalReuniaoProps) {
  const [eventosDoDia, setEventosDoDia] = useState<Evento[]>([]);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);

  useEffect(() => {
    setEventosDoDia(eventos);
  }, [eventos]);

  async function excluirEvento(id: string) {
    const res = await fetch("/api/reunioes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      toast.error("Erro ao excluir");
      return;
    }

    toast.success("Reunião excluída");

    setEventosDoDia((prev) => prev.filter((e) => e.id !== id));
    onDeleted(id);
  }

  function handleCreated(evento: Evento) {
    setEventosDoDia((prev) => [...prev, evento]);
    onCreated(evento); // atualiza agenda principal
    setModalCriarAberto(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-black rounded-xl p-6 w-full max-w-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-xl">Reuniões</h2>
            <button onClick={onClose}>
              <IoMdClose size={22} />
            </button>
          </div>

          <span className="text-sm text-gray-400">
            {data.split("-").reverse().join("/")}
          </span>

          {eventosDoDia.length === 0 && (
            <p className="text-sm text-gray-400 mt-4">
              Nenhuma reunião neste dia
            </p>
          )}

          {eventosDoDia.map((e) => (
            <div key={e.id} className="border-b py-2 mt-2">
              <strong>{e.title}</strong>

              {e.extendedProps?.discipulado && (
                <p className="text-sm text-gray-400">
                  Com: {e.extendedProps.discipulado}
                </p>
              )}

              <p className="text-sm">
                {e.start.slice(11, 16)}
              </p>

              {e.editable && (
                <button
                  onClick={() => excluirEvento(e.id)}
                  className="mt-2 bg-red-500 px-2 py-1 rounded text-sm"
                >
                  Excluir
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() => setModalCriarAberto(true)}
            className="mt-4 w-full px-4 py-2 rounded-md bg-blue-500 text-white font-bold"
          >
            + Nova reunião
          </button>
        </div>
      </div>

      {modalCriarAberto && (
        <ModalCriarReuniao
          data={data}
          onClose={() => setModalCriarAberto(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
