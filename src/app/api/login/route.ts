// app/api/login/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  type User = {
    id: string;
    nome: string;
    email: string;
    foto: string;
    cargo: string;
  };

  try {
    let { user, senha } = await req.json();

    if (!user || !senha) {
      return NextResponse.json(
        { success: false, message: "Preencha todos os campos!" },
        { status: 400 }
      );
    }

    // Normalização
    user = user.trim();

    const isEmail = user.includes("@");

    // 🔍 Busca no banco (case-insensitive)
    const query = supabase
      .from("users")
      .select("id, nome, email, senha, foto, cargo")
      .limit(1);

    const { data: usuarios, error } = isEmail
      ? await query.ilike("email", user)
      : await query.ilike("nome", user);

    if (error) {
      console.error("Erro Supabase:", error);
      throw error;
    }

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json(
        { success: false, message: "Usuário não encontrado!" },
        { status: 404 }
      );
    }

    const usuario = usuarios[0];

    // 🔐 Verifica senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return NextResponse.json(
        { success: false, message: "Senha incorreta!" },
        { status: 401 }
      );
    }

    // 🎯 Retorno seguro
    const dadosUsuario: User = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      foto: usuario.foto,
      cargo: usuario.cargo,
    };

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso!",
      user: dadosUsuario,
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
