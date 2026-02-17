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
import Incell from "../../../../public/assets/file Incell black.png";
import toast from "react-hot-toast";
import Image from "next/image";
import * as exifr from "exifr";

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

type PessoaRelatorio = {
  id: string;
  nome: string;
  cargo: string;
};


/* =========================
   COMPONENT
========================= */

export default function RelatorioCelula() {
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm<RelatorioForm>();

  const [discipulos, setDiscipulos] = useState<DiscipulosType[]>([]);
  const [celula, setCelula] = useState<CelulaType | null>(null);


  const requestDiscipulos = useCallback(async () => {
  if (!celula?.id) return;

  const { data, error } = await supabase
    .from("discipulos")
    .select("id, nome, cargo")
    .eq("celula_id", celula.id);

  if (error) {
    console.error("Erro ao buscar discípulos:", error);
    return;
  }

  setDiscipulos(data);
}, [celula?.id]);


  const requestCelulas = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("celulas")
      .select("id, nome")
      .eq("responsavel_id", user.id)
      .single();

    if (error) {
      console.error("Erro ao buscar célula:", error);
      return;
    }

    setCelula(data);
  }, [user?.id]);

  const requestCelulaPrincipal = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("celulas")
      .select("id, nome")
      .eq("responsavel_id", user.id)
      .single();

    if (error) {
      console.error("Erro ao buscar célula principal:", error);
      return;
    }

    setCelula(data);
  }, [user?.id]);


  const requestCelulasRelacionadas = useCallback(async () => {
    if (!celula?.id) return [];

    const { data, error } = await supabase
      .from("vinculos")
      .select(`
        celula_principal_id,
        celula_vinculada_id
      `)
      .or(
        `celula_principal_id.eq.${celula.id},celula_vinculada_id.eq.${celula.id}`
      );

    if (error) {
      console.error("Erro ao buscar vínculos:", error);
      return [celula.id];
    }

    const ids = new Set<string>();
    ids.add(celula.id);

    data.forEach(v => {
      ids.add(v.celula_principal_id);
      ids.add(v.celula_vinculada_id);
    });

    return Array.from(ids);
  }, [celula?.id]);


  const requestPessoasRelatorio = useCallback(async () => {
    if (!celula?.id) return;

    const celulasIds = await requestCelulasRelacionadas();

    // 🔹 Discípulos
    const { data: discipulosData } = await supabase
      .from("discipulos")
      .select("id, nome, cargo")
      .in("celula_id", celulasIds);

    // 🔹 Líderes das células
    const { data: lideresData } = await supabase
      .from("celulas")
      .select(`
        responsavel:responsavel_id (
          id,
          nome,
          cargo
        )
      `)
      .in("id", celulasIds);

    const lideresFormatados =
      lideresData
        ?.map((c: any) => c.responsavel)
        .filter(Boolean) ?? [];

    const listaFinal = [
      ...(lideresFormatados ?? []),
      ...(discipulosData ?? []),
    ];

    setDiscipulos(listaFinal);
  }, [celula?.id, requestCelulasRelacionadas]);



  useEffect(() => {
    if (!user) return;
    requestCelulaPrincipal();
  }, [user, requestCelulaPrincipal]);

  useEffect(() => {
    if (!celula) return;
    requestPessoasRelatorio();
  }, [celula, requestPessoasRelatorio]);




  const compressImage = async (
    file: File,
    maxWidth = 1280,
    quality = 0.7
  ): Promise<string> => {
    const orientation = await exifr.orientation(file).catch(() => 1);

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

          // Ajusta canvas conforme rotação
          if (orientation === 6 || orientation === 8) {
            canvas.width = height;
            canvas.height = width;
          } else {
            canvas.width = width;
            canvas.height = height;
          }

          // Corrige orientação
          switch (orientation) {
            case 3:
              ctx.translate(canvas.width, canvas.height);
              ctx.rotate(Math.PI);
              break;
            case 6:
              ctx.translate(canvas.width, 0);
              ctx.rotate(Math.PI / 2);
              break;
            case 8:
              ctx.translate(0, canvas.height);
              ctx.rotate(-Math.PI / 2);
              break;
          }

          ctx.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL("image/jpeg", quality);
          resolve(base64);
        };

        img.onerror = reject;
        img.src = reader.result as string;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };


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


  async function gerarPdf(dados: RelatorioForm): Promise<string> {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const marginBottom = 20;

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

    const fotoBase64 = await compressImage(dados.fotoCelula[0], 1280, 0.7);
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

    let y = (doc as any).lastAutoTable.finalY + 10;

    // ===== OBSERVAÇÕES DINÂMICAS =====
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Observações", 14, y);
    y += 6;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);

    const linhas = doc.splitTextToSize(dados.observacoes, 180);

    for (let i = 0; i < linhas.length; i++) {
      if (y > pageHeight - marginBottom) {
        doc.addPage();
        y = 20;
      }
      doc.text(linhas[i], 14, y);
      y += 6;
    }

    return doc.output("datauristring");
  }



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

      console.log(res)

      const result = await res.json();
      if (!res.ok) {
        console.error("Erro da API:", result);
        throw new Error(result.error || "Erro desconhecido");
      }

      toast.dismiss();
      toast.success("Relatório criado com sucesso!");
      reset();

    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Erro ao criar relatório!");
    }
  };


  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto">
          <header className="w-full flex justify-end px-6 pt-6 md:px-10">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              width={12}
              height={12}
              src={user?.foto || ""}
              alt="Perfil"
            />
          </header>

          <section className="max-w-6xl w-full px-10 flex flex-col justify-center 
          md:mt-4 md:mb-10">
            <h1 className="font-bold text-3xl font-manrope text-center mt-4
            md:text-4xl md:text-start md:mt-0">
              Relatório de Célula
            </h1>

            <form
              onSubmit={handleSubmit(handleSubmitRelatoryCell)}
              className="mt-10 flex flex-col gap-4 mb-24
              md:mb-0"
            >
              <div className="w-full flex flex-col gap-4
              md:flex-row md:gap-10">
                <Input
                  nome="Data da célula"
                  type="date"
                  {...register("dataCelula", { required: true })}
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


              <div className="w-full flex flex-col gap-4
              md:flex-row md:gap-10">
                <Select nome="Dinâmica"
                {...register("dinamica", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} key={d.id} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>


                <Select nome="Ministração"
                {...register("ministracao", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} key={d.id} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>

                <Select nome="Oração Início"
                {...register("oracaoInicio", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} key={d.id} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>
              </div>


              <div className="w-full flex flex-col gap-4
              md:flex-row md:gap-10">
                <Select nome="Oração do Lanche"
                {...register("oracaoLanche", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} key={d.id} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>


                <Select nome="Oração Final"
                {...register("oracaoFinal", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} key={d.id} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>

                <Input
                  nome="Aceitaram Jesus?"
                  type="number"
                  min={0}
                  {...register("aceitouJesus", { required: true })}
                />
              </div>


              <div className="w-full flex flex-col gap-4
              md:flex-row md:gap-10">
                <Input
                  nome="Reconciliações?"
                  type="number"
                  min={0}
                  {...register("reconciliacao", { required: true })}
                />


                <Input
                  nome="Visitantes?"
                  type="number"
                  min={0}
                  {...register("visitantes", { required: true })}
                />

                {user?.cargo === "lider" && (
                  <>
                    <Select nome="Supervisor Presente?"
                    {...register("supervisorPresente", { required: true })}>
                      <option value={""} className="text-black font-bold">Selecione</option>
                      <option value="Sim" className="text-black font-bold">Sim</option>
                      <option value="Não" className="text-black font-bold">Não</option>
                    </Select>
                  </>
                )}

                {user?.cargo === "supervisor" && (
                  <>
                    <Select nome="Coordenador Presente?"
                    {...register("supervisorPresente", { required: true })}>
                      <option value={""} className="text-black font-bold">Selecione</option>
                      <option value="Sim" className="text-black font-bold">Sim</option>
                      <option value="Não" className="text-black font-bold">Não</option>
                    </Select>
                  </>
                )}
              </div>



              <div className="w-full flex items-stretch justify-between gap-8">

                <div className="w-full flex flex-col gap-2">
                  <label className="font-manrope text-lg">Observações:</label>
                  <textarea
                  className="bg-[#514F4F]/40 p-4 rounded-lg border border-white
                  hover:border-blue-400 
                  focus:border-blue-500 focus:ring-blue-400 focus:outline-none"
                  {...register("observacoes", { required: true })}>
                  </textarea>
                </div>
              </div>

              <Input
                  nome="Foto da Célula"
                  type="file"
                  {...register("fotoCelula", { required: true })}
                />



              <button
              className="w-full p-3 mt-4 bg-blue-600 font-manrope font-extrabold rounded-sm transition-all
              md:mt-0
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
