"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Perfil from "../../../../public/assets/perfil teste.avif";
import Image from "next/image";
import { Input } from "@/components/inputs";
import { useForm } from "react-hook-form";
import { Select } from "@/components/select";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Incell from "../../../../public/assets/file Incell.png";


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
  contato: string;
  dataNascimento: string;
  celula_id?: string;
};


export default function RelatorioDiscipulado() {
  const { user } = useAuth();
  const { register, handleSubmit } = useForm<RelatorioForm>();
  const [discipulos, setDiscipulos] = useState<DiscipulosType[]>([]);

  const requestDiscipulos = useCallback(async () => {

    const { data } = await supabase.from("discipulos").select("*");
    if (data) setDiscipulos(data);
  }, []);

  useEffect(() => {
    if (user) requestDiscipulos();
  }, [user, requestDiscipulos]);

  /* =========================
     UTILIDADES
  ========================= */

  async function fileToBase64(file: File) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  async function urlToBase64(url: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    return fileToBase64(blob as File);
  }

  /* =========================
     PDF
  ========================= */


  function formatarDataBR(data: string) {
    if (!data) return "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }


  async function gerarPdf(dados: RelatorioForm) {
    const doc = new jsPDF();
    let currentY = 10;

    /* ---------- LOGO INCELL ---------- */
    const logoBase64 = await urlToBase64(Incell.src);
    const logoImg = new window.Image();
    logoImg.src = logoBase64;

    await new Promise<void>((resolve) => (logoImg.onload = () => resolve()));

    const maxLogo = 35;
    let logoW = maxLogo;
    let logoH = (logoImg.height / logoImg.width) * logoW;

    if (logoH > maxLogo) {
      logoH = maxLogo;
      logoW = (logoImg.width / logoImg.height) * logoH;
    }

    const centerX = doc.internal.pageSize.getWidth() / 2 - logoW / 2;
    doc.addImage(logoBase64, "PNG", centerX, currentY, logoW, logoH);

    currentY += logoH + 8;

    /* ---------- TÍTULO ---------- */
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Relatório de Célula", 105, currentY, { align: "center" });

    currentY += 10;

    /* ---------- FOTO DA CÉLULA ---------- */
    const fotoBase64 = await fileToBase64(dados.fotoCelula[0]);
    const fotoImg = new window.Image();
    fotoImg.src = fotoBase64;

    await new Promise<void>((resolve) => (fotoImg.onload = () => resolve()));

    const maxFotoW = 160;
    const maxFotoH = 90;

    let fotoW = maxFotoW;
    let fotoH = (fotoImg.height / fotoImg.width) * fotoW;

    if (fotoH > maxFotoH) {
      fotoH = maxFotoH;
      fotoW = (fotoImg.width / fotoImg.height) * fotoH;
    }

    doc.addImage(
      fotoBase64,
      "JPEG",
      105 - fotoW / 2,
      currentY,
      fotoW,
      fotoH
    );

    currentY += fotoH + 10;

   /* ---------- TABELA ---------- */
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

      styles: {
        fontSize: 10,
        cellPadding: 4,
        valign: "middle",
      },

      headStyles: {
        fillColor: [0, 0, 0],
        textColor: 255,
        fontStyle: "bold",
      },

      columnStyles: {
        0: {
          fillColor: [0, 0, 0], // COLUNA "Campo"
          textColor: 255,
          fontStyle: "bold",
          cellWidth: 55,
        },
        1: {
          cellWidth: "auto",
        },
      },
    });


    /* ---------- OBSERVAÇÕES ---------- */
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Observações", 13, finalY);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(dados.observacoes, 13, finalY + 6, {
      maxWidth: 180,
      lineHeightFactor: 1.3,
    });


    doc.save(`relatório-célula.pdf`);
  }

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmitRelatoryCell = async (data: RelatorioForm) => {
    if (!user) return;
    await gerarPdf(data);
  };

  /* =========================
     UI
  ========================= */

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

          <section className="max-w-6xl w-full px-10 md:mt-14">
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
                  <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>

                <Select nome="Oração Inicial"
                {...register("oracaoInicio", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>

                <Select nome="Oração Final"
                {...register("oracaoFinal", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>
              </div>

              <div className="w-full flex gap-10">

                <Select nome="Oração do lanche"
                {...register("oracaoLanche", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>

                <Select nome="Ministração"
                {...register("ministracao", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>

                <Input
                  nome="Quantos visitantes?"
                  type="number"
                  {...register("visitantes", { required: true })}
                />
              </div>

              <div className="w-full flex gap-10">
                <Input
                  nome="Quantos reconciliaram?"
                  type="number"
                  {...register("reconciliacao", { required: true })}
                />

                <Input
                  nome="Quantos aceitaram Jesus?"
                  type="number"
                  {...register("aceitouJesus", { required: true })}
                />

                <Select nome="Supervisor presente?"
                {...register("supervisorPresente", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={"Sim"} className="text-black">Sim</option>
                  <option value={"Não"} className="text-black">Não</option>
                </Select>
                
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
                  nome="Foto da célula"
                  type="file"
                  {...register("fotoCelula", { required: true })}
                />
              </div>

              <button
              className="w-25 p-4 bg-blue-400 text-white font-manrope font-bold rounded-lg" 
              type="submit">Registrar</button>

            </form>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
