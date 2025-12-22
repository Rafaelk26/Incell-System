// app/admin/celulas/page.tsx
"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import { Input } from "@/components/inputs";
import { Select } from "@/components/select";
import Image from "next/image";
import Perfil from "../../../../public/assets/perfil teste.avif";
import Incell from "../../../../public/assets/file Incell.png";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { ButtonAction } from "@/components/all/buttonAction";
import { AiOutlineWhatsApp, AiFillFilePdf } from "react-icons/ai";
import { BiEdit, BiTrash } from "react-icons/bi";

// jsPDF + AutoTable
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import toast from "react-hot-toast";

interface CelulaProps {
  id: string;
  nome: string;
  genero: string;
  dia_semana: string;
  responsavel_id: string;
  horario: string;
  bairro: string;
  idade: string;
}

interface UsuarioProps {
  id: string;
  nome: string;
  cargo: string;
  telefone: string;
}

export default function AdminCelulas() {
  const [celulasS, setCelulasS] = useState<CelulaProps[]>([]);
  const [usuariosS, setUsuariosS] = useState<UsuarioProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarCelulas();
    buscarUsuarios();
  }, []);

  async function buscarCelulas() {
    const { data: celulas } = await supabase
      .from("celulas")
      .select("id, nome, genero, responsavel_id, dia_semana, horario, bairro, idade");

    if (celulas) setCelulasS(celulas);
    setLoading(false);
  }

  async function buscarUsuarios() {
    const { data: usuarios } = await supabase
      .from("users")
      .select("id, nome, cargo, telefone");

    if (usuarios) setUsuariosS(usuarios);
  }

  async function handleDeleteCell(idCell: string) {
    try{
      await supabase
      .from("celulas")
      .delete()
      .eq("id", idCell);
      
      buscarCelulas();
      toast.success("Célula deletada com sucesso!");

    }
    catch(error){
      toast.error("Erro ao deletar célula.");
      console.log("Erro ao deletar célula:", error);
  }
}

  async function gerarBase64(url: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }


  async function gerarPDF() { 
  const doc = new jsPDF();

  let currentY = 10;

  const dataAtual = new Date().toLocaleDateString("pt-BR");

  const imgGerada = await gerarBase64(Incell.src);

  // Carregar imagem para captar proporção correta
  const img = document.createElement("img");
  img.src = imgGerada;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  // TAMANHO MÁXIMO PERMITIDO NA PÁGINA
  const maxWidth = 25;  
  const maxHeight = 25;

  // CÁLCULO DO "CONTAIN"
  let imgWidth = maxWidth;
  let imgHeight = (img.height / img.width) * imgWidth;

  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
    imgWidth = (img.width / img.height) * imgHeight;
  }

  // CENTRALIZAÇÃO
  const centerX = (doc.internal.pageSize.getWidth() / 2) - (imgWidth / 2);

  // FOTO
  doc.addImage(imgGerada, "PNG", centerX, currentY, imgWidth, imgHeight);

  // MARGEM APÓS A IMAGEM
  currentY += imgHeight + 8;


  currentY += 10;

  // TÍTULO
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(24);
  doc.text(`Total de Células: ${celulasS.length}`, 105, currentY, { align: "center" });

  // MARGEM ENTRE TÍTULO E SUBTÍTULO
  currentY += 10;

  // SUBTÍTULO
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Gerado em: ${dataAtual}`, 105, currentY, { align: "center" });

  // MARGEM ANTES DA TABELA
  currentY += 15;

  // TABELA
  autoTable(doc, {
    startY: currentY,
    head: [["Célula", "Líder", "Tipo", "Bairro"]],
    body: celulasS.map((item) => {
      const lider = usuariosS.find(
        (u) => u.id === item.responsavel_id && u.cargo === "lider"
      );

      return [
        item.nome,
        lider ? lider.nome : "Sem líder",
        item.genero.charAt(0).toUpperCase() + item.genero.substring(1),
        item.bairro,
      ];
    }),
    styles: { fontSize: 11 },
    headStyles: {
      fillColor: "#050505",
      textColor: "#fff",
      halign: "left",
    },
  });

  doc.save("relatorio-celulas.pdf");
}



  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-full w-full overflow-x-hidden xl:mx-auto px-6">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image
              className="w-12 rounded-full border border-white"
              src={Perfil}
              alt="Perfil"
            />
          </header>

          <section className="max-w-full w-full md:mt-14 mb-10">
            {/* TÍTULO + PDF */}
            <div className="flex justify-between">
              <h1 className="font-bold text-4xl font-manrope">{celulasS.length} Células</h1>

              <ButtonAction
                type="button"
                color={"bg-blue-600 hover:bg-blue-800"}
                onClick={gerarPDF}
              >
                <div className="flex gap-2 items-center">
                  <AiFillFilePdf size={24} />
                  <span className="font-manrope text-xl">Gerar PDF</span>
                </div>
              </ButtonAction>
            </div>

            {/* FILTROS */}
            <div className="mt-6 flex gap-4 justify-between items-center">
              <span className="font-manrope text-xl">Filtrar</span>

              <Input placeholder="Nome do Líder (ou) Nome da Célula" />

              {/* Bairros */}

              <Select>
                <option value="" className="text-black font-semibold">Bairro</option>
                <option value="Barranco Alto" className="text-black font-semibold">Barranco Alto</option>
                <option value="Benfica" className="text-black font-semibold">Benfica</option>
                <option value="Cantagalo" className="text-black font-semibold">Cantagalo</option>
                <option value="Capricórnio I" className="text-black font-semibold">Capricórnio I</option>
                <option value="Capricórnio II" className="text-black font-semibold">Capricórnio II</option>
                <option value="Capricórnio III" className="text-black font-semibold">Capricórnio III</option>
                <option value="Caputera" className="text-black font-semibold">Caputera</option>
                <option value="Canto do Mar" className="text-black font-semibold">Canto do Mar</option>
                <option value="Centro" className="text-black font-semibold">Centro</option>
                <option value="Cidade Jardim" className="text-black font-semibold">Cidade Jardim</option>
                <option value="Estrela D' Alva" className="text-black font-semibold">Estrela D' Alva</option>
                <option value="Getuba" className="text-black font-semibold">Getuba</option>
                <option value="Golfinho" className="text-black font-semibold">Golfinho</option>
                <option value="Indaiá" className="text-black font-semibold">Indaiá</option>
                <option value="Ipiranga" className="text-black font-semibold">Ipiranga</option>
                <option value="Jaraguá" className="text-black font-semibold">Jaraguá</option>
                <option value="Jaraguazinho" className="text-black font-semibold">Jaraguazinho</option>
                <option value="Jardim Aruan" className="text-black font-semibold">Jardim Aruan</option>
                <option value="Jardim Britânia" className="text-black font-semibold">Jardim Britânia</option>
                <option value="Jardim Califórnia" className="text-black font-semibold">Jardim Califórnia</option>
                <option value="Jardim Casa Branca" className="text-black font-semibold">Jardim Casa Branca</option>
                <option value="Jardim Flecheiras" className="text-black font-semibold">Jardim Flecheiras</option>
                <option value="Jardim Gaivotas" className="text-black font-semibold">Jardim Gaivotas</option>
                <option value="Jardim Jaqueira" className="text-black font-semibold">Jardim Jaqueira</option>
                <option value="Jardim Mariella" className="text-black font-semibold">Jardim Mariella</option>
                <option value="Jardim Olaria" className="text-black font-semibold">Jardim Olaria</option>
                <option value="Jardim Primavera" className="text-black font-semibold">Jardim Primavera</option>
                <option value="Jardim Rio Claro" className="text-black font-semibold">Jardim Rio Claro</option>
                <option value="Jardim Rio Santos" className="text-black font-semibold">Jardim Rio Santos</option>
                <option value="Jardim Tarumãs" className="text-black font-semibold">Jardim Tarumãs</option>
                <option value="Jardim Terralão" className="text-black font-semibold">Jardim Terralão</option>
                <option value="Martim de Sá" className="text-black font-semibold">Martim de Sá</option>
                <option value="Massaguaçu" className="text-black font-semibold">Massaguaçu</option>
                <option value="Morro do Algodão" className="text-black font-semibold">Morro do Algodão</option>
                <option value="Nova Caraguá I" className="text-black font-semibold">Nova Caraguá I</option>
                <option value="Nova Caraguá II" className="text-black font-semibold">Nova Caraguá II</option>
                <option value="Pegorelli" className="text-black font-semibold">Pegorelli</option>
                <option value="Perequê Mirim" className="text-black font-semibold">Perequê Mirim</option>
                <option value="Poiares" className="text-black font-semibold">Poiares</option>
                <option value="Pontal Santa Marina" className="text-black font-semibold">Pontal Santa Marina</option>
                <option value="Porto Novo" className="text-black font-semibold">Porto Novo</option>
                <option value="Praia da Cocanha" className="text-black font-semibold">Praia da Cocanha</option>
                <option value="Praia da Mococa" className="text-black font-semibold">Praia da Mococa</option>
                <option value="Praia das Palmeiras" className="text-black font-semibold">Praia das Palmeiras</option>
                <option value="Prainha" className="text-black font-semibold">Prainha</option>
                <option value="Rio do Ouro" className="text-black font-semibold">Rio do Ouro</option>
                <option value="Sumaré" className="text-black font-semibold">Sumaré</option>
                <option value="Tabatinga" className="text-black font-semibold">Tabatinga</option>
                <option value="Tinga" className="text-black font-semibold">Tinga</option>
                <option value="Travessão" className="text-black font-semibold">Travessão</option>
                <option value="Vila Ponte Seca" className="text-black font-semibold">Vila Ponte Seca</option>
              </Select>

              {/* Tipo da Célula */}
              
              <Select>
                <option value="" className="font-bold text-black">Tipo da Célula</option>
                <option value="masculino" className="font-bold text-black">Masculino</option>
                <option value="feminina" className="font-bold text-black">Feminina</option>
                <option value="kids" className="font-bold text-black">Kids</option>
                <option value="adolescente" className="font-bold text-black">Adolescente</option>
                <option value="jovens" className="font-bold text-black">Jovens</option>
                <option value="casal" className="font-bold text-black">Casal</option>
                <option value="mista" className="font-bold text-black">Mista</option>
                <option value="par" className="font-bold text-black">Par</option>
              </Select>

              <ButtonAction type="button" color={"bg-blue-600"}>
                <span className="font-manrope text-md">Limpar</span>
              </ButtonAction>
            </div>

            {/* TABELA */}
            {loading ? (
              <p className="text-white mt-16 font-manrope">Carregando...</p>
            ) : (
              <div className="w-full mt-10 overflow-x-auto max-h-[20em] overflow-y-scroll">
                <table className="w-full border-collapse text-white">
                  <thead>
                    <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                      <th className="p-3 text-left rounded-tl-xl">Nome de Célula e Líder</th>
                      <th className="p-3 text-left">Tipo</th>
                      <th className="p-3 text-left">Bairro</th>
                      <th className="p-3 text-left rounded-tr-xl">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {celulasS.length > 0 ? (
                      celulasS.map((item) => {
                        const lider = usuariosS.find(
                          (u) => u.id === item.responsavel_id && u.cargo === "lider"
                        );

                        return (
                          <tr
                            key={item.id}
                            className="odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                          >
                            <td className="px-3 py-2 font-manrope">
                              <span className="text-xl font-semibold">{item.nome}</span>
                              <div className="text-gray-300">
                                {lider ? lider.nome : "Sem líder"}
                              </div>
                            </td>

                            <td className="px-3 py-2 font-manrope">
                              {item.genero.charAt(0).toUpperCase() + item.genero.substring(1)}
                            </td>

                            <td className="px-3 py-2 font-manrope">{item.bairro}</td>

                            <td className="px-3 py-3 flex gap-6 justify-end">
                              <Link href={`https://wa.me/55${lider?.telefone.slice(1).replace(/\D/g, "")}`} target="_blank">
                                <ButtonAction type="button" color={"bg-green-600"}>
                                  <div className="w-full flex gap-2">
                                    <AiOutlineWhatsApp size={24} />
                                    Whatsapp
                                  </div>
                                </ButtonAction>
                              </Link>
                              

                              <ButtonAction type="button" color={"bg-yellow-600"}>
                                <div className="w-full flex gap-2">
                                  <BiEdit size={24} />
                                  Editar
                                </div>
                              </ButtonAction>

                              <ButtonAction type="button" color={"bg-red-600"} onClick={() => handleDeleteCell(item.id)}>
                                <div className="w-full flex gap-2">
                                  <BiTrash size={24} />
                                  Deletar
                                </div>
                              </ButtonAction>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center p-6 text-white font-manrope font-semibold"
                        >
                          Nenhuma célula registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
