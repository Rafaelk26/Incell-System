"use client";
import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import { Input } from "@/components/inputs";
import { useForm } from "react-hook-form";
import { Select } from "@/components/select";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Incell from "../../../../public/assets/file Incell black.png";
import toast from "react-hot-toast";

/* ==================== TIPOS ==================== */
type RelatorioForm = {
  discipulo: string;
  dataDiscipulado: string;
  horaInicio: string;
  horaFinal: string;
  observacoes: string;
  fotoDiscipulado: FileList;
};

type PessoaType = {
  id: string;
  nome: string;
  cargo: string;
};

type CelulaType = {
  id: string;
  nome: string;
};

export default function RelatorioDiscipulado() {
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm<RelatorioForm>();

  const [celula, setCelula] = useState<CelulaType | null>(null);
  const [supervisaoNome, setSupervisaoNome] = useState<string | null>(null);
  const [coordenacaoNome, setCoordenacaoNome] = useState<string | null>(null);
  const [opcoesSelect, setOpcoesSelect] = useState<PessoaType[]>([]);

  /* ==================== CÉLULA ==================== */
  const requestCelula = useCallback(async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from("celulas")
      .select("id, nome")
      .eq("responsavel_id", user.id)
      .single();

    if (data) setCelula(data);
  }, [user?.id]);

  /* ==================== DISCÍPULOS DA CÉLULA ==================== */
  const buscarDiscipulosCelula = async (celulaId: string) => {
    const { data } = await supabase
      .from("discipulos")
      .select("id, nome, cargo")
      .eq("celula_id", celulaId);

    return data ?? [];
  };

  /* ==================== REGRAS POR CARGO ==================== */
  const montarOpcoesSelect = useCallback(async () => {
    if (!user) return;

    let lista: PessoaType[] = [];

    // 1️⃣ Discípulos da célula (se existir)
    if (celula?.id) {
      const discipulos = await buscarDiscipulosCelula(celula.id);
      lista.push(...discipulos);
    }

    // 2️⃣ SUPERVISOR → líderes da supervisão
    if (user.cargo === "supervisor") {
      const { data: supervisao } = await supabase
        .from("supervisoes")
        .select("id")
        .eq("supervisor_id", user.id)
        .single();

      if (supervisao) {
        const { data: lideres } = await supabase
          .from("supervisao_lideres")
          .select(`
            lider:lider_id (
              id,
              nome,
              cargo
            )
          `)
          .eq("supervisao_id", supervisao.id);

        lideres?.forEach((l: any) => {
          if (l.lider) lista.push(l.lider);
        });
      }
    }

    // 3️⃣ COORDENADOR → supervisores da coordenação
    if (user.cargo === "coordenador") {
      const { data: coordenacao } = await supabase
        .from("coordenacoes")
        .select("id")
        .eq("coordenador_id", user.id)
        .single();

      if (coordenacao) {
        const { data: supervisores } = await supabase
          .from("coordenacao_supervisoes")
          .select(`
            supervisoes (
              supervisor:supervisor_id (
                id,
                nome,
                cargo
              )
            )
          `)
          .eq("coordenacao_id", coordenacao.id);

        supervisores?.forEach((s: any) => {
          if (s.supervisoes?.supervisor)
            lista.push(s.supervisoes.supervisor);
        });
      }
    }

    // 4️⃣ PASTOR → TODOS os coordenadores
    if (user.cargo === "pastor") {
      const { data: coordenadores } = await supabase
        .from("users")
        .select("id, nome, cargo")
        .eq("cargo", "coordenador");

      if (coordenadores) lista.push(...coordenadores);
    }

    // 🔒 Remove duplicados
    const unicos = Array.from(
      new Map(lista.map((p) => [p.id, p])).values()
    );

    setOpcoesSelect(unicos);
  }, [user, celula]);

  /* ==================== EFFECTS ==================== */
  useEffect(() => {
    requestCelula();
  }, [requestCelula]);

  useEffect(() => {
    montarOpcoesSelect();
  }, [montarOpcoesSelect]);

  /* ==================== PDF ==================== */
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


  function getTituloContextual() {
    if (user?.cargo === "pastor") return null;

    if (user?.cargo === "lider") {
      return celula?.nome ? `Célula: ${celula.nome}` : null;
    }

    if (user?.cargo === "supervisor") {
      return supervisaoNome ? `Supervisão: ${supervisaoNome}` : null;
    }

    if (user?.cargo === "coordenador") {
      return coordenacaoNome ? `Coordenação: ${coordenacaoNome}` : null;
    }

    return null;
  }


  async function gerarPdf(dados: RelatorioForm): Promise<string> {
    const doc = new jsPDF();
    let currentY = 10;

    const logoBase64 = await urlToBase64(Incell.src);
    doc.addImage(logoBase64, "PNG", 85, currentY, 40, 20);
    currentY += 30;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Relatório de Discipulado", 105, currentY, { align: "center" });
    currentY += 10;

    const tituloContextual = getTituloContextual();

    if (tituloContextual) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(14);
      doc.text(tituloContextual, 105, currentY, { align: "center" });
      currentY += 10;
    }

    const fotoBase64 = await fileToBase64(dados.fotoDiscipulado[0]);
    doc.addImage(fotoBase64, "JPEG", 25, currentY, 160, 80);
    currentY += 90;

    autoTable(doc, {
      startY: currentY,
      theme: "grid",
      head: [["Campo", "Informação"]],
      body: [
        ["Quem foi Discipulado", dados.discipulo],
        ["Data", formatarDataBR(dados.dataDiscipulado)],
        ["Horário", `${dados.horaInicio} - ${dados.horaFinal}`],
      ],
      headStyles: { fillColor: [0, 0, 0], textColor: 255 },
      columnStyles: {
        0: { fillColor: [0, 0, 0], textColor: 255, fontStyle: "bold" },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Observações", 14, finalY);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.text(dados.observacoes, 14, finalY + 6, { maxWidth: 180 });

    return doc.output("datauristring");
  }

  /* ==================== SUBMIT ==================== */
  const handleSubmitRelatoryCell = async (data: RelatorioForm) => {
    try {
      toast.loading("Gerando relatório...");
      const pdf = await gerarPdf(data);

      const formData = new FormData();
      formData.append("responsavel", user!.id);
      formData.append("tipo", "DISCIPULADO");
      formData.append("conteudo", pdf);
      if (celula?.id) formData.append("celula_id", celula.id);

      const res = await fetch("/api/relatorios/discipulado", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      toast.dismiss();
      toast.success("Relatório criado com sucesso!");
      reset();
    } catch {
      toast.dismiss();
      toast.error("Erro ao criar relatório");
    }
  };

  /* ==================== RENDER ==================== */
  return (
    <ProtectedLayout>
      <main className="h-screen flex">
        <Navbar />
        <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto">
          <header className="flex justify-end px-10 pt-6">
            <Image
              src={user?.foto || ""}
              alt="Perfil"
              width={50}
              height={50}
              className="rounded-full border w-12 h-12"
            />
          </header>

          <section className="max-w-6xl px-10 mt-4">
            <h1 className="text-4xl font-bold font-manrope">Relatório de Discipulado</h1>

            <form
              onSubmit={handleSubmit(handleSubmitRelatoryCell)}
              className="mt-10 flex flex-col gap-4"
            >
              <div className="flex gap-10">
                <Select
                  nome="Quem foi discipulado?"
                  {...register("discipulo", { required: true })}
                >
                  <option value="" className="text-black font-bold">Selecione</option>
                  {opcoesSelect.map((p) => (
                    <option key={p.id} value={p.nome} className="text-black font-bold">
                      {p.nome} - {p.cargo}
                    </option>
                  ))}
                </Select>

                <Input type="date" nome="Data" {...register("dataDiscipulado")} />
                <Input type="time" nome="Hora inicial" {...register("horaInicio")} />
                <Input type="time" nome="Hora final" {...register("horaFinal")} />
              </div>

              <label className="m-0 p-0 font-manrope text-lg">Observações:</label>
              <textarea
                className="bg-[#514F4F]/40 p-4 rounded-lg border"
                {...register("observacoes", { required: true })}
              />

              <Input
                nome="Foto"
                type="file"
                {...register("fotoDiscipulado", { required: true })}
              />

              <button className="bg-blue-600 p-3 rounded font-bold transition-all
              hover:bg-blue-500 hover:cursor-pointer">
                Registrar
              </button>
            </form>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}