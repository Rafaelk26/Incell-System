"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../../context/useUser";
import { Navbar } from "@/components/all/navBar";
import { Input } from "@/components/inputs";
import { useForm } from "react-hook-form";
import { Select } from "@/components/select";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Incell from "../../../../public/assets/file Incell.png";
import toast from "react-hot-toast";

/* =========================
   TYPES
========================= */

type RelatorioForm = {
  dataCelula: string;
  horaInicio: string;
  horaFinal: string;
  dinamica: string;
  oracaoInicio: string;
  oracaoFinal: string;
  oracaoLanche: string;
  ministracao: string;
  visitantes: string;
  reconciliacao: string;
  aceitouJesus: string;
  supervisorPresente: string;
  observacoes: string;
  fotoCelula: FileList;
};

type DiscipulosType = {
  id: string;
  nome: string;
  cargo: string;
};

type CelulaType = {
  id: string;
  nome: string;
};

/* =========================
   COMPONENT
========================= */

export default function RelatorioCelula() {
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm<RelatorioForm>();

  const [discipulos, setDiscipulos] = useState<DiscipulosType[]>([]);
  const [celula, setCelula] = useState<CelulaType | null>(null);

  /* =========================
     REQUESTS
  ========================= */

  const requestDiscipulos = useCallback(async () => {
    const { data, error } = await supabase
      .from("discipulos")
      .select("id, nome, cargo");

    if (!error && data) setDiscipulos(data);
  }, []);

  const requestCelulas = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("celulas")
      .select("id, nome")
      .eq("responsavel_id", user.id)
      .limit(1);

    if (error || !data || data.length === 0) {
      console.error("Célula não encontrada");
      return;
    }

    setCelula(data[0]);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    requestDiscipulos();
    requestCelulas();
  }, [user, requestDiscipulos, requestCelulas]);

  /* =========================
     UTILITIES
  ========================= */

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const urlToBase64 = async (url: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return fileToBase64(blob as File);
  };

  const formatarDataBR = (data: string) => {
    if (!data) return "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  /* =========================
     PDF
  ========================= */

  async function gerarPdf(dados: RelatorioForm): Promise<string> {
    const doc = new jsPDF();
    let currentY = 10;

    const logoBase64 = await urlToBase64(Incell.src);
    doc.addImage(logoBase64, "PNG", 85, currentY, 40, 20);

    currentY += 30;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Relatório de Célula", 105, currentY, { align: "center" });

    currentY += 10;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`Célula: ${celula?.nome}`, 105, currentY, { align: "center" });

    currentY += 10;

    const fotoBase64 = await fileToBase64(dados.fotoCelula[0]);
    doc.addImage(fotoBase64, "JPEG", 25, currentY, 160, 80);

    currentY += 90;

    autoTable(doc, {
      startY: currentY,
      theme: "grid",
      head: [["Campo", "Informação"]],
      body: [
        ["Data", formatarDataBR(dados.dataCelula)],
        ["Horário", `${dados.horaInicio} - ${dados.horaFinal}`],
        ["Oração Inicial", dados.oracaoInicio],
        ["Dinâmica", dados.dinamica],
        ["Ministração", dados.ministracao],
        ["Oração do Lanche", dados.oracaoLanche],
        ["Oração Final", dados.oracaoFinal],
        ["Visitantes", dados.visitantes],
        ["Reconciliações", dados.reconciliacao],
        ["Aceitaram Jesus", dados.aceitouJesus],
        ["Supervisor Presente", dados.supervisorPresente],
      ],
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: 255,
      },
      columnStyles: {
        0: {
          fillColor: [0, 0, 0],
          textColor: 255,
          fontStyle: "bold",
        },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("Helvetica", "bold");
    doc.text("Observações", 14, finalY);

    doc.setFont("Helvetica", "normal");
    doc.text(dados.observacoes, 14, finalY + 6, { maxWidth: 180 });

    return doc.output("datauristring");
  }

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmitRelatoryCell = async (data: RelatorioForm) => {
    if (!user || !celula) {
      toast.error("Usuário ou célula inválidos");
      return;
    }

    try {
      toast.loading("Gerando relatório...");

      const pdfBase64 = await gerarPdf(data);
      const formData = new FormData();

      formData.append("responsavel", user.id);
      formData.append("tipo", "CELULA");
      formData.append("conteudo", pdfBase64);
      formData.append("celula_id", celula.id);

      const res = await fetch("/api/relatorios/celula", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.dismiss();
      toast.success("Relatório criado com sucesso!");
      reset();

    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Erro ao criar relatório!");
    }
  };

  /* =========================
     UI
  ========================= */

  return (
    <ProtectedLayout>
      <Navbar />
      <main className="max-w-6xl mx-auto p-10">
        <h1 className="text-4xl font-bold mb-10">Relatório de Célula</h1>

        <form onSubmit={handleSubmit(handleSubmitRelatoryCell)} className="flex flex-col gap-4">
          <Input nome="Data" type="date" {...register("dataCelula", { required: true })} />
          <Input nome="Hora início" type="time" {...register("horaInicio", { required: true })} />
          <Input nome="Hora final" type="time" {...register("horaFinal", { required: true })} />

          <Select nome="Dinâmica" {...register("dinamica")}>
            <option value="">Selecione</option>
            {discipulos.map(d => (
              <option key={d.id} value={d.nome}>{d.nome} - {d.cargo}</option>
            ))}
          </Select>

          <textarea
            className="p-3 border rounded"
            placeholder="Observações"
            {...register("observacoes", { required: true })}
          />

          <Input nome="Foto da célula" type="file" {...register("fotoCelula", { required: true })} />

          <button className="bg-blue-600 text-white p-3 rounded font-bold">
            Registrar
          </button>
        </form>
      </main>
    </ProtectedLayout>
  );
}
