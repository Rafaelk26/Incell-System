import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos" },
        { status: 400 }
      );
    }

    // 🔎 Busca token
    const { data: resets } = await supabase
      .from("password_resets")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    if (!resets || resets.length === 0) {
      return NextResponse.json(
        { success: false, message: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    const reset = resets[0];

    // 🔐 Criptografa senha
    const senhaHash = await bcrypt.hash(password, 10);

    // 🔄 Atualiza senha
    await supabase
      .from("users")
      .update({ senha: senhaHash })
      .eq("id", reset.user_id);

    // 🧹 Remove token
    await supabase
      .from("password_resets")
      .delete()
      .eq("id", reset.id);

    return NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Erro interno" },
      { status: 500 }
    );
  }
}
