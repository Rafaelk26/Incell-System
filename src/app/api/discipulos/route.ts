import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type Usuario = {
  id: string;
  nome: string;
  cargo: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const liderId = searchParams.get("liderId");
    const cargo = searchParams.get("cargo");

    if (!liderId || !cargo) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    const pessoas: Usuario[] = [];

    /* ======================================================
       1️⃣ DISCÍPULOS DA CÉLULA (SEMPRE) – TABELA DISCIPULOS
    ====================================================== */
    const { data: celula } = await supabaseServer
      .from("celulas")
      .select("id")
      .eq("responsavel_id", liderId)
      .single();

    if (celula) {
      const { data: discipulosCelula } = await supabaseServer
        .from("discipulos")
        .select("id, nome, cargo")
        .eq("celula_id", celula.id);

      if (discipulosCelula) {
        pessoas.push(...discipulosCelula);
      }
    }

    /* ======================================================
       2️⃣ SUPERVISOR → LÍDERES DA SUPERVISÃO
    ====================================================== */
    if (cargo === "supervisor") {
      const { data: supervisao } = await supabaseServer
        .from("supervisoes")
        .select("id")
        .eq("supervisor_id", liderId)
        .single();

      if (supervisao) {
        const { data: lideres } = await supabaseServer
          .from("supervisao_lideres")
          .select(`
            lider:users (
              id,
              nome,
              cargo
            )
          `)
          .eq("supervisao_id", supervisao.id);

        lideres?.forEach((l: any) => {
          if (l.lider) pessoas.push(l.lider);
        });
      }
    }

    /* ======================================================
   3️⃣ COORDENADOR → APENAS SUPERVISORES DA COORDENAÇÃO
    ====================================================== */
    if (cargo === "coordenador") {
      // 1️⃣ Buscar a coordenação do coordenador
      const { data: coordenacao } = await supabaseServer
        .from("coordenacoes")
        .select("id")
        .eq("coordenador_id", liderId)
        .single();

      if (coordenacao) {
        // 2️⃣ Buscar supervisões vinculadas à coordenação
        const { data: relacoes } = await supabaseServer
          .from("coordenacao_supervisoes")
          .select("supervisao_id")
          .eq("coordenacao_id", coordenacao.id);

        const supervisaoIds = relacoes?.map(r => r.supervisao_id) ?? [];

        if (supervisaoIds.length > 0) {
          // 3️⃣ Buscar os supervisores dessas supervisões
          const { data: supervisores } = await supabaseServer
            .from("supervisoes")
            .select(`
              supervisor:users (
                id,
                nome,
                cargo
              )
            `)
            .in("id", supervisaoIds);

          supervisores?.forEach((s: any) => {
            if (s.supervisor) pessoas.push(s.supervisor);
          });
        }
      }
    }


    /* ======================================================
       🔒 REMOVER DUPLICADOS
    ====================================================== */
    const unicos = Array.from(
      new Map(pessoas.map(p => [p.id, p])).values()
    );

    return NextResponse.json({ discipulos: unicos });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
