"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Perfil from "../../../../public/assets/perfil teste.avif";
import Image from "next/image";
import { Input } from "@/components/inputs";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Incell from "../../../../public/assets/file Incell.png";
import toast from "react-hot-toast";
import { ButtonAction } from "@/components/all/buttonAction";


type RelatorioForm = {
  lideres: string;
  dataGDL: string;
  horaInicio: string;
  horaFinal: string;
  observacoes: string;
  fotoGDL: FileList;
};

type SupervisaoType = {
  id: string;
  nome: string;
};

interface CelulaComLider {
  id: string;
  celula_nome: string;
  lider_nome: string;
  lider_id: string | null;
  lider_cargo: string | null;
}

interface Leaders {
  id: string;    
  nome: string;
  celula: string;
}


export default function RelatorioGDL() {
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm<RelatorioForm>();
  const [leadersArray, setLeadersArray] = useState<Leaders[]>([]); 
  const [celulasComLider, setCelulasComLider] = useState<CelulaComLider[]>([]);
  const [supervisao, setSupervisao] = useState<SupervisaoType | null>(null);






  const requestSupervisao = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("supervisoes")
      .select("id, nome")
      .limit(1);

    if (error || !data || data.length === 0) {
      console.error("Supervisão não encontrada");
      return;
    }

    setSupervisao(data[0]);
  }, [user?.id]);


// FUNÇÃO PARA BUSCAR TODOS OS LÍDERES DA SUPERVISÃO REFERENTE
const requestLideres = useCallback(async () => {
  if (!supervisao?.id) return;

  const { data, error } = await supabase
    .from("supervisao_lideres")
    .select(`
      id,
      lider:lider_id (
        id,
        nome,
        cargo
      ),
      supervisao:supervisao_id (
        id,
        nome
      )
    `)
    .eq("supervisao_id", supervisao.id);


  if (error) {
    console.error("Erro ao buscar líderes:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.warn("Nenhum líder encontrado para essa supervisão");
    setCelulasComLider([]);
    return;
  }

  const resultado: CelulaComLider[] = data
    .filter((item: any) => item.lider?.cargo?.toLowerCase() === "lider")
    .map((item: any) => ({
      id: item.id,
      celula_nome: "—", // ⚠️ não existe célula nesse modelo
      lider_nome: item.lider.nome,
      lider_id: item.lider.id,
      lider_cargo: item.lider.cargo,
    }));

  console.log("RESULTADO FORMATADO:", resultado);
  setCelulasComLider(resultado);
}, [supervisao?.id]);

useEffect(() => {
    if (!user?.id) return;
     requestSupervisao();
}, [user?.id, requestSupervisao]);

useEffect(() => {
  if (!supervisao?.id) return;
  requestLideres();
}, [supervisao?.id, requestLideres]);



// Adicionar / remover líderes SEM tocar no banco
  const toggleLeader = (leader: Leaders) => {
    const exists = leadersArray.some((l) => l.id === leader.id);

    if (exists) {
      setLeadersArray((prev) => prev.filter((l) => l.id !== leader.id));
    } else {
      setLeadersArray((prev) => [...prev, leader]);
    }
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
    let currentY = 10;

    const logoBase64 = await urlToBase64(Incell.src);
    doc.addImage(logoBase64, "PNG", 85, currentY, 40, 20);

    currentY += 30;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Relatório de GDL", 105, currentY, { align: "center" });

    currentY += 10;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`Supervisão: ${supervisao?.nome}`, 105, currentY, { align: "center" });

    currentY += 10;

    const fotoBase64 = await fileToBase64(dados.fotoGDL[0]);
    doc.addImage(fotoBase64, "JPEG", 25, currentY, 160, 80);

    currentY += 90;

    autoTable(doc, {
      startY: currentY,
      theme: "grid",
      head: [["Campo", "Informação"]],
      body: [
        ["Data", formatarDataBR(dados.dataGDL)],
        ["Horário", `${dados.horaInicio} - ${dados.horaFinal}`],
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

    const presentes = leadersArray.map(
        (l) => `• ${l.nome} (${l.celula})`
        );

        const ausentes = celulasComLider
        .filter((c) => !leadersArray.some((l) => l.id === c.lider_id))
        .map((c) => `• ${c.lider_nome}`);

        let y = finalY + 20;

        doc.setFont("Helvetica", "bold");
        doc.text("Líderes Presentes", 14, y);

        doc.setFont("Helvetica", "normal");
        doc.text(presentes.join("\n") || "Nenhum", 14, y + 6);

        y += presentes.length * 6 + 20;

        doc.setFont("Helvetica", "bold");
        doc.text("Líderes Ausentes", 14, y);

        doc.setFont("Helvetica", "normal");
        doc.text(ausentes.join("\n") || "Nenhum", 14, y + 6);



    doc.setFont("Helvetica", "bold");
    doc.text("Observações", 14, finalY);

    doc.setFont("Helvetica", "normal");
    doc.text(dados.observacoes, 14, finalY + 6, { maxWidth: 180 });

    return doc.output("datauristring");
  }


  const handleSubmitRelatoryCell = async (data: RelatorioForm) => {
    if (!user || !supervisao) {
      toast.error("Usuário ou supervisão inválidos");
      return;
    }

    try {
      toast.loading("Gerando relatório...");

      const pdfBase64 = await gerarPdf(data);
      const formData = new FormData();

      formData.append("responsavel", user.id);
      formData.append("tipo", "GDL");
      formData.append("conteudo", pdfBase64);
      formData.append("supervisao_id", supervisao.id);

      const res = await fetch("/api/relatorios/gdl", {
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
      setLeadersArray([]);
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
              Relatório de GDL
            </h1>

            <form
              onSubmit={handleSubmit(handleSubmitRelatoryCell)}
              className="mt-10 flex flex-col gap-4"
            >
              <div className="w-full flex gap-10">

                <Input
                  nome="Data do discipulado"
                  type="date"
                  {...register("dataGDL", { required: true })}
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
                  {...register("fotoGDL", { required: true })}
                />
              </div>

            {/* TABELA */}
            <div className="w-full mt-10 overflow-x-auto">
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
                    {celulasComLider.length > 0 ? (
                        celulasComLider
                        .filter(item => item.lider_cargo?.trim().toLowerCase() === "lider")
                        .map((item) => {
                            const isAdded = leadersArray.some(
                            (l) => l.id === item.lider_id
                            );

                            return (
                            <tr
                                key={item.id}
                                className="flex justify-between odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                            >
                                <td className="flex flex-col justify-center px-3 py-2 font-manrope font-light">
                                <span className="text-xl font-semibold">
                                    {item.lider_nome}
                                </span>
                                </td>

                                <td className="px-3 py-2 flex gap-6 justify-end">
                                <ButtonAction
                                    type="button"
                                    color={isAdded ? "bg-green-600" : "bg-red-600"}
                                    onClick={() =>
                                    toggleLeader({
                                        id: item.lider_id!,
                                        nome: item.lider_nome,
                                        celula: item.celula_nome,
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
                            Nenhum líder encontrado.
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
