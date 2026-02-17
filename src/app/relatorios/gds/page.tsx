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
      .from("coordenacao_supervisoes")
      .select(`
        supervisoes (
          id,
          nome,
          supervisor:supervisor_id (
            id,
            nome,
            cargo
          )
        )
      `)
      .eq("coordenacao_id", coordenacao.id);

    if (error) {
      console.error("Erro ao buscar supervisores:", error);
      return;
    }


    const formatados: SupervisorType[] =
      data
        ?.map((item: any) => item.supervisoes?.supervisor)
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

  function adicionarTextoQuebrado(
      doc: jsPDF,
      texto: string,
      x: number,
      yInicial: number,
      larguraMax: number,
      margemInferior = 20
    ) {
      const linhas = doc.splitTextToSize(texto, larguraMax);
      const alturaLinha = 6;
      const alturaPagina = doc.internal.pageSize.height;
  
      let y = yInicial;
  
      linhas.forEach((linha: string) => {
        if (y + alturaLinha > alturaPagina - margemInferior) {
          doc.addPage();
          y = 20;
        }
        doc.text(linha, x, y);
        y += alturaLinha;
      });
  
      return y;
    }


  const compressImage = async (
  file: File,
  maxWidth = 1280,
  maxSizeKB = 500
): Promise<string> => {

  // 🚨 GARANTIA ABSOLUTA: só roda no browser
  if (typeof window === "undefined") {
    throw new Error("compressImage só pode rodar no client");
  }

  // imports dinâmicos (CLIENT ONLY)
  const heic2any = (await import("heic2any")).default;
  const exifr = await import("exifr");

  let fileToProcess = file;

  /* =========================
     HEIC → JPEG
  ========================= */
  if (
    file.type === "image/heic" ||
    file.name.toLowerCase().endsWith(".heic")
  ) {
    const convertedBlob = (await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    })) as Blob;

    fileToProcess = new File(
      [convertedBlob],
      file.name.replace(/\.heic$/i, ".jpg"),
      { type: "image/jpeg" }
    );
  }

  const orientation = await exifr.orientation(fileToProcess).catch(() => 1);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = document.createElement("img");

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Erro ao criar canvas");

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        let base64 = canvas.toDataURL("image/jpeg", quality);

        while (base64.length / 1024 > maxSizeKB && quality > 0.4) {
          quality -= 0.05;
          base64 = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(base64);
      };

      img.onerror = reject;
      img.src = reader.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(fileToProcess);
  });
};


  async function gerarPdf(dados: RelatorioForm): Promise<string> {
    const doc = new jsPDF();
    let currentY = 10;

    const logoBase64 = await urlToBase64(Incell.src);
    doc.addImage(logoBase64, "PNG", 85, currentY, 40, 20);

    currentY += 30;

    if (dados.fotoGDS[0].size > 5 * 1024 * 1024) {
      toast("Imagem grande detectada, otimizando automaticamente...");
    }

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

    const fotoBase64 = await compressImage(dados.fotoGDS[0], 1280, 0.7);
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
    doc.setFontSize(14);
    doc.text("Observações", 14, y);

    y += 8;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);

    y = adicionarTextoQuebrado(
      doc,
      dados.observacoes,
      14,
      y,
      180
    );


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

          <section className="max-w-6xl w-full px-10 mt-8 mb-16 md:mt-4 md:mb-10">
            <h1 className="font-bold text-center text-4xl font-manrope
            md:text-start">
              Relatório de GDS
            </h1>

            <form
              onSubmit={handleSubmit(handleSubmitRelatorioGDS)}
              className="flex flex-col gap-4 md:mt-10"
            >
              <div className="mt-10 flex flex-col gap-4
              md:mb-0 md:flex-row md:mt-0">

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


              <div className="w-full md:flex md:tems-stretch md:justify-between md:gap-8">

                <div className="w-full flex flex-col gap-2">
                  <label className="font-manrope text-lg">Observações</label>
                  <textarea
                  className="bg-[#514F4F]/40 p-4 rounded-lg border border-white
                  hover:border-blue-400 
                  focus:border-blue-500 focus:ring-blue-400 focus:outline-none"
                  {...register("observacoes", { required: true })}>
                  </textarea>
                </div>
              </div>

              <Input
                nome="Foto"
                type="file"
                {...register("fotoGDS", { required: true })}
              />

            {/* TABELA */}
            <div className="w-full h-[200px] mt-0 overflow-x-auto">
                <table className="w-full border-collapse text-white">
                    <thead>
                        <tr className="w-full bg-zinc-950/90 text-white text-sm font-normal font-manrope 
                        md:text-md">
                        <th className="p-3 text-left font-manrope rounded-tl-xl">
                            Supervisores Confirmados na Reunião
                        </th>
                        <th className="max-w-full p-3 text-left rounded-tr-xl"></th>
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
                              className="odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                            >
                              <td className="w-full px-3 py-2 font-manrope font-light">
                                <span className="text-xl font-semibold">
                                  {item.nome}
                                </span>
                              </td>

                              <td className="px-3 py-2 text-right">
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
            className="w-full p-3 bg-blue-600 font-manrope font-extrabold rounded-sm transition-all
            hover:bg-blue-500 hover:cursor-pointer
            focus:outline-none" 
            type="submit">Registrar</button>

            </form>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
