import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST() {
  try {
    const hoje = new Date();

    /* ================= BUSCAR ÚLTIMO GD ================= */
    const { data: ultimoGD, error: gdError } = await supabaseServer
      .from("reunioes")
      .select("id, data")
      .eq("tipo", "GD")
      .lt("data", hoje.toISOString())
      .order("data", { ascending: false })
      .limit(1)
      .single();

    if (gdError || !ultimoGD) {
      return NextResponse.json(
        { message: "Nenhum GD anterior encontrado" },
        { status: 200 }
      );
    }

    const dataGD = new Date(ultimoGD.data);

    // Se ainda não passou, não limpa
    if (hoje <= dataGD) {
      return NextResponse.json(
        { message: "GD ainda não expirou" },
        { status: 200 }
      );
    }

    /* ================= LISTAR ARQUIVOS NO BUCKET ================= */
    const { data: files, error: listError } =
      await supabaseServer.storage
        .from("pagamentos")
        .list("gd");

    if (listError) throw listError;

    if (files && files.length > 0) {
      const paths = files.map(file => `gd/${file.name}`);

      const { error: removeError } =
        await supabaseServer.storage
          .from("pagamentos")
          .remove(paths);

      if (removeError) throw removeError;
    }

    /* ================= LIMPAR TABELA ================= */
    const { error: deleteError } = await supabaseServer
      .from("pagamentos")
      .delete()
      .neq("id", 0);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      message: "Ciclo de pagamentos limpo com sucesso",
      gd: ultimoGD.data,
    });

  } catch (err) {
    console.error("Erro ao limpar ciclo de pagamentos:", err);
    return NextResponse.json(
      { error: "Erro ao limpar pagamentos" },
      { status: 500 }
    );
  }
}
