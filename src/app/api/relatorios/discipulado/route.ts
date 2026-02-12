import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const responsavel = formData.get("responsavel") as string;
    const tipo = formData.get("tipo") as string; // DISCIPULADO
    const celula_id = formData.get("celula_id") as string | null;
    const pdfBase64 = formData.get("conteudo") as string;

    if (!responsavel || !tipo || !pdfBase64) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes" },
        { status: 400 }
      );
    }

    /* ================= PDF ================= */
    const base64 = pdfBase64.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    /* ================= PATH DINÂMICO ================= */
    const pasta = celula_id ? `celulas/${celula_id}` : `discipulados/${responsavel}`;
    const filePath = `${pasta}/relatorio-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("relatorios")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    /* ================= URL ASSINADA ================= */
    const EXPIRES_IN = 60;


    const { data: signed, error: signedError } =
      await supabase.storage
        .from("relatorios")
        .createSignedUrl(filePath, EXPIRES_IN);

    if (signedError) throw signedError;

    /* ================= INSERT NO BANCO ================= */
    const { data, error } = await supabase
      .from("relatorios")
      .insert({
        responsavel,
        tipo,
        celula_id: celula_id || null,
        file_path: filePath,
        conteudo: {
          signed_url: signed.signedUrl,
          expires_in: EXPIRES_IN,
        },
      })
      .select()
      .single();

    if (error) throw error;

    /* ================= LIMPEZA AUTOMÁTICA ================= */
    setTimeout(async () => {
      try {
        await supabase.storage
          .from("relatorios")
          .remove([filePath]);

        await supabase
          .from("relatorios")
          .delete()
          .eq("id", data.id);

        console.log("Relatório de discipulado expirado:", filePath);
      } catch (err) {
        console.error("Erro ao remover relatório:", err);
      }
    }, EXPIRES_IN * 1000);

    return NextResponse.json(
      {
        message: "Relatório de discipulado criado com sucesso!",
        pdf_url: signed.signedUrl,
        relatorio: data,
      },
      { status: 201 }
    );

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao criar relatório!" },
      { status: 500 }
    );
  }
}