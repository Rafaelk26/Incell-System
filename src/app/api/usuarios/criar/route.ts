// /app/api/usuarios/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const nome = formData.get("nome") as string;
    const cargo = formData.get("cargo") as string;
    const telefone = formData.get("telefone") as string;
    const dataNascimento = formData.get("dataNascimento") as string;
    const email = formData.get("email") as string;
    const senha = formData.get("senha") as string;
    const foto = formData.get("foto") as File;

    if (!email || !senha) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // 1️⃣ Upload da imagem no bucket
    let fotoUrl = null;
    if (foto) {
      const { data, error: uploadError } = await supabase.storage
        .from("users")
        .upload(`fotos/${Date.now()}-${foto.name}`, foto);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("users")
        .getPublicUrl(data.path);

      fotoUrl = publicUrlData.publicUrl;
    }

    // 2️⃣ Inserção do usuário
    const { data: novoUsuario, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          nome,
          cargo: cargo.trim(),
          telefone,
          dataNascimento: dataNascimento,
          email,
          senha: senhaHash,
          foto: fotoUrl,
        },
      ])
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      usuario: novoUsuario,
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
