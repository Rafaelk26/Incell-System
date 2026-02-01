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
import { AiOutlineWhatsApp, AiFillFilePdf } from "react-icons/ai";
import { BiEdit, BiPlus, BiTrash } from "react-icons/bi";
import { AiFillCloseCircle } from "react-icons/ai";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import toast from "react-hot-toast";
import CountUp from 'react-countup';
import { useAuth } from "@/app/context/useUser";

/* ================== TIPAGENS ================== */

interface SupervisorProps {
  id: string;
  nome: string;
  genero: string;
  supervisor_id: string;
}

interface UsuarioProps {
  id: string;
  nome: string;
  cargo: string;
  telefone: string;
}

interface LideresProps {
  id: string;
  nome: string;
}

/* ================== COMPONENTE ================== */

export default function AdminSupervisoes() {
  const { user } = useAuth();

  /* ================== ESTADOS ================== */
  const [supervisoes, setSupervisoes] = useState<SupervisorProps[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioProps[]>([]);
  const [lideres, setLideres] = useState<LideresProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [lideresEmSupervisao, setLideresEmSupervisao] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [supervisaoSelecionada, setSupervisaoSelecionada] =
    useState<SupervisorProps | null>(null);

  useEffect(() => {
    buscarSupervisoes();
    buscarUsuarios();
  }, []);

  /* ================== BUSCAS ================== */

  async function buscarSupervisoes() {
    const { data } = await supabase
      .from("supervisoes")
      .select("id, nome, genero, supervisor_id");

    if (data) setSupervisoes(data);
    setLoading(false);
  }

  async function buscarUsuarios() {
    const { data } = await supabase
      .from("users")
      .select("id, nome, cargo, telefone");

    if (data) setUsuarios(data);
  }

  async function buscarLideresDaSupervisao(supervisaoId: string) {
    const { data, error } = await supabase
      .from("supervisao_lideres")
      .select(
        `
        lider_id,
        users:lider_id (
          id,
          nome
        )
      `
      )
      .eq("supervisao_id", supervisaoId);

    if (error) {
      toast.error("Erro ao buscar líderes");
      return;
    }

    const formatado = data.map((item: any) => ({
      id: item.users.id,
      nome: item.users.nome,
    }));

    setLideres(formatado);
  }



  async function buscarLideresEmSupervisao() {
    const { data, error } = await supabase
      .from("supervisao_lideres")
      .select("lider_id");

    if (error) {
      toast.error("Erro ao buscar líderes vinculados");
      return;
    }

    const ids = data.map((item) => item.lider_id);
    setLideresEmSupervisao(ids);
  }


  /* ================== AÇÕES ================== */

  async function handleAddLeader(liderId: string) {
  if (!supervisaoSelecionada) return;

  const { error } = await supabase
    .from("supervisao_lideres")
    .insert({
      supervisao_id: supervisaoSelecionada.id,
      lider_id: liderId,
    });

  if (error) {
    toast.error("Erro ao adicionar líder");
    return;
  }

  toast.success("Líder adicionado à supervisão");

  buscarLideresDaSupervisao(supervisaoSelecionada.id);
  buscarLideresEmSupervisao();
}


  function handleEditSupervisao(supervisao: SupervisorProps) {
    setSupervisaoSelecionada(supervisao);
    setModalOpen(true);
    buscarLideresDaSupervisao(supervisao.id);
    buscarLideresEmSupervisao()
  }

  async function handleDeleteSupervision(id: string) {
    await supabase.from("supervisoes").delete().eq("id", id);
    toast.success("Supervisão deletada");
    buscarSupervisoes();
  }

  async function handleDeleteLeader(liderId: string) {
    if (!supervisaoSelecionada) return;

    await supabase
      .from("supervisao_lideres")
      .delete()
      .eq("lider_id", liderId)
      .eq("supervisao_id", supervisaoSelecionada.id);

    toast.success("Líder removido da supervisão");

    buscarLideresDaSupervisao(supervisaoSelecionada.id);
    buscarLideresEmSupervisao();
  }

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
    doc.text(`Total de Supervisões: ${supervisoes.length}`, 105, currentY, { align: "center" });
  
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
      head: [["Supervisão", "Supervisor", "Tipo"]],
      body: supervisoes.map((item) => {
        const supervisor = usuarios.find(
          (u) => u.id === item.supervisor_id && u.cargo === "supervisor",
        );
  
        return [
          item.nome,
          supervisor ? supervisor.nome : "Sem supervisor",
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
  
    doc.save("supervisoes.pdf");
  }

  /* ================== FILTROS ================== */
 
  const lideresDisponiveis = useMemo(() => {
    return usuarios.filter(
      (u) =>
        u.cargo === "lider" &&
        !lideresEmSupervisao.includes(u.id)
    );
  }, [usuarios, lideresEmSupervisao]);


  const normalize = (value: string) =>
  value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();


  const dadosFiltrados = useMemo(() => {
    let lista = [...(supervisoes || [])];

    // 🔎 Busca por nome do supervisor OU nome da supervisão
    if (search) {
      const s = normalize(search);
      lista = lista.filter(
        (item) =>
          normalize(item.nome).includes(s) ||
          normalize(item.supervisor_id).includes(s)
      );
    }

    // 🧩 Tipo da supervisão
    if (tipo) {
      lista = lista.filter(
        (item) => normalize(item.genero) === normalize(tipo)
      );
    }

    return lista;
  }, [supervisoes, search, tipo]);



  /* ================== RENDER ================== */


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
              <h1 className="font-bold text-4xl font-manrope"><CountUp duration={3.5} end={supervisoes.length} /> Supervisões</h1>

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
              placeholder="Nome do Supervisor (ou) Nome da Supervisão" />


              {/* Tipo da Supervisão */}
              
              <Select
              onChange={(e) => setTipo(e.target.value)}
              >
                <option value="" className="font-bold text-black">Tipo da Supervisão</option>
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
              <p className="text-center text-white mt-16 font-manrope">Carregando...</p>
            ) : (
              <div className="w-full mt-10 overflow-x-auto max-h-[20em] overflow-y-scroll">
                <table className="min-w-[900px] border-collapse text-white 
                md:w-full">
                  <thead className="w-full">
                    <tr className="w-full bg-zinc-950/90 text-white font-normal font-manrope">
                      <th className="p-3 text-left rounded-tl-xl">Nome de Supervisão e Supervisor</th>
                      <th className="p-3 text-left">Tipo</th>
                      <th className="p-3 text-left rounded-tr-xl">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {supervisoes.length > 0 ? (
                      dadosFiltrados.map((item) => {
                        const supervisor = usuarios.find(
                          (u) => u.id === item.supervisor_id && u.cargo === "supervisor"
                        );

                        return (
                          <tr
                            key={item.id}
                            className="odd:bg-zinc-900/60 even:bg-zinc-800/10 hover:bg-zinc-800 transition-colors border-b border-zinc-700"
                          >
                            <td className="px-3 py-2 font-manrope">
                              <span className="text-xl font-semibold">{item.nome}</span>
                              <div className="text-gray-300">
                                {supervisor ? supervisor.nome : "Sem supervisor"}
                              </div>
                            </td>

                            <td className="px-3 py-2 font-manrope">
                              {item.genero.charAt(0).toUpperCase() + item.genero.substring(1)}
                            </td>

                            <td className="px-3 py-3 flex gap-6 justify-end">
                              <Link href={`https://wa.me/55${supervisor?.telefone.slice(1).replace(/\D/g, "")}`} target="_blank">
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
                              onClick={() => handleEditSupervisao(item)}
                              >
                                <div className="w-full flex gap-2">
                                  <BiEdit size={24} />
                                  Editar
                                </div>
                              </ButtonAction>

                              <ButtonAction type="button" color={"bg-red-600"} onClick={() => handleDeleteSupervision(item.id)}>
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
                          Nenhuma supervisão registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}


            {/* MODAL DE EDIÇÃO DE SUPERVISÃO (DELETAR OU ADD NOVOS LÍDERES)*/}

            {modalOpen && supervisaoSelecionada && (
            <div className="fixed inset-0 bg-black/70 flex justify-center items-start pt-20 z-50">
              <div className="bg-black border border-white rounded-xl p-6 w-[500px] h-[500px] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h1 className="text-3xl font-bold font-manrope">Editar Supervisão</h1>
                    <h2 className="text-xl font-semibold font-manrope text-gray-300 mt-1">
                      {supervisaoSelecionada.nome}
                    </h2>
                  </div>

                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-red-400 cursor-pointer hover:text-red-600"
                  >
                    <AiFillCloseCircle size={24} />
                  </button>
                </div>

                {/* LÍDERES QUE JÁ ESTÃO NA SUPERVISÃO */}
                <table className="w-full mt-6">
                  <tbody>
                    {lideres.length > 0 ? (
                      lideres.map((lider) => (
                        <tr key={lider.id}>
                          <td className="py-2 font-semibold font-manrope">{lider.nome}</td>
                          <td className="py-2 text-right">
                            <ButtonAction
                            className="hover:bg-red-100"
                              color="bg-red-600"
                              onClick={() =>
                                handleDeleteLeader(lider.id)
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
                          Nenhum líder nesta supervisão
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>



              {/* LÍDERES QUE PODEM SER ADICIONADOS NA SUPERVISÃO */}
              <h2 className="text-2xl font-semibold font-manrope text-gray-300 mt-8">Adicionar Líderes</h2>

              <table className="w-full mt-4">
                  {lideresDisponiveis.length > 0 ? (
                    lideresDisponiveis.map((usuario) => (
                      <tr key={usuario.id}>
                        <td className="py-2 font-semibold font-manrope">
                          {usuario.nome}
                        </td>
                        <td className="py-2 text-right">
                          <ButtonAction
                            type="button"
                            color={"bg-green-600"}
                            onClick={() => handleAddLeader(usuario.id)}
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
                        Nenhum líder disponível para adicionar
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
