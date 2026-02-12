import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    let { email } = await req.json();

    email = email?.toLowerCase().trim();


    if (!email) {
      return NextResponse.json(
        { success: false, message: "E-mail obrigatório" },
        { status: 400 }
      );
    }

    // 🔎 Busca usuário
    const { data: users } = await supabase
      .from("users")
      .select("id, nome, email")
      .eq("email", email)
      .limit(1);

    // ⚠️ Não revela se existe ou não
    if (!users || users.length === 0) {
      return NextResponse.json({ success: true });
    }

    const user = users[0];

    // 🔐 Gera token seguro
    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    // 💾 Salva token
    await supabase.from("password_resets").insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    });

    // 🔗 Link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/password/reset?token=${token}`;

    // 📧 Transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

  await transporter.sendMail({
    from: `"Incell" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Recuperação de senha",
    html: `
      <p>Olá, ${user.nome}</p>
      <p>Clique no botão abaixo para redefinir sua senha:</p>
      <a href="${resetLink}"
        style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
        Redefinir senha
      </a>
      <p>Este link expira em 30 minutos.</p>
    `,
  });


    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
