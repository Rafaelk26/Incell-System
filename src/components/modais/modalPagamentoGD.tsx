"use client";
import { useState } from "react";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  responsavelId: string;
};

export default function PaymentModal({ open, onClose, responsavelId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    if (!file) return alert("Selecione um comprovante");

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("responsavel_id", responsavelId);
      formData.append("file", file);

      const res = await fetch("/api/pagamentos", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      toast.success("Pagamento enviado com sucesso");
      onClose();
    } catch {
      toast.error("Erro ao enviar pagamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-3xl font-bold font-manrope mb-4">Pagamento GD</h2>

        <p className="text-sm text-zinc-400 mb-4 font-manrope">
          Envie aqui o extrato de pagamento da reunião de GD no valor de R$ 30,00.
        </p>

        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 text-white border border-gray-400 p-3 rounded-lg"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded font-manrope bg-zinc-700 transition-all 
            hover:scale-105 hover:cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded font-manrope bg-blue-600 transition-all 
            hover:scale-105 hover:cursor-pointer"
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
