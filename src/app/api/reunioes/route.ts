import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/* =====================================================
   CONFIGURAÇÕES
===================================================== */

const cores: Record<string, string> = {
  DISCIPULADO: "#3b82f6",
  GDL: "#facc15",
  GDS: "#22c55e",
  GDC: "#a855f7",
  GD: "#ef4444",
};

type Discipulo = {
  nome: string;
  cargo: string;
};

/* =====================================================
   POST → LISTAR REUNIÕES (COM FILTRO POR ESCOPO)
===================================================== */
export async function POST(req: Request) {
  const { userId, cargo } = await req.json();

  /* 🔹 BUSCAR TODAS AS REUNIÕES + ESCOPO */
  const { data, error } = await supabase
    .from("reunioes")
    .select(`
      id,
      tipo,
      data,
      hora,
      criado_por,
      discipulado_com,
      discipulo:discipulado_com (
        nome,
        cargo
      ),
      reuniao_escopo (
        tipo_escopo,
        user_id,
        supervisao_id,
        coordenacao_id,
        pastoreio_id
      )
    `);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  /* =====================================================
     🔎 RESOLVER SUPERVISÃO DO LÍDER (ANTES DO FILTER)
  ===================================================== */
  let supervisaoDoLider: string | null = null;

  if (cargo === "lider") {
    const { data: supervisao } = await supabase
      .from("supervisao_lideres")
      .select("supervisao_id")
      .eq("lider_id", userId)
      .single();

    supervisaoDoLider = supervisao?.supervisao_id ?? null;
  }

  /* =====================================================
     🔎 FILTRO DE VISIBILIDADE
  ===================================================== */
  const eventosFiltrados = (data ?? []).filter((r: any) => {
    const escopo = r.reuniao_escopo?.[0];
    if (!escopo) return false;

    // 🔹 GD → todos veem
    if (r.tipo === "GD") return true;

    // 🔹 DISCIPULADO → somente quem criou
    if (r.tipo === "DISCIPULADO") {
      return r.criado_por === userId;
    }

    // 🔹 GDL → supervisor + líderes da mesma supervisão
    if (r.tipo === "GDL") {
      // Supervisor criador
      if (r.criado_por === userId) return true;

      // Líder da supervisão
      if (
        cargo === "lider" &&
        escopo.supervisao_id &&
        escopo.supervisao_id === supervisaoDoLider
      ) {
        return true;
      }

      return false;
    }

    // 🔹 GDS → coordenação / supervisão
    if (r.tipo === "GDS") {
      return (
        escopo.coordenacao_id !== null ||
        escopo.supervisao_id !== null
      );
    }

    // 🔹 GDC → pastoreio
    if (r.tipo === "GDC") {
      return escopo.pastoreio_id !== null;
    }

    return false;
  });

  /* =====================================================
     🎨 MAP PARA FULLCALENDAR
  ===================================================== */
  const eventos = eventosFiltrados.map((r: any) => {
    const discipulo: Discipulo | null =
      Array.isArray(r.discipulo) && r.discipulo.length > 0
        ? r.discipulo[0]
        : null;

    return {
      id: r.id,
      title: r.tipo,
      start: `${r.data}T${r.hora}`,
      editable: r.criado_por === userId || cargo === "pastor",
      backgroundColor: cores[r.tipo],
      borderColor: cores[r.tipo],
      extendedProps: {
        discipulado: discipulo
          ? `${discipulo.nome} — ${discipulo.cargo}`
          : null,
      },
    };
  });

  return NextResponse.json({ eventos });
}

/* =====================================================
   PUT → CRIAR REUNIÃO + ESCOPO
===================================================== */
export async function PUT(req: Request) {
  const { tipo, data, hora, discipulado_com, criado_por } =
    await req.json();

  if (!criado_por) {
    return NextResponse.json(
      { error: "Usuário não autenticado" },
      { status: 401 }
    );
  }

  /* 1️⃣ CRIAR REUNIÃO */
  const { data: reuniao, error: reuniaoError } = await supabase
    .from("reunioes")
    .insert({
      tipo,
      data,
      hora,
      criado_em: new Date(),
      discipulado_com: discipulado_com || null,
      criado_por,
    })
    .select("id")
    .single();

  if (reuniaoError || !reuniao) {
    return NextResponse.json({ error: reuniaoError }, { status: 500 });
  }

  /* 2️⃣ RESOLVER ESCOPO */
  const escopo: any = {
    reuniao_id: reuniao.id,
    tipo_escopo: tipo,
  };

  if (tipo === "DISCIPULADO") {
    escopo.user_id = criado_por;
  }

  if (tipo === "GDL") {
    const { data: supervisao } = await supabase
      .from("supervisoes")
      .select("id")
      .eq("supervisor_id", criado_por)
      .single();

    escopo.supervisao_id = supervisao?.id ?? null;
  }

  if (tipo === "GDS") {
    const { data: supervisao } = await supabase
      .from("supervisoes")
      .select("id")
      .eq("supervisor_id", criado_por)
      .single();

    if (supervisao) {
      const { data } = await supabase
        .from("coordenacao_supervisoes")
        .select("coordenacao_id")
        .eq("supervisao_id", supervisao.id)
        .single();

      escopo.coordenacao_id = data?.coordenacao_id ?? null;
    }
  }

  if (tipo === "GDC") {
    const { data: coord } = await supabase
      .from("coordenacoes")
      .select("id")
      .eq("coordenador_id", criado_por)
      .single();

    if (coord) {
      const { data } = await supabase
        .from("pastoria_coordenacoes")
        .select("pastoria_id")
        .eq("coordenacao_id", coord.id)
        .single();

      escopo.pastoreio_id = data?.pastoria_id ?? null;
    }
  }

  /* 3️⃣ INSERIR ESCOPO */
  const { error: escopoError } = await supabase
    .from("reuniao_escopo")
    .insert(escopo);

  if (escopoError) {
    await supabase.from("reunioes").delete().eq("id", reuniao.id);
    return NextResponse.json({ error: escopoError }, { status: 500 });
  }

  return NextResponse.json({ evento: reuniao });
}

/* =====================================================
   DELETE → EXCLUIR REUNIÃO + ESCOPO
===================================================== */
export async function DELETE(req: Request) {
  const { id } = await req.json();

  await supabase.from("reuniao_escopo").delete().eq("reuniao_id", id);
  await supabase.from("reunioes").delete().eq("id", id);

  return NextResponse.json({ success: true });
}
