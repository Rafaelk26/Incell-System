import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  try {
    const isCron = req.headers.get("x-vercel-cron");

    if (!isCron) {
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("CRON EXECUTOU:", new Date().toISOString());

    // ⏰ Buscar relatórios expirados (1 dia)
    const { data: relatorios, error } = await supabase
      .from("relatorios")
      .select("id, file_path")
      .lte(
        "criado_em",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    if (!relatorios || relatorios.length === 0) {
      return NextResponse.json({ message: "Nenhum relatório expirado" });
    }

    // 🧹 Remover arquivos do storage
    const paths = relatorios.map((r) => r.file_path);

    const { error: storageError } = await supabase
      .storage
      .from("relatorios")
      .remove(paths);

    if (storageError) throw storageError;

    // 🗑️ Remover do banco
    const ids = relatorios.map((r) => r.id);

    const { error: deleteError } = await supabase
      .from("relatorios")
      .delete()
      .in("id", ids);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      message: "Relatórios removidos",
      removidos: ids.length,
    });

  } catch (err) {
    console.error("CRON erro:", err);
    return NextResponse.json(
      { error: "Erro ao limpar relatórios" },
      { status: 500 }
    );
  }
}