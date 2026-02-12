import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const responsavel = formData.get("responsavel") as string;
    const tipo = formData.get("tipo") as string; // "GDS"
    const coordenacao_id = formData.get("coordenacao_id") as string;
    const conteudo = formData.get("conteudo") as string;

    if (!responsavel || !tipo || !coordenacao_id || !conteudo) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes" },
        { status: 400 }
      );
    }

    /* ================= PDF ================= */
    const base64 = conteudo.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    const filePath = `gds/${coordenacao_id}/relatorio-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("relatorios")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    /* ================= URL ASSINADA (24h) ================= */
    const EXPIRES_IN = 60;

    const { data: signed, error: signedError } =
      await supabase.storage
        .from("relatorios")
        .createSignedUrl(filePath, EXPIRES_IN);

    if (signedError) throw signedError;

    /* ================= REGISTRO NO BANCO ================= */
    const { data, error } = await supabase
      .from("relatorios")
      .insert({
        responsavel,
        tipo: "GDS",
        coordenacao_id,
        file_path: filePath,
        conteudo: {
          signed_url: signed.signedUrl,
          expires_in: EXPIRES_IN,
        },
      })
      .select()
      .single();

    if (error) throw error;

    /* ================= LIMPEZA AUTOMÁTICA (24h) ================= */
    setTimeout(async () => {
      try {
        await supabase.storage
          .from("relatorios")
          .remove([filePath]);

        await supabase
          .from("relatorios")
          .delete()
          .eq("id", data.id);

        console.log("Relatório GDS expirado e removido:", filePath);
      } catch (err) {
        console.error("Erro ao remover relatório GDS:", err);
      }
    }, EXPIRES_IN * 1000); // converte para ms

    return NextResponse.json(
      {
        message: "Relatório GDS criado com sucesso!",
        pdf_url: signed.signedUrl,
        relatorio: data,
      },
      { status: 201 }
    );

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao criar relatório GDS" },
      { status: 500 }
    );
  }
}