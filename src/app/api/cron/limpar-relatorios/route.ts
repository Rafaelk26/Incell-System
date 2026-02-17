import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  try {
    // 🔐 Proteção básica (opcional mas recomendado)
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ⏰ Relatórios expirados (1 dia)
    const { data: relatorios, error } = await supabase
      .from("relatorios")
      .select("id, file_path")
      .lte("criado_em", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!relatorios || relatorios.length === 0) {
      return NextResponse.json({ message: "Nenhum relatório expirado" });
    }

    // 🧹 Remover arquivos do bucket
    const paths = relatorios.map(r => r.file_path);

    const { error: storageError } = await supabase
      .storage
      .from("relatorios")
      .remove(paths);

    if (storageError) throw storageError;

    // 🗑️ Remover registros do banco
    const ids = relatorios.map(r => r.id);

    const { error: deleteError } = await supabase
      .from("relatorios")
      .delete()
      .in("id", ids);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      message: "Relatórios expirados removidos",
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
