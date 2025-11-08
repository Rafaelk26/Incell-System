// /app/api/ministerios/celula/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";


export async function POST(req: Request){
    try{
        const formData = await req.formData();
        const nome = formData.get("nome") as string;
        const responsavel_id = formData.get("responsavel_id") as string;
        const rua = formData.get("rua") as string;
        const numero = formData.get("numero") as string;
        const bairro = formData.get("bairro") as string;
        const horario = formData.get("horario") as string;
        const dia_semana = formData.get("dia_semana") as string;
        const genero = formData.get("genero") as string;
        const idade = formData.get("idade") as string;


        const { data: novaCelula, error: insertError} = await supabase
        .from("celulas")
        .insert([
            {
                nome,
                responsavel_id,
                rua,
                numero,
                bairro,
                horario,
                dia_semana,
                genero,
                idade
            },
        ])
        .select()

        if (insertError) throw insertError;

        return NextResponse.json({
            message: "Nova célula criada com sucesso no banco!",
            celula: novaCelula
        })

    }
    catch(err){
        console.error("Erro ao criar a nova célula no banco", err)
        return NextResponse.json({error: "Erro interno no servidor"}, { status: 500 })
    }
}