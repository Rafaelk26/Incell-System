// app/api/ministerios/criar/coordenacao/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nome = (formData.get("nome") as string) ?? "";
    const coordenador_id = (formData.get("coordenador_id") as string) ?? "";
    const genero = (formData.get("genero") as string) ?? "";
    const supersRaw = formData.get("supers") as string | null;
    const supers = supersRaw ? (JSON.parse(supersRaw) as Array<{ supervisao_id?: string; nome?: string; celula?: string }>) : [];

    // Validações básicas
    if (!nome.trim()) {
      return NextResponse.json({ error: "Nome da coordenação é obrigatório." }, { status: 400 });
    }
    if (!coordenador_id) {
      return NextResponse.json({ error: "Coordenador é obrigatório." }, { status: 400 });
    }
    if (!genero) {
      return NextResponse.json({ error: "Gênero é obrigatório." }, { status: 400 });
    }
    if (!Array.isArray(supers) || supers.length === 0) {
      return NextResponse.json({ error: "Escolha ao menos uma supervisão para vincular." }, { status: 400 });
    }

    // Extrai lista de supervisao_ids
    const supervisaoIds = supers
      .map((s) => s.supervisao_id?.toString?.()?.trim())
      .filter(Boolean) as string[];

    if (supervisaoIds.length === 0) {
      return NextResponse.json({ error: "Nenhuma supervisao_id válida enviada." }, { status: 400 });
    }

    // ❶ — Verificar se todas as supervisoes existem (evita violação de FK)
    const { data: existingSupervisoes, error: errCheck } = await supabase
      .from("supervisoes")
      .select("id")
      .in("id", supervisaoIds);

    if (errCheck) {
      console.error("Erro ao verificar supervisoes:", errCheck);
      return NextResponse.json({ error: "Erro ao validar supervisões." }, { status: 500 });
    }

    const existingIds = (existingSupervisoes || []).map((r: any) => r.id);

    // encontrar ids faltantes
    const missing = supervisaoIds.filter((id) => !existingIds.includes(id));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `As seguintes supervisões não existem: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // ❷ — Inserir a coordenação
    const { data: createdCoord, error: erroCoord } = await supabase
      .from("coordenacoes")
      .insert({
        nome,
        coordenador_id,
        genero,
      })
      .select()
      .single();

    if (erroCoord) {
      console.error("Erro ao criar coordenacao:", erroCoord);
      return NextResponse.json({ error: "Erro ao criar coordenação." }, { status: 500 });
    }

    const coordenacao_id = createdCoord.id;

    // ❸ — Montar registros para coordenacao_supervisoes usando supervisao_id ( já validados )
    const registros = supervisaoIds.map((supervisao_id) => ({
      coordenacao_id,
      supervisao_id,
    }));

    const { error: erroCoordenacao } = await supabase
      .from("coordenacao_supervisoes")
      .insert(registros);

    if (erroCoordenacao) {
      console.error("Erro ao inserir coordenacao_supervisoes:", erroCoordenacao);
      return NextResponse.json(
        { error: "Coordenação criada, mas falha ao vincular supervisões." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Coordenação criada com sucesso!", coordenacao_id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro interno:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
