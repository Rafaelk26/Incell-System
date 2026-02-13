import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const responsavel = formData.get("responsavel") as string;
    const tipo = formData.get("tipo") as string; // "GDL"
    const supervisao_id = formData.get("supervisao_id") as string;
    const conteudo = formData.get("conteudo") as string; // base64 do PDF

    if (!responsavel || !tipo || !supervisao_id || !conteudo) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes" },
        { status: 400 }
      );
    }

    /* ---------------------------
      CONVERTE BASE64 EM BUFFER
    ---------------------------- */
    const base64 = conteudo.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    /* ---------------------------
      PATH DO ARQUIVO NO BUCKET
    ---------------------------- */
    const filePath = `gdl/${supervisao_id}/relatorio-${Date.now()}.pdf`;

    /* ---------------------------
      UPLOAD NO STORAGE
    ---------------------------- */
    const { error: uploadError } = await supabase.storage
      .from("relatorios")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Erro upload:", uploadError);
      throw uploadError;
    }

    /* ---------------------------
      URL ASSINADA (TEMPORÁRIA)
    ---------------------------- */
     const EXPIRES_IN = 604800;

    const { data: signed, error: signedError } =
      await supabase.storage
        .from("relatorios")
        .createSignedUrl(filePath, EXPIRES_IN);

    if (signedError) {
      console.error("Erro signed URL:", signedError);
      throw signedError;
    }

    /* ---------------------------
      INSERT NA TABELA RELATORIOS
    ---------------------------- */
    const { data, error } = await supabase
      .from("relatorios")
      .insert({
        responsavel,
        tipo,
        supervisao_id,
        file_path: filePath,
        conteudo: {
          signed_url: signed.signedUrl,
          expires_in: EXPIRES_IN,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Erro insert:", error);
      throw error;
    }

    /* ---------------------------
      LIMPEZA AUTOMÁTICA (OPCIONAL)
    ---------------------------- */
    setTimeout(async () => {
      try {
        await supabase.storage
          .from("relatorios")
          .remove([filePath]);

        await supabase
          .from("relatorios")
          .delete()
          .eq("id", data.id);

        console.log("Relatório GDL expirado e removido:", filePath);
      } catch (err) {
        console.error("Erro ao remover relatório:", err);
      }
    }, EXPIRES_IN * 1000);

    return NextResponse.json(
      {
        message: "Relatório GDL criado com sucesso!",
        pdf_url: signed.signedUrl,
        relatorio: data,
      },
      { status: 201 }
    );

  } catch (err) {
    console.error("Erro geral:", err);
    return NextResponse.json(
      { error: "Erro ao criar relatório GDL" },
      { status: 500 }
    );
  }
}
