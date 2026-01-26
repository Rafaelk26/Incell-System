"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import { Input } from "@/components/inputs";
import { Select } from "@/components/select";
import Image from "next/image";
import Incell from "../../../../public/assets/file Incell black.png";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useMemo } from "react";
import { ButtonAction } from "@/components/all/buttonAction";
import {
  AiOutlineWhatsApp,
  AiFillFilePdf,
  AiFillCloseCircle,
} from "react-icons/ai";
import { BiEdit, BiPlus, BiTrash } from "react-icons/bi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import toast from "react-hot-toast";
import CountUp from "react-countup";
import { useAuth } from "@/app/context/useUser";

/* ================== TIPAGENS ================== */

interface Coordenacao {
  id: string;
  nome: string;
  genero: string;
  coordenador_id: string;
}

interface Usuario {
  id: string;
  nome: string;
  cargo: string;
  telefone: string;
}

interface Supervisao {
  id: string;
  nome: string;
}

/* ================== COMPONENTE ================== */

export default function AdminSupervisoes() {
  const { user } = useAuth();

  const [coordenacoes, setCoordenacoes] = useState<Coordenacao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [supervisoes, setSupervisoes] = useState<Supervisao[]>([]);
  const [todasSupervisoes, setTodasSupervisoes] = useState<Supervisao[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [coordenacaoSelecionada, setCoordenacaoSelecionada] =
    useState<Coordenacao | null>(null);

  /* ================== BUSCAS ================== */

  useEffect(() => {
    buscarCoordenacoes();
    buscarUsuarios();
    buscarTodasSupervisoes();
  }, []);

  async function buscarCoordenacoes() {
    const { data } = await supabase
      .from("coordenacoes")
      .select("id, nome, genero, coordenador_id");

    setCoordenacoes(data || []);
    setLoading(false);
  }

  async function buscarUsuarios() {
    const { data } = await supabase
      .from("users")
      .select("id, nome, cargo, telefone");

    if (data) setUsuarios(data);
  }

  async function buscarTodasSupervisoes() {
    const { data } = await supabase
      .from("supervisoes")
      .select("id, nome");

    setTodasSupervisoes(data || []);
  }

  async function buscarSupervisoesDaCoordenacao(coordenacaoId: string) {
    const { data, error } = await supabase
      .from("coordenacao_supervisoes")
      .select("supervisoes ( id, nome )")
      .eq("coordenacao_id", coordenacaoId);

    if (error) {
      toast.error("Erro ao buscar supervisões");
      return;
    }

    const formatado = data.map((item: any) => ({
      id: item.supervisoes.id,
      nome: item.supervisoes.nome,
    }));

    setSupervisoes(formatado);
  }

  /* ================== AÇÕES ================== */

  function handleEditCoordenacao(coordenacao: Coordenacao) {
    setCoordenacaoSelecionada(coordenacao);
    setModalOpen(true);
    buscarSupervisoesDaCoordenacao(coordenacao.id);
  }

  async function handleAddCoordenacao(supervisaoId: string) {
    if (!coordenacaoSelecionada) return;

    const { error } = await supabase
      .from("coordenacao_supervisoes")
      .insert({
        coordenacao_id: coordenacaoSelecionada.id,
        supervisao_id: supervisaoId,
      });

    if (error) {
      toast.error("Erro ao adicionar supervisão");
      return;
    }

    toast.success("Supervisão adicionada");
    buscarSupervisoesDaCoordenacao(coordenacaoSelecionada.id);
  }

  async function handleDeleteSupervisao(supervisaoId: string) {
    if (!coordenacaoSelecionada) return;

    await supabase
      .from("coordenacao_supervisoes")
      .delete()
      .eq("coordenacao_id", coordenacaoSelecionada.id)
      .eq("supervisao_id", supervisaoId);

    toast.success("Supervisão removida");
    buscarSupervisoesDaCoordenacao(coordenacaoSelecionada.id);
  }

  async function handleDeleteCoordenacao(id: string) {
    await supabase.from("coordenacoes").delete().eq("id", id);
    toast.success("Coordenação deletada");
    buscarCoordenacoes();
  }

  /* ================== FILTROS ================== */

  const normalize = (v: string) =>
    v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const dadosFiltrados = useMemo(() => {
    return coordenacoes.filter((item) => {
      const matchNome = normalize(item.nome).includes(normalize(search));
      const matchGenero = tipo ? item.genero === tipo : true;
      return matchNome && matchGenero;
    });
  }, [coordenacoes, search, tipo]);

  const supervisoesDisponiveis = useMemo(() => {
    return todasSupervisoes.filter(
      (s) => !supervisoes.some((sc) => sc.id === s.id)
    );
  }, [todasSupervisoes, supervisoes]);

  /* ================== PDF ================== */

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
      doc.text(`Total de Coordenações: ${coordenacoes.length}`, 105, currentY, { align: "center" });
    
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
        head: [["Coordenação", "Coordenador", "Tipo"]],
        body: coordenacoes.map((item) => {
          const coordenador = usuarios.find(
            (u) => u.id === item.coordenador_id && u.cargo === "coordenador",
          );
    
          return [
            item.nome,
            coordenador ? coordenador.nome : "Sem coordenador",
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

  /* ================== RENDER ================== */

  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-full w-full overflow-x-hidden xl:mx-auto px-6">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              src={user?.foto || ""}
              width={12}
              height={12}
              alt="Perfil"
            />
          </header>

          <section className="max-w-full w-full md:mt-14 mb-10">
            {/* TÍTULO + PDF */}
            <div className="flex justify-between">
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
            <div className="mt-6 flex gap-4 justify-between items-center">
              <span className="font-manrope text-xl">Filtrar</span>

              <Input 
              onChange={(e)=> setSearch(e.target.value)}
              placeholder="Nome do Coordenador (ou) Nome da Coordenação" />


              {/* Tipo da Coordenação */}
              
              <Select
              onChange={(e) => setTipo(e.target.value)}
              >
                <option value="" className="font-bold text-black">Tipo da Coordenação</option>
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
              <p className="text-white mt-16 font-manrope">Carregando...</p>
            ) : (
              <div className="w-full mt-10 overflow-x-auto max-h-[20em] overflow-y-scroll">
                <table className="w-full border-collapse text-white">
                  <thead>
                    <tr className="bg-zinc-950/90 text-white font-normal font-manrope">
                      <th className="p-3 text-left rounded-tl-xl">Nome de Coordenação e Coordenador</th>
                      <th className="p-3 text-left">Tipo</th>
                      <th className="p-3 text-left rounded-tr-xl">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {coordenacoes.length > 0 ? (
                      dadosFiltrados.map((item) => {
                        const coordenador = usuarios.find(
                          (u) => u.id === item.coordenador_id && u.cargo === "coordenador",
                        );

                        return (
                          <tr
                            key={item.id}
                            className="odd:bg-zinc-900/60 even:bg-zinc-800/10 border-b border-zinc-700"
                          >
                            <td className="px-3 py-2 font-manrope">
                              <span className="text-xl font-semibold">{item.nome}</span>
                              <div className="text-gray-300">
                                {coordenador ? coordenador.nome : "Sem coordenador"}
                              </div>
                            </td>

                            <td className="px-3 py-2 font-manrope">
                              {item.genero.charAt(0).toUpperCase() + item.genero.substring(1)}
                            </td>

                            <td className="px-3 py-3 flex gap-6 justify-end">
                              <Link href={`https://wa.me/55${coordenador?.telefone.slice(1).replace(/\D/g, "")}`} target="_blank">
                                <ButtonAction type="button" color={"bg-green-600"}>
                                  <div className="w-full flex gap-2">
                                    <AiOutlineWhatsApp size={24} />
                                    Whatsapp
                                  </div>
                                </ButtonAction>
                              </Link>
                              

                              <ButtonAction 
                              type="button" 
                              color={"bg-yellow-600"}
                              onClick={() => handleEditCoordenacao(item)}
                              >
                                <div className="w-full flex gap-2">
                                  <BiEdit size={24} />
                                  Editar
                                </div>
                              </ButtonAction>

                              <ButtonAction type="button" color={"bg-red-600"} onClick={() => handleDeleteCoordenacao(item.id)}>
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
                          Nenhuma coordenação registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}


            {/* MODAL DE EDIÇÃO DE COORDENAÇÃO (DELETAR OU ADD NOVOS LÍDERES)*/}

            {modalOpen && coordenacaoSelecionada && (
            <div className="fixed inset-0 bg-black/70 flex justify-center items-start pt-20 z-50">
              <div className="bg-black border border-white rounded-xl p-6 w-[500px] h-[500px] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h1 className="text-3xl font-bold font-manrope">Editar Coordenação</h1>
                    <h2 className="text-xl font-semibold font-manrope text-gray-300 mt-1">
                      {coordenacaoSelecionada.nome}
                    </h2>
                  </div>

                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-red-400 cursor-pointer hover:text-red-600"
                  >
                    <AiFillCloseCircle size={24} />
                  </button>
                </div>

                <h2 className="text-xl font-semibold font-manrope text-gray-400 mt-10">
                  Supervisões da Coordenação
                </h2>

                {/* LÍDERES QUE JÁ ESTÃO NA SUPERVISÃO */}
                <table className="w-full mt-2">
                  <tbody>
                    {supervisoes.length > 0 ? (
                      supervisoes.map((s) => (
                        <tr key={s.id}>
                          <td className="py-2 font-semibold font-manrope">{s.nome}</td>
                          <td className="py-2 text-right">
                            <ButtonAction
                            className="hover:bg-red-100"
                              color="bg-red-600"
                              onClick={() =>
                                handleDeleteSupervisao(s.id)
                              }
                            >
                              <BiTrash size={20}/>
                            </ButtonAction>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="text-center py-6">
                          Nenhum supervisor nesta coordenação
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>



              {/* SUPERVISÕES QUE PODEM SER ADICIONADOS NA COORDENAÇÃO */}
              <h2 className="text-xl font-semibold font-manrope text-gray-400 mt-10">Adicionar Supervisões</h2>

              <table className="w-full mt-2">
                  {supervisoesDisponiveis.length > 0 ? (
                    supervisoesDisponiveis.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2 font-semibold font-manrope">
                          {s.nome}
                        </td>
                        <td className="py-2 text-right">
                          <ButtonAction
                            type="button"
                            color={"bg-green-600"}
                            onClick={() => handleAddCoordenacao(s.id)}
                          >
                            <BiPlus size={24} />
                          </ButtonAction>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="text-center py-6 text-gray-400 font-manrope"
                      >
                        Nenhuma supervisão disponível para adicionar
                      </td>
                    </tr>
                  )}

              </table>
              </div>
            </div>
          )}
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
