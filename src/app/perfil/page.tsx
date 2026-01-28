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
      <main className="flex h-screen">
        <Navbar />

        <main className="max-w-[84rem] w-full mx-auto px-6">
          <header className="flex justify-end pt-6">
            <Image
              src={resolveFoto(perfil.foto)}
              width={12}
              height={12}
              alt="Perfil"
              className="rounded-full border h-12 w-12"
            />
          </header>

          <section className="mt-10">
            <h1 className="text-4xl font-bold font-manrope mb-6">Meu perfil</h1>

            <div className="bg-gray-500/40 rounded-md p-6">
              <div className="flex gap-6 items-center">
                <Image
                  src={resolveFoto(perfil.foto)}
                  width={50}
                  height={50}
                  alt="Foto"
                  className="w-24 h-24 rounded-full border object-cover"
                />

                <div>
                  <p className="text-3xl font-bold font-manrope">{user?.nome}</p>
                  <p className="text-xl capitalize font-manrope">{user?.cargo}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
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
                    className="bg-amber-500 px-6 py-2 rounded text-white font-bold"
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    onClick={salvarAlteracoes}
                    disabled={loading}
                    className="bg-blue-600 px-6 py-2 rounded text-white font-bold"
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
