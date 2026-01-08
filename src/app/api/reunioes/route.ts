import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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

export async function POST(req: Request) {
  const { userId, cargo } = await req.json();

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
      )
    `);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const eventos = (data ?? []).map((r: any) => {
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

export async function PUT(req: Request) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("reunioes")
    .insert(body)
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
      )
    `)
    .single();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ evento: data });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

  const { error } = await supabase
    .from("reunioes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
