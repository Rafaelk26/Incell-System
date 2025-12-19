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
import Image from "next/image";
import Perfil from "../../../../public/assets/perfil teste.avif";

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


  useEffect(() => {
    if (!user) return;
    requestCelulas();
  }, [user, requestCelulas]);

  useEffect(() => {
    if (!celula) return;
    requestDiscipulos();
  }, [celula, requestDiscipulos]);




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
          <header className="w-full flex justify-end px-10 pt-6">
            <Image
              className="w-12 rounded-full border border-white"
              src={Perfil}
              alt="Perfil"
            />
          </header>

          <section className="max-w-6xl w-full px-10 md:mt-14 md:mb-10">
            <h1 className="font-bold text-4xl font-manrope">
              Relatório de Célula
            </h1>

            <form
              onSubmit={handleSubmit(handleSubmitRelatoryCell)}
              className="mt-10 flex flex-col gap-4"
            >
              <div className="w-full flex gap-10">
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


              <div className="w-full flex gap-10">
                <Select nome="Dinâmica"
                {...register("dinamica", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} key={user?.id} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} key={d.id} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>


                <Select nome="Ministração"
                {...register("ministracao", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} key={user?.id} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} key={d.id} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>

                <Select nome="Oração Início"
                {...register("oracaoInicio", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} key={user?.id} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} key={d.id} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>
              </div>


              <div className="w-full flex gap-10">
                <Select nome="Oração do Lanche"
                {...register("oracaoLanche", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} key={user?.id} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} key={d.id} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>


                <Select nome="Oração Final"
                {...register("oracaoFinal", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} key={user?.id} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
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


              <div className="w-full flex gap-10">
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
                  <label className="font-manrope text-lg">Observações</label>
                  <textarea
                  className="bg-[#514F4F]/40 p-4 rounded-lg border border-white
                  hover:border-blue-400 
                  focus:border-blue-500 focus:ring-blue-400 focus:outline-none"
                  {...register("observacoes", { required: true })}>
                  </textarea>
                </div>

                <Input
                  nome="Foto da Célula"
                  type="file"
                  {...register("fotoCelula", { required: true })}
                />
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
