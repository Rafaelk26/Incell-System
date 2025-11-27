import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nome = formData.get("nome") as string;
    const supervisor_id = formData.get("supervisor_id") as string;
    const genero = formData.get("genero") as string;
    const leaders = JSON.parse(formData.get("leaders") as string) as Array<{
      id: string;
      nome: string;
      celula: string;
    }>;


    // 1️⃣ INSERIR A SUPERVISÃO
    const { data: supervisao, error: erroSupervisao } = await supabase
      .from("supervisoes")
      .insert({
        nome,
        supervisor_id,
        genero,
      })
      .select()
      .single();

    if (erroSupervisao) {
      console.error(erroSupervisao);
      return NextResponse.json(
        { error: "Erro ao criar supervisão." },
        { status: 400 }
      );
    }

    const supervisao_id = supervisao.id;

    const registros = leaders.map((leader) => ({
      supervisao_id,
      lider_id: leader.id,
    }));

    const { error: erroLideres } = await supabase
      .from("supervisao_lideres")
      .insert(registros);

    if (erroLideres) {
      console.error(erroLideres);
      return NextResponse.json(
        { error: "Supervisão criada, mas erro ao registrar líderes." },
        { status: 500 }
      );
    }

    // 3️⃣ RETORNO FINAL
    return NextResponse.json(
      {
        message: "Supervisão criada com sucesso!",
        supervisao_id,
      },
      { status: 201 }
    );

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
