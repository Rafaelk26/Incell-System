"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import { Input } from "@/components/inputs";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Incell from "../../../../public/assets/file Incell black.png";
import toast from "react-hot-toast";
import { ButtonAction } from "@/components/all/buttonAction";

/* ==================== TIPOS ==================== */

type RelatorioForm = {
  dataGDS: string;
  horaInicio: string;
  horaFinal: string;
  observacoes: string;
  fotoGDS: FileList;
};

type CoordenacaoType = {
  id: string;
  nome: string;
};

type SupervisorType = {
  id: string;
  nome: string;
  cargo: string;
};

type SupervisorPresenca = {
  id: string;
  nome: string;
};

/* ==================== COMPONENT ==================== */

export default function RelatorioGDS() {
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm<RelatorioForm>();

  const [coordenacao, setCoordenacao] = useState<CoordenacaoType | null>(null);
  const [supervisores, setSupervisores] = useState<SupervisorType[]>([]);
  const [presentes, setPresentes] = useState<SupervisorPresenca[]>([]);

  /* ==================== BUSCAR COORDENAÇÃO ==================== */

  const requestCoordenacao = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("coordenacoes")
      .select("id, nome")
      .eq("coordenador_id", user.id)
      .single();

    if (error || !data) {
      console.error("Coordenação não encontrada");
      return;
    }

    setCoordenacao(data);
  }, [user?.id]);

  /* ==================== BUSCAR SUPERVISORES ==================== */

  const requestSupervisores = useCallback(async () => {
    if (!coordenacao?.id) return;

    const { data, error } = await supabase
      .from("supervisoes")
      .select(`
        supervisor:supervisor_id (
          id,
          nome,
          cargo
        )
      `)
      .eq("coordenacao_id", coordenacao.id);

    if (error) {
      console.error("Erro ao buscar supervisores:", error);
      return;
    }

    const formatados: SupervisorType[] =
      data
        ?.map((item: any) => item.supervisor)
        .filter(
          (sup: any) => sup && sup.cargo?.toLowerCase() === "supervisor"
        )
        .map((sup: any) => ({
          id: sup.id,
          nome: sup.nome,
          cargo: sup.cargo,
        })) ?? [];

    setSupervisores(formatados);
  }, [coordenacao?.id]);

  /* ==================== EFFECTS ==================== */

  useEffect(() => {
    if (!user?.id) return;
    requestCoordenacao();
  }, [user?.id, requestCoordenacao]);

  useEffect(() => {
    if (!coordenacao?.id) return;
    requestSupervisores();
  }, [coordenacao?.id, requestSupervisores]);

  /* ==================== PRESENÇA LOCAL ==================== */

  const toggleSupervisor = (supervisor: SupervisorPresenca) => {
    const exists = presentes.some((s) => s.id === supervisor.id);

    if (exists) {
      setPresentes((prev) => prev.filter((s) => s.id !== supervisor.id));
    } else {
      setPresentes((prev) => [...prev, supervisor]);
    }
  };

  /* ==================== UTIL ==================== */

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
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  /* ==================== GERAR PDF ==================== */

  async function gerarPdf(dados: RelatorioForm): Promise<string> {
    const doc = new jsPDF();
    let currentY = 10;

    const logoBase64 = await urlToBase64(Incell.src);
    doc.addImage(logoBase64, "PNG", 85, currentY, 40, 20);

    currentY += 30;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Relatório de GDS", 105, currentY, { align: "center" });

    currentY += 10;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`Coordenação: ${coordenacao?.nome}`, 105, currentY, {
      align: "center",
    });

    currentY += 10;

    const fotoBase64 = await fileToBase64(dados.fotoGDS[0]);
    doc.addImage(fotoBase64, "JPEG", 25, currentY, 160, 80);

    currentY += 90;

    autoTable(doc, {
      startY: currentY,
      theme: "grid",
      head: [["Campo", "Informação"]],
      body: [
        ["Data", formatarDataBR(dados.dataGDS)],
        ["Horário", `${dados.horaInicio} - ${dados.horaFinal}`],
      ],
      headStyles: { fillColor: [0, 0, 0], textColor: 255 },
      columnStyles: {
        0: { fillColor: [0, 0, 0], textColor: 255, fontStyle: "bold" },
      },
    });

    let y = (doc as any).lastAutoTable.finalY + 15;

    const listaPresentes = presentes.map((s) => `• ${s.nome}`);
    const listaAusentes = supervisores
      .filter((s) => !presentes.some((p) => p.id === s.id))
      .map((s) => `• ${s.nome}`);

    doc.setFont("Helvetica", "bold");
    doc.text("Supervisores Presentes", 14, y);
    doc.setFont("Helvetica", "normal");
    doc.text(listaPresentes.join("\n") || "Nenhum", 14, y + 6);

    y += listaPresentes.length * 6 + 20;

    doc.setFont("Helvetica", "bold");
    doc.text("Supervisores Ausentes", 14, y);
    doc.setFont("Helvetica", "normal");
    doc.text(listaAusentes.join("\n") || "Nenhum", 14, y + 6);

    y += listaAusentes.length * 6 + 20;

    doc.setFont("Helvetica", "bold");
    doc.text("Observações", 14, y);
    doc.setFont("Helvetica", "normal");
    doc.text(dados.observacoes, 14, y + 6, { maxWidth: 180 });

    return doc.output("datauristring");
  }

  /* ==================== SUBMIT ==================== */

  const handleSubmitRelatorioGDS = async (data: RelatorioForm) => {
    if (!user || !coordenacao) {
      toast.error("Usuário ou coordenação inválidos");
      return;
    }

    try {
      toast.loading("Gerando relatório...");

      const pdfBase64 = await gerarPdf(data);
      const formData = new FormData();

      formData.append("responsavel", user.id);
      formData.append("tipo", "GDS");
      formData.append("conteudo", pdfBase64);
      formData.append("coordenacao_id", coordenacao.id);

      const res = await fetch("/api/relatorios/gds", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.dismiss();
      toast.success("Relatório GDS criado com sucesso!");
      reset();
      setPresentes([]);
    } catch (err) {
      toast.dismiss();
      toast.error("Erro ao criar relatório!");
    }
  };

  /* ==================== RENDER ==================== */


  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              width={12}
              height={12}
              src={user?.foto || ""}
              alt="Perfil"
            />
          </header>

          <section className="max-w-6xl w-full px-10 md:mt-14 md:mb-10">
            <h1 className="font-bold text-4xl font-manrope">
              Relatório de GDS
            </h1>

            <form
              onSubmit={handleSubmit(handleSubmitRelatorioGDS)}
              className="mt-10 flex flex-col gap-4"
            >
              <div className="w-full flex gap-10">

                <Input
                  nome="Data do discipulado"
                  type="date"
                  {...register("dataGDS", { required: true })}
                />

                <Input
                  nome="Hora inicial"
                  type="time"
                  {...register("horaInicio", { required: true })}
                />

                <Input
                  nome="Hora final"
                  type="time"
                  {...register("horaFinal", { required: true })}
                />
              </div>


              <div className="w-full flex items-stretch justify-between gap-8">

                <div className="w-full flex flex-col gap-2">
                  <label className="font-manrope text-lg">Observações</label>
                  <textarea
                  className="bg-[#514F4F]/40 p-4 rounded-lg border border-white
                  hover:border-blue-400 
                  focus:border-blue-500 focus:ring-blue-400 focus:outline-none"
                  {...register("observacoes", { required: true })}>
                  </textarea>
                </div>

                <Input
                  nome="Foto do discipulado"
                  type="file"
                  {...register("fotoGDS", { required: true })}
                />
              </div>

            {/* TABELA */}
            <div className="w-full h-[400px] mt-10 overflow-x-auto">
                <table className="w-full border-collapse text-white">
                    <thead>
                        <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                        <th className="p-3 text-left rounded-tl-xl">
                            Líderes Confirmados na Reunião
                        </th>
                        <th className="p-3 text-left rounded-tr-xl"></th>
                        </tr>
                    </thead>
                    <tbody>
                    {supervisores.length > 0 ? (
                        supervisores
                        .filter(item => item.cargo?.trim().toLowerCase() === "supervisor")
                        .map((item) => {
                            const isAdded = presentes.some(
                            (l) => l.id === item.id
                            );

                            return (
                            <tr
                                key={item.id}
                                className="flex justify-between odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                            >
                                <td className="flex flex-col justify-center px-3 py-2 font-manrope font-light">
                                <span className="text-xl font-semibold">
                                    {item.nome}
                                </span>
                                </td>

                                <td className="px-3 py-2 flex gap-6 justify-end">
                                <ButtonAction
                                    type="button"
                                    color={isAdded ? "bg-green-600" : "bg-red-600"}
                                    onClick={() =>
                                    toggleSupervisor({
                                        id: item.id!,
                                        nome: item.nome,
                                    })
                                    }
                                >
                                    <span className="font-manrope text-xl">
                                    {isAdded ? "Presente" : "Ausente"}
                                    </span>
                                </ButtonAction>
                                </td>
                            </tr>
                            );
                        })
                    ) : (
                        <tr>
                        <td
                            colSpan={2}
                            className="text-center p-6 text-white font-manrope font-semibold"
                        >
                            Nenhum supervisor encontrado.
                        </td>
                        </tr>
                    )}
                    </tbody>

                </table>
            </div>

              <button
              className="w-25 p-3 bg-blue-600 font-manrope font-extrabold rounded-sm transition-all
              hover:scale-105 hover:cursor-pointer
              focus:outline-none" 
              type="submit">Registrar</button>

            </form>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
