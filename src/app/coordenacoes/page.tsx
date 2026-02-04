"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import { Input } from "@/components/inputs";
import { Select } from "@/components/select";
import Image from "next/image";
import Incell from "../../../public/assets/file Incell black.png";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import { ButtonAction } from "@/components/all/buttonAction";
import { AiOutlineWhatsApp, AiFillFilePdf } from "react-icons/ai";

// jsPDF + AutoTable
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import { useAuth } from "@/app/context/useUser";
import CountUp from 'react-countup';
import { FaRegEye } from "react-icons/fa";
import { ordenarPorTexto } from "@/functions/formatAZ";

interface CoordenacaoProps {
  id: string;
  nome: string;
  genero: string;
  coordenador_id: string;
}

interface UsuarioProps {
  id: string;
  nome: string;
  cargo: string;
  telefone: string;
}

export default function Coordenacoes() {
  const { user } = useAuth()
  const [coordenacoes, setCoordenacoes] = useState<CoordenacaoProps[]>([]);
  const [usuariosS, setUsuariosS] = useState<UsuarioProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");


  useEffect(() => {
    buscarCoordenacoes();
    buscarUsuarios();
  }, []);

  async function buscarCoordenacoes() {
    const { data: coordenacoes } = await supabase
      .from("coordenacoes")
      .select("id, nome, genero, coordenador_id");

    if (coordenacoes) setCoordenacoes(coordenacoes);
    setLoading(false);
  }

  async function buscarUsuarios() {
    const { data: usuarios } = await supabase
      .from("users")
      .select("id, nome, cargo, telefone");

    if (usuarios) setUsuariosS(usuarios);
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
  doc.text(`Total de Coordenacoes: ${coordenacoes.length}`, 105, currentY, { align: "center" });

  // MARGEM ENTRE TÍTULO E SUBTÍTULO
  currentY += 10;

  // SUBTÍTULO
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Gerado em: ${dataAtual}`, 105, currentY, { align: "center" });

  // MARGEM ANTES DA TABELA
  currentY += 15;

  // ORDENAR COORDENAÇÕES PELO NOME
  const celulasOrdenadas = [...coordenacoes].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );

  // TABELA
  autoTable(doc, {
    startY: currentY,
    head: [["Coordenação", "Coordenador", "Tipo"]],
    body: celulasOrdenadas.map((item) => {
      const lider = usuariosS.find(
        (u) => u.id === item.coordenador_id && u.cargo === "coordenador"
      );

      return [
        item.nome,
        lider ? lider.nome : "Sem coordenador",
        item.genero.charAt(0).toUpperCase() + item.genero.substring(1),
      ];
    }),
    styles: { fontSize: 11 },
    headStyles: {
      fillColor: "#050505",
      textColor: "#fff",
      halign: "left",
    },
  });

  doc.save("coordenacoes.pdf");
}

const normalize = (value: string) =>
  value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();


  const dadosFiltrados = useMemo(() => {
    let lista = [...(coordenacoes || [])];

    // 🔎 Busca por nome do líder OU nome da coordenação
    if (search) {
      const s = normalize(search);
      lista = lista.filter(
        (item) =>
          normalize(item.nome).includes(s) ||
          normalize(item.coordenador_id).includes(s)
      );
    }

    // 🧩 Tipo da coordenação
    if (tipo) {
      lista = lista.filter(
        (item) => normalize(item.genero) === normalize(tipo)
      );
    }

    return ordenarPorTexto(lista, "nome");
  }, [coordenacoes, search, tipo]);




  return (
    <ProtectedLayout>
      <main className="max-w-full h-dvh flex md:h-screen">
        <Navbar />
        <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto px-4">
          <header className="w-full flex justify-end px-2 pt-6 md:px-10">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              src={user?.foto || ""}
              width={12}
              height={12}
              alt="Perfil"
            />
          </header>

          <section className="max-w-full w-full mt-10 md:mt-14 mb-10">
            {/* TÍTULO + PDF */}
            <div className="flex justify-between flex-col items-center gap-4
            md:flex-row md:gap-0">
              <h1 className="font-bold text-4xl font-manrope"><CountUp duration={3.5} end={coordenacoes.length} /> Coordenações</h1>

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
            <div className="w-96 flex flex-col gap-4 justify-between items-center mx-auto mt-10
            md:flex-row md:w-full md:mx-0 md:mt-6">
              <span className="font-manrope text-xl">Filtrar</span>

              <Input 
              onChange={(e)=> setSearch(e.target.value)}
              placeholder="Nome da Coordenação" />


              {/* Tipo da Célula */}
              
              <Select onChange={(e)=> setTipo(e.target.value)}>
                <option value="" className="font-bold text-black">Tipo da Célula</option>
                <option value="masculina" className="font-bold text-black">Masculino</option>
                <option value="feminina" className="font-bold text-black">Feminina</option>
              </Select>

              <ButtonAction 
              type="button" 
              color={"bg-blue-600"}
              onClick={() => {
              setSearch("");
              setTipo("");
              }}>
                <span className="font-manrope text-md">Limpar</span>
              </ButtonAction>
            </div>

            {/* TABELA */}
            {loading ? (
              <p className="text-center text-white mt-16 font-manrope md:text-start">Carregando...</p>
            ) : (
              <div className="w-full mt-10 overflow-x-auto max-h-[20em] overflow-y-scroll">
                <table className="min-w-[800px] border-collapse text-white 
                md:w-full">
                  <thead>
                    <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                      <th className="p-3 text-left rounded-tl-xl">Nome de Coordenação</th>
                      <th className="p-3 text-left">Tipo</th>
                      <th className="p-3 text-left rounded-tr-xl">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {coordenacoes.length > 0 ? (
                      dadosFiltrados.map((item) => {
                        const lider = usuariosS.find(
                          (u) => u.id === item.coordenador_id
                        );

                        return (
                          <tr
                            key={item.id}
                            className="odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                          >
                            <td className="px-3 py-2 font-manrope">
                              <span className="text-xl font-semibold">{item.nome}</span>
                              <div className="text-gray-300">
                                {lider ? lider.nome : "Sem supervisor"}
                              </div>
                            </td>

                            <td className="px-3 py-2 font-manrope">
                              {item.genero.charAt(0).toUpperCase() + item.genero.substring(1)}
                            </td>

                            <td className="px-3 py-3 flex gap-6 justify-end">
                              <Link href={`https://wa.me/55${lider?.telefone.slice(1).replace(/\D/g, "")}`} target="_blank">
                                <ButtonAction type="button" color={"bg-green-600"}>
                                  <div className="w-full flex gap-2">
                                    <AiOutlineWhatsApp size={24} />
                                    Whatsapp
                                  </div>
                                </ButtonAction>
                              </Link>
                            </td>

                            <td className="px-3 py-2 font-manrope font-light text-center">
                                <Link
                                  href={`/pastoreio/coordenacao/${item.id}`}
                                >
                                  <ButtonAction type="button" color={"transparent"}>
                                    <div className="flex gap-2 items-center">
                                      <FaRegEye size={24} color="#fff" />
                                    </div>
                                  </ButtonAction>
                                </Link>
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
                          Nenhuma coordenação registrada.
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
