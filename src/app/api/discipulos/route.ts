import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const liderId = searchParams.get("liderId");

    if (!liderId) {
      return NextResponse.json(
        { error: "liderId é obrigatório" },
        { status: 400 }
      );
    }

    // 1️⃣ Buscar a célula do líder
    const { data: celula, error: celulaError } = await supabaseServer
      .from("celulas")
      .select("id")
      .eq("responsavel_id", liderId)
      .single();

    if (celulaError || !celula) {
      return NextResponse.json(
        { error: "Célula não encontrada para este líder" },
        { status: 404 }
      );
    }

    // 2️⃣ Buscar discípulos da célula
    const { data: discipulos, error: discipulosError } =
      await supabaseServer
        .from("discipulos")
        .select("id, nome, cargo")
        .eq("celula_id", celula.id)
        .order("nome", { ascending: true });

    if (discipulosError) {
      console.error(discipulosError);
      return NextResponse.json(
        { error: "Erro ao buscar discípulos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ discipulos });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
