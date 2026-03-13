"use client";

export const dynamic = "force-dynamic";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../../../../context/useUser";
import { Navbar } from "@/components/all/navBar";
import { Input } from "@/components/inputs";
import { useForm } from "react-hook-form";
import { Select } from "@/components/select";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Incell from "../../../../../../public/assets/file Incell black.png";
import toast from "react-hot-toast";
import Image from "next/image";
import { FaTrash } from "react-icons/fa";


/* =========================
   TYPES
========================= */

type RelatorioForm = {
  dataCelula: string;
  horaInicio: string;
  horaFinal: string;
  dinamica: string;
  dinamicaOutro?: string;
  oracaoInicio: string;
  oracaoInicioOutro?: string;
  oracaoFinal: string;
  oracaoFinalOutro?: string;
  oracaoLanche: string;
  oracaoLancheOutro?: string;
  ministracao: string;
  ministracaoOutro?: string;
  visitantes: string;
  reconciliacao: string;
  aceitouJesus: string;
  supervisorPresente: string;
  coordenadorPresente: string;
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
  const { register, handleSubmit, reset, watch, setValue } = useForm<RelatorioForm>();
  const [discipulos, setDiscipulos] = useState<DiscipulosType[]>([]);
  const [celula, setCelula] = useState<CelulaType | null>(null);
  const params = useParams();
  const idLider = params.id;


  const oracaoInicio = watch("oracaoInicio");
  const oracaoFinal = watch("oracaoFinal");
  const oracaoLanche = watch("oracaoLanche");
  const ministracao = watch("ministracao");
  const dinamica = watch("dinamica");
  


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
      .eq("responsavel_id", idLider)
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
      .eq("responsavel_id", idLider)
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

    if (dados.fotoCelula[0].size > 5 * 1024 * 1024) {
      toast("Imagem grande detectada, otimizando automaticamente...");
    }


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
        ["Coordenador Presente", dados.coordenadorPresente],
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

      const ministeracaoFinal =
        data.ministracao === "outro"
          ? data.ministracaoOutro || ""
          : data.ministracao;

      const dinamicaFinal =
        data.dinamica === "outro"
          ? data.dinamicaOutro || ""
          : data.dinamica;

      const oracaoLancheFinal =
        data.oracaoLanche === "outro"
          ? data.oracaoLancheOutro || ""
          : data.oracaoLanche;

      const oracaoInicioFinal =
        data.oracaoInicio === "outro"
          ? data.oracaoInicioOutro || ""
          : data.oracaoInicio;

      const oracaoFinalFinal =
        data.oracaoFinal === "outro"
          ? data.oracaoFinalOutro || ""
          : data.oracaoFinal;

      const superiorPresenteFinal =
        user.cargo === "supervisor"
          ? "Sim"
          : "";

      const coordenadorPresenteFinal =
        user.cargo === "coordenador"
          ? "Sim"
          : "";

      const dadosCorrigidos: RelatorioForm = {
        ...data,
        supervisorPresente: superiorPresenteFinal,
        coordenadorPresente: coordenadorPresenteFinal,
        oracaoInicio: oracaoInicioFinal,
        oracaoFinal: oracaoFinalFinal,
        oracaoLanche: oracaoLancheFinal,
        ministracao: ministeracaoFinal,
        dinamica: dinamicaFinal,
      };

      const pdfBase64 = await gerarPdf(dadosCorrigidos);

      const formData = new FormData();
      formData.append("responsavel", user.id);
      formData.append("tipo", "CELULA");
      formData.append("conteudo", pdfBase64);
      formData.append("celula_id", celula.id);

      const res = await fetch("/api/relatorios/celula/supervisao", {
        method: "POST",
        body: formData,
      });

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
              Relatório de Supervisão de Célula
            </h1>

            {/* Nome da célula selecionada */}
            <span className="text-lg font-light text-center mt-1
            md:text-start">{celula?.nome || "Carregando..."}</span>

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
                {/* SELECT */}
                {dinamica !== "outro" && (
                  <Select
                    nome="Dinâmica"
                    {...register("dinamica", { required: true })}
                  >
                    <option value="" className="text-black font-bold">Selecione</option>
                    <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>

                    {discipulos.map((d) => (
                      <option
                        key={d.id}
                        value={d.nome}
                        className="text-black font-bold"
                      >
                        {d.nome} - {d.cargo}
                      </option>
                    ))}

                    <option value="outro" className="text-black font-bold">Outro</option>
                  </Select>
                )}

                {/* INPUT */}
                {dinamica === "outro" && (
                  <div className="w-full flex gap-2 justify-center items-center">
                    <Input
                      nome="Dinâmica"
                      type="text"
                      placeholder="Digite o nome"
                      {...register("dinamicaOutro", { required: true })}
                    />

                    <button
                      type="button"
                      onClick={() => setValue("dinamica", "")}
                      className="bg-red-600 p-2 rounded transition-all mt-10
                      hover:cursor-pointer hover:bg-red-500"
                    >
                      <FaTrash size={10} color="#fff" />
                    </button>
                  </div>
                )}


                {/* SELECT */}
                {ministracao !== "outro" && (
                  <Select
                    nome="Ministração"
                    {...register("ministracao", { required: true })}
                  >
                    <option value="" className="text-black font-bold">Selecione</option>
                    <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>

                    {discipulos.map((d) => (
                      <option
                        key={d.id}
                        value={d.nome}
                        className="text-black font-bold"
                      >
                        {d.nome} - {d.cargo}
                      </option>
                    ))}

                    <option value="outro" className="text-black font-bold">Outro</option>
                  </Select>
                )}

                {/* INPUT */}
                {ministracao === "outro" && (
                  <div className="w-full flex gap-2 justify-center items-center">
                    <Input
                      nome="Ministração"
                      type="text"
                      placeholder="Digite o nome"
                      {...register("ministracaoOutro", { required: true })}
                    />

                    <button
                      type="button"
                      onClick={() => setValue("ministracao", "")}
                      className="bg-red-600 p-2 rounded transition-all mt-10
                      hover:cursor-pointer hover:bg-red-500"
                    >
                      <FaTrash size={10} color="#fff" />
                    </button>
                  </div>
                )}

                {/* SELECT */}
                {oracaoInicio !== "outro" && (
                  <Select
                    nome="Oração Início"
                    {...register("oracaoInicio", { required: true })}
                  >
                    <option value="" className="text-black font-bold">Selecione</option>
                    <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>

                    {discipulos.map((d) => (
                      <option
                        key={d.id}
                        value={d.nome}
                        className="text-black font-bold"
                      >
                        {d.nome} - {d.cargo}
                      </option>
                    ))}

                    <option value="outro" className="text-black font-bold">Outro</option>
                  </Select>
                )}

                {/* INPUT */}
                {oracaoInicio === "outro" && (
                  <div className="w-full flex gap-2 justify-center items-center">
                    <Input
                      nome="Oração Início"
                      type="text"
                      placeholder="Digite o nome"
                      {...register("oracaoInicioOutro", { required: true })}
                    />

                    <button
                      type="button"
                      onClick={() => setValue("oracaoInicio", "")}
                      className="bg-red-600 p-2 rounded transition-all mt-10
                      hover:cursor-pointer hover:bg-red-500"
                    >
                      <FaTrash size={10} color="#fff" />
                    </button>
                  </div>
                )}
              </div>


              <div className="w-full flex flex-col gap-4
              md:flex-row md:gap-10">
                {/* SELECT */}
                {oracaoLanche !== "outro" && (
                  <Select
                    nome="Oração Lanche"
                    {...register("oracaoLanche", { required: true })}
                  >
                    <option value="" className="text-black font-bold">Selecione</option>
                    <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>

                    {discipulos.map((d) => (
                      <option
                        key={d.id}
                        value={d.nome}
                        className="text-black font-bold"
                      >
                        {d.nome} - {d.cargo}
                      </option>
                    ))}

                    <option value="outro" className="text-black font-bold">Outro</option>
                  </Select>
                )}

                {/* INPUT */}
                {oracaoLanche === "outro" && (
                  <div className="w-full flex gap-2 justify-center items-center">
                    <Input
                      nome="Oração Lanche"
                      type="text"
                      placeholder="Digite o nome"
                      {...register("oracaoLancheOutro", { required: true })}
                    />

                    <button
                      type="button"
                      onClick={() => setValue("oracaoLanche", "")}
                      className="bg-red-600 p-2 rounded transition-all mt-10
                      hover:cursor-pointer hover:bg-red-500"
                    >
                      <FaTrash size={10} color="#fff" />
                    </button>
                  </div>
                )}


                {/* SELECT */}
                {oracaoFinal !== "outro" && (
                  <Select
                    nome="Oração Final"
                    {...register("oracaoFinal", { required: true })}
                  >
                    <option value="" className="text-black font-bold">Selecione</option>
                    <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>

                    {discipulos.map((d) => (
                      <option
                        key={d.id}
                        value={d.nome}
                        className="text-black font-bold"
                      >
                        {d.nome} - {d.cargo}
                      </option>
                    ))}

                    <option value="outro" className="text-black font-bold">Outro</option>
                  </Select>
                )}

                {/* INPUT */}
                {oracaoFinal === "outro" && (
                  <div className="w-full flex gap-2 justify-center items-center">
                    <Input
                      nome="Oração Final"
                      type="text"
                      placeholder="Digite o nome"
                      {...register("oracaoFinalOutro", { required: true })}
                    />

                    <button
                      type="button"
                      onClick={() => setValue("oracaoFinal", "")}
                      className="bg-red-600 p-2 rounded transition-all mt-10
                      hover:cursor-pointer hover:bg-red-500"
                    >
                      <FaTrash size={10} color="#fff" />
                    </button>
                  </div>
                )}

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

                {user?.cargo === "supervisor" && (
                  <>
                    <Select nome="Supervisor Presente?"
                    disabled
                    {...register("supervisorPresente", { required: true })}>
                      <option value={"Sim"} className="text-black font-bold">Sim</option>
                    </Select>
                  </>
                )}

                {user?.cargo === "coordenador" && (
                  <>
                    <Select nome="Coordenador Presente?"
                    disabled
                    {...register("coordenadorPresente", { required: true })}>
                      <option value={"Sim"} className="text-black font-bold">Sim</option>
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
