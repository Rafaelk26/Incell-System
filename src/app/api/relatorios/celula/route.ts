import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const responsavel = formData.get("responsavel") as string;
    const tipo = formData.get("tipo") as string;
    const celula_id = formData.get("celula_id") as string;
    const pdfBase64 = formData.get("conteudo") as string;

    if (!responsavel || !tipo || !celula_id || !pdfBase64) {
      return NextResponse.json({ error: "Dados ausentes" }, { status: 400 });
    }

    /* =========================
       CONVERTE BASE64 → BUFFER
    ========================= */
    const base64 = pdfBase64.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    const filePath = `${celula_id}/relatorio-${Date.now()}.pdf`;

    /* =========================
       UPLOAD NO STORAGE
    ========================= */
    const { error: uploadError } = await supabase.storage
      .from("relatorios")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    /* =========================
       LINK TEMPORÁRIO (60s)
    ========================= */
    const { data: signed, error: signedError } =
      await supabase.storage
        .from("relatorios")
        .createSignedUrl(filePath, 60);

    if (signedError) throw signedError;

    /* =========================
       SALVA NO BANCO
    ========================= */
    const { data, error } = await supabase
      .from("relatorios")
      .insert({
        responsavel,
        tipo,
        celula_id,
        file_path: filePath,
        conteudo: {
          signed_url: signed.signedUrl,
          expires_in: 60,
        },
      })
      .select()
      .single();

    if (error) throw error;

    /* =========================
    DELETE AUTOMÁTICO (1 MIN)
    ========================= */
    setTimeout(async () => {
    try {
        // 1. Remove o arquivo do storage
        await supabase
        .storage
        .from("relatorios")
        .remove([filePath]);

        // 2. Remove a linha do banco
        await supabase
        .from("relatorios")
        .delete()
        .eq("id", data.id);

        console.log("Relatório expirado e removido com sucesso");
    } catch (err) {
        console.error("Erro ao remover relatório expirado:", err);
    }
    }, 60_000);


    return NextResponse.json(
      {
        message: "Relatório criado",
        pdf_url: signed.signedUrl,
        relatorio: data,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao criar relatório" },
      { status: 500 }
    );
  }
}
