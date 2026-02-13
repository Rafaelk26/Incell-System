import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const responsavel_id = formData.get("responsavel_id") as string;
    const file = formData.get("file") as File;

    if (!responsavel_id || !file) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes" },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${responsavel_id}-${Date.now()}.${fileExt}`;
    const filePath = `gd/${fileName}`;

    /* ================= UPLOAD NO BUCKET ================= */

    const { error: uploadError } = await supabaseServer.storage
      .from("pagamentos")
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    /* ================= INSERT NO BANCO ================= */

    const { data, error } = await supabaseServer
      .from("pagamentos")
      .insert({
        responsavel_id,
        file_path: filePath,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { message: "Pagamento enviado com sucesso", pagamento: data },
      { status: 201 }
    );

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao enviar pagamento" },
      { status: 500 }
    );
  }
}
