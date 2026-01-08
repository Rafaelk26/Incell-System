import toast from "react-hot-toast";

type EventoAgenda = {
  id: string;
  title: string;
  start: string;
  editable: boolean;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    discipulado?: string | null;
  };
};


type ModalCriarReuniaoProps = {
  data: string | null;
  onClose: () => void;
  onCreated: (evento: EventoAgenda) => void;
};

export default function ModalCriarReuniao({
  data,
  onClose,
  onCreated,
}: ModalCriarReuniaoProps) {

  async function criar() {
    const res = await fetch("/api/reunioes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "DISCIPULADO",
        data,
        hora: "19:00",
        criado_por: "USER_ID",
        discipulado_com: "DISCIPULO_ID",
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error("Erro ao criar reunião");
      return;
    }

    const novoEvento: EventoAgenda = {
      id: json.evento.id,
      title: json.evento.tipo,
      start: `${json.evento.data}T${json.evento.hora}`,
      editable: true,
      backgroundColor: "#3b82f6",
      borderColor: "#3b82f6",
      extendedProps: {
        discipulado: json.evento.discipulo
          ? `${json.evento.discipulo.nome} — ${json.evento.discipulo.cargo}`
          : null,
      },
    };

    onCreated(novoEvento);

    toast.success("Reunião criada");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-black p-6 rounded-xl">
        <button onClick={criar}>Criar</button>
      </div>
    </div>
  );
}
