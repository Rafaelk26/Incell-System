"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import IncellLogo from "../../../public/assets/file Incell.png";
import { useAuth } from "@/app/context/useUser";

// ================= TIPOS =================

type EventoAgenda = {
  id: string;
  title: string;
  start: string;
  editable?: boolean;
  criado_por?: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    tipo: string;
    descricao: string | null;
  };
};

type Discipulo = {
  id: string;
  nome: string;
  cargo: string;
};

type ModalCriarReuniaoProps = {
  data: string | null;
  onClose: () => void;
  onCreated: (evento: EventoAgenda) => void;
};

// ================= COMPONENTE =================

export default function ModalCriarReuniao({
  data,
  onClose,
  onCreated,
}: ModalCriarReuniaoProps) {
  const { user } = useAuth();

  // ===== STATES =====
  const [tipo, setTipo] = useState<string>("");
  const [hora, setHora] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState<string>(data ?? "");

  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [discipuloSelecionado, setDiscipuloSelecionado] = useState("");

  // ===== HIERARQUIA =====
  const tiposPorCargo: Record<string, string[]> = {
    lider: ["DISCIPULADO"],
    supervisor: ["DISCIPULADO", "GDL"],
    coordenador: ["DISCIPULADO", "GDS"],
    pastor: ["DISCIPULADO", "GDC", "GD"],
  };

  // ===== TIPOS PERMITIDOS =====
  const tiposDisponiveis = useMemo(() => {
    if (!user?.cargo) return ["DISCIPULADO"];
    return tiposPorCargo[user.cargo] ?? ["DISCIPULADO"];
  }, [user?.cargo]);

  // Sempre define o primeiro tipo permitido
  useEffect(() => {
    if (tiposDisponiveis.length > 0) {
      setTipo(tiposDisponiveis[0]);
    }
  }, [tiposDisponiveis]);

  // ===== BUSCAR DISCÍPULOS DA CÉLULA =====
  useEffect(() => {
      async function carregarDiscipulos() {
      const res = await fetch(
        `/api/discipulos?celula=true&liderId=${user?.id}`
      );

      const json = await res.json();

      if (!res.ok) {
        toast.error("Erro ao carregar discípulos");
        return;
      }

      setDiscipulos(json.discipulos);
    }

    carregarDiscipulos();
  }, [user?.id]);


  // ===== SALVAR =====
  async function salvar() {

    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }


    if (!dataSelecionada) {
      toast.error("Informe a data");
      return;
    }

    if (!hora) {
      toast.error("Informe a hora");
      return;
    }

    if (tipo === "DISCIPULADO" && !discipuloSelecionado) {
      toast.error("Selecione o discípulo");
      return;
    }

    const res = await fetch("/api/reunioes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        data: dataSelecionada,
        hora,
        criado_por: user?.id,
        discipulado_com:
          tipo === "DISCIPULADO" ? discipuloSelecionado : null,
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
        tipo: json.evento.tipo,
        descricao: json.evento.discipulo,
      },
    };

    onCreated(novoEvento);
    toast.success("Reunião criada!");
    onClose();
  }

  // ================= JSX =================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black rounded-xl p-6 w-full max-w-sm">

        <Image
          className="mx-auto"
          width={200}
          src={IncellLogo}
          alt="Logo Incell"
        />

        <h2 className="text-xl font-manrope my-4">
          Criar reunião
        </h2>

        <div className="flex flex-col gap-4">

          {/* 📅 DATA */}
          <div>
            <label className="text-sm font-manrope">Data</label>
            <input
              type="date"
              className="w-full border rounded-md p-2 bg-black"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
            />
          </div>

          {/* 🏷️ TIPO */}
          <div>
            <label className="text-sm font-manrope">
              Tipo da reunião
            </label>

            <select
              className="w-full border rounded-md p-2 bg-black"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {tiposDisponiveis.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* 👤 DISCIPULADO */}
            {tipo === "DISCIPULADO" && (
              <div className="mt-4">
                <label className="text-sm font-manrope">
                  Discipulado com
                </label>

                <select
                  className="w-full border rounded-md p-2 bg-black"
                  value={discipuloSelecionado}
                  onChange={(e) => setDiscipuloSelecionado(e.target.value)}
                >
                  <option value="">Selecione um membro</option>

                  {discipulos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome} — {d.cargo}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ⏰ HORA */}
          <div>
            <label className="text-sm font-manrope">Hora</label>
            <input
              type="time"
              className="w-full border rounded-md p-2 bg-black"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>

          {/* 🔘 BOTÕES */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="w-full border rounded-md py-2"
            >
              Cancelar
            </button>

            <button
              onClick={salvar}
              className="w-full bg-blue-500 text-white rounded-md py-2"
            >
              Salvar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
