"use client";

import { Navbar } from "@/components/all/navBar";
import ProtectedLayout from "../middleware/protectedLayout";
import Image from "next/image";
import { useAuth } from "../context/useUser";
import { Input } from "@/components/inputs";
import { formatNumber } from "@/functions/formatNumber";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import fotoTeste from "../../../public/assets/file Incell.png";

/* ===================== TYPES ===================== */

type UsuariosForm = {
  nome: string;
  telefone: string;
  dataNascimento: string;
  email: string;
  foto: string | null;
};

/* ===================== COMPONENT ===================== */

export default function Perfil() {
  const { user, atualizarUsuario } = useAuth();

  const [perfil, setPerfil] = useState<UsuariosForm | null>(null);
  const [editando, setEditando] = useState(false);
  const [novaFoto, setNovaFoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  /* ===================== HELPERS ===================== */

  const fotoFallback = fotoTeste.src;

  function resolveFoto(src?: string | null) {
    if (src && src.trim() !== "") return src;
    return fotoFallback;
  }

  /* ===================== FETCH PERFIL ===================== */

  async function fetchPerfil() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("users")
      .select("id, nome, telefone, dataNascimento, email, foto")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Erro ao buscar perfil:", error);
      return;
    }

    setPerfil(data);
  }

  useEffect(() => {
    fetchPerfil();
  }, []);

  /* ===================== UPLOAD FOTO ===================== */

    async function uploadNovaFoto(): Promise<string | null> {
        if (!novaFoto || !user?.id) return perfil?.foto ?? null;

        try {
            /* ===================== BUSCA FOTO REAL NO BANCO ===================== */
            const { data: usuarioDb, error: fetchError } = await supabase
            .from("users")
            .select("foto")
            .eq("id", user.id)
            .single();

            if (fetchError) {
            console.error("Erro buscar foto atual:", fetchError);
            }

            /* ===================== REMOVE FOTO ANTIGA ===================== */
            if (usuarioDb?.foto) {
            const caminhoAntigo = usuarioDb.foto.split(
                "/storage/v1/object/public/users/"
            )[1];

            if (caminhoAntigo) {
                const { error: deleteError } = await supabase.storage
                .from("users")
                .remove([caminhoAntigo]);

                if (deleteError) {
                console.error("Erro ao remover foto antiga:", deleteError);
                } else {
                console.log("Foto antiga removida:", caminhoAntigo);
                }
            }
            }

            /* ===================== UPLOAD NOVA FOTO ===================== */
            const novoCaminho = `fotos/${user.id}/${Date.now()}-${novaFoto.name}`;

            const { data, error: uploadError } = await supabase.storage
            .from("users")
            .upload(novoCaminho, novaFoto, { upsert: true });

            if (uploadError) {
            console.error("Erro upload:", uploadError);
            return null;
            }

            /* ===================== URL PÚBLICA ===================== */
            const { data: publicUrlData } = supabase.storage
            .from("users")
            .getPublicUrl(data.path);

            return publicUrlData.publicUrl;
        } catch (error) {
            console.error("Erro inesperado upload:", error);
            return null;
        }
    }






  /* ===================== SALVAR ===================== */

  async function salvarAlteracoes() {
    if (!perfil || !user?.id) return;

    setLoading(true);

    const fotoUrl = await uploadNovaFoto();

    const { error } = await supabase
      .from("users")
      .update({
        nome: perfil.nome,
        telefone: perfil.telefone,
        dataNascimento: perfil.dataNascimento,
        email: perfil.email,
        foto: fotoUrl,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      console.error("Erro salvar:", error);
      return;
    }

    setPerfil((prev) =>
      prev ? { ...prev, foto: fotoUrl ?? prev.foto } : prev
    );

    atualizarUsuario({
      ...user,
      nome: perfil.nome,
      email: perfil.email,
      foto: fotoUrl ?? user.foto,
    });

    setEditando(false);
    setNovaFoto(null);
  }

  /* ===================== UI ===================== */

  if (!perfil) return null;

  return (
    <ProtectedLayout>
      <main className="max-w-full h-dvh flex md:h-screen">
        <Navbar />

        <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto px-4">
          <header className="w-full flex justify-end px-2 pt-6 md:px-10">
            <Image
              src={resolveFoto(perfil.foto)}
              width={12}
              height={12}
              alt="Perfil"
              className="w-12 h-12 rounded-full border border-white"
            />
          </header>

          <section className="max-w-full w-full mt-10 md:mt-4 mb-10">
            <h1 className="text-4xl font-bold font-manrope mb-6 text-center
            md:text-start">Meu perfil</h1>

            <div className="bg-gray-500/40 rounded-md p-6">
              <div className="flex gap-6 items-center flex-col
              md:flex-row">
                <Image
                  src={resolveFoto(perfil.foto)}
                  width={50}
                  height={50}
                  alt="Foto"
                  className="w-24 h-24 rounded-full border border-white object-cover"
                />

                <div className="text-center
                md:text-start">
                  <p className="text-3xl font-bold font-manrope">{user?.nome}</p>
                  <p className="text-xl capitalize font-manrope">{user?.cargo}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-6 
              md:grid-cols-3">
                <Input
                  type="text"
                  nome="Nome"
                  value={perfil.nome}
                  disabled={!editando}
                  onChange={(e) =>
                    setPerfil({ ...perfil, nome: e.target.value })
                  }
                />

                <Input
                  type="email"
                  nome="E-mail"
                  value={perfil.email}
                  disabled={!editando}
                  onChange={(e) =>
                    setPerfil({ ...perfil, email: e.target.value })
                  }
                />

                <Input
                  type="date"
                  nome="Nascimento"
                  value={perfil.dataNascimento}
                  disabled={!editando}
                  onChange={(e) =>
                    setPerfil({
                      ...perfil,
                      dataNascimento: e.target.value,
                    })
                  }
                />

                <Input
                  type="text"
                  nome="WhatsApp"
                  value={perfil.telefone}
                  disabled={!editando}
                  onChange={(e) =>
                    setPerfil({
                      ...perfil,
                      telefone: formatNumber(e.target.value),
                    })
                  }
                />

                {editando && (
                  <Input
                    type="file"
                    nome="Foto"
                    width={100}
                    height={100}
                    onChange={(e) =>
                      setNovaFoto(e.target.files?.[0] || null)
                    }
                  />
                )}
              </div>

              <div className="flex justify-end gap-4 mt-8">
                {!editando ? (
                  <button
                    onClick={() => setEditando(true)}
                    className="w-full bg-amber-500 px-6 py-2 rounded text-white font-bold
                    md:w-max"
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    onClick={salvarAlteracoes}
                    disabled={loading}
                    className="w-full bg-blue-600 px-6 py-2 rounded text-white font-bold
                    md:w-max"
                  >
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </button>
                )}
              </div>
            </div>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
