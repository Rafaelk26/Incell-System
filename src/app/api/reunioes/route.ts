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

  /* BUSCAR TODAS AS REUNIÕES + ESCOPO */
  const { data, error } = await supabase
  .from("reunioes")
  .select(`
    id,
    tipo,
    data,
    hora,
    criado_por,
    discipulado_com,
    discipulado_com_lideres,
    discipulo:discipulado_com (
      nome,
      cargo
    ),
    lider:discipulado_com_lideres (
      nome,
      cargo
    ),
    reuniao_escopo (
      tipo_escopo,
      supervisao_id,
      coordenacao_id,
      pastoreio_id,
      user_id,
      supervisoes:supervisao_id ( nome )
    )
  `)



  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  /* =====================================================
     🔎 RESOLVER SUPERVISÃO DO LÍDER (ANTES DO FILTER)
  ===================================================== */
  let supervisaoDoLider: string | null = null;
  let supervisaoId: string | null = null;
  let coordenacaoId: string | null = null;
  let pastoreioId: string | null = null;

  if (cargo === "lider") {
    const { data: supervisao } = await supabase
      .from("supervisao_lideres")
      .select("supervisao_id")
      .eq("lider_id", userId)
      .single();

    supervisaoDoLider = supervisao?.supervisao_id ?? null;
  }

  // 🔹 Líder → supervisão
  if (cargo === "lider") {
    const { data } = await supabase
      .from("supervisao_lideres")
      .select("supervisao_id")
      .eq("lider_id", userId)
      .single();

    supervisaoId = data?.supervisao_id ?? null;
  }

  // 🔹 Supervisor → coordenação
  if (cargo === "supervisor") {
    const { data } = await supabase
      .from("supervisoes")
      .select("id")
      .eq("supervisor_id", userId)
      .single();

    supervisaoId = data?.id ?? null;

    if (supervisaoId) {
      const { data: c } = await supabase
        .from("coordenacao_supervisoes")
        .select("coordenacao_id")
        .eq("supervisao_id", supervisaoId)
        .single();

      coordenacaoId = c?.coordenacao_id ?? null;
    }
  }

  // 🔹 Coordenador → pastoreio
  if (cargo === "coordenador") {
    const { data } = await supabase
      .from("coordenacoes")
      .select("id")
      .eq("coordenador_id", userId)
      .single();

    coordenacaoId = data?.id ?? null;

    if (coordenacaoId) {
      const { data: p } = await supabase
        .from("pastoria_coordenacoes")
        .select("pastoria_id")
        .eq("coordenacao_id", coordenacaoId)
        .single();

      pastoreioId = p?.pastoria_id ?? null;
    }
  }


  /* =====================================================
     🔎 FILTRO DE VISIBILIDADE
  ===================================================== */
  const eventosFiltrados = (data ?? []).filter((r: any) => {
  const escopo = r.reuniao_escopo?.[0];
  if (!escopo) return false;

  // 🔹 GD → todos
  if (r.tipo === "GD") return true;

  // 🔹 DISCIPULADO
  if (r.tipo === "DISCIPULADO") {
    return (
      r.criado_por === userId ||
      r.discipulado_com === userId
    );
  }

  // 🔹 GDL
  if (r.tipo === "GDL") {
    if (cargo === "supervisor")
      return escopo.supervisao_id === supervisaoId;

    if (cargo === "lider")
      return escopo.supervisao_id === supervisaoId;

    return false;
  }

  // 🔹 GDS
  if (r.tipo === "GDS") {
    if (cargo === "coordenador")
      return escopo.coordenacao_id === coordenacaoId;

    if (cargo === "supervisor")
      return escopo.coordenacao_id === coordenacaoId;

    return false;
  }

  // 🔹 GDC
  if (r.tipo === "GDC") {
    if (cargo === "pastor") return true;

    if (cargo === "coordenador")
      return escopo.pastoreio_id === pastoreioId;

    return false;
  }

  return false;
});


  /* =====================================================
     🎨 MAP PARA FULLCALENDAR
  ===================================================== */
  const eventos = eventosFiltrados.map((r: any) => {
  const escopo = r.reuniao_escopo?.[0] ?? null;
  const discipulo = r.discipulos ?? null;
  let descricao: string | null = null;

  if (r.tipo === "DISCIPULADO") {
    descricao = r.discipulo?.nome || r.lider?.nome || null;
  }


    // 🔹 GDL → nome da supervisão
    if (r.tipo === "GDL" && escopo?.supervisoes?.nome) {
      descricao = escopo.supervisoes.nome;
    }

    return {
      id: r.id,
      title: r.tipo,
      start: `${r.data}T${r.hora}`,
      editable: r.criado_por === userId || cargo === "pastor",
      criado_por: r.criado_por,
      backgroundColor: cores[r.tipo],
      borderColor: cores[r.tipo],

      extendedProps: {
        tipo: r.tipo,
        descricao,
      },
    };
  });




  return NextResponse.json({ eventos });
}

/* =====================================================
   PUT → CRIAR REUNIÃO + ESCOPO
===================================================== */
  export async function PUT(req: Request) {
    const {
      tipo,
      data,
      hora,
      criado_por,
      discipulado_id,
      discipulado_tipo,
      cargo,
    } = await req.json();

    const payload: any = {
      tipo,
      data,
      hora,
      criado_em: new Date(),
      criado_por,
    };

    if (tipo === "DISCIPULADO") {
      if (!discipulado_id || !discipulado_tipo) {
        return NextResponse.json(
          { error: "Discipulado inválido" },
          { status: 400 }
        );
      }

      // 👤 DISCIPULANDO MEMBRO DA CÉLULA
      if (discipulado_tipo === "DISCIPULO") {
        payload.discipulado_com = discipulado_id;
        payload.discipulado_com_lideres = null;
      }

      // 👤 DISCIPULANDO LÍDER / SUPERVISOR / COORDENADOR
      if (discipulado_tipo === "LIDER") {
        if (cargo === "lider") {
          return NextResponse.json(
            { error: "Líder não pode discipular líderes" },
            { status: 403 }
          );
        }
        payload.discipulado_com_lideres = discipulado_id;
        payload.discipulado_com = null;
      }
    }


    const { data: reuniao, error: reuniaoError } = await supabase
      .from("reunioes")
      .insert(payload)
      .select("id")
      .single();

    if (reuniaoError) {
      return NextResponse.json({ error: reuniaoError }, { status: 500 });
    }

    // 🔹 ESCOPO
    const escopo: any = {
      reuniao_id: reuniao.id,
      tipo_escopo: tipo,
    };

    if (tipo === "DISCIPULADO") {
      escopo.user_id = criado_por;
    }

    if (tipo === "GDL") {
      const { data } = await supabase
        .from("supervisoes")
        .select("id")
        .eq("supervisor_id", criado_por)
        .single();
      escopo.supervisao_id = data?.id ?? null;
    }

    if (tipo === "GDS") {
      const { data } = await supabase
        .from("coordenacoes")
        .select("id")
        .eq("coordenador_id", criado_por)
        .single();
      escopo.coordenacao_id = data?.id ?? null;
    }

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
