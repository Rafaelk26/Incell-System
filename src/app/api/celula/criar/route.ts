import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";


export async function POST(req: Request){
    try{
        const formData = await req.formData();
        const nome = formData.get("nome") as string;
        const cargo = formData.get("cargo") as string;
        const contato = formData.get("contato") as string;
        const dataNascimento = formData.get("dataNascimento") as string;
        const celula_id = formData.get("celula_id") as string;

        const { data: discipulos, error: insertError } = await supabase
        .from("discipulos")
        .insert([
            {
                nome,
                cargo,
                contato,
                dataNascimento,
                celula_id
            }
        ]).select();

        if(insertError) throw insertError

        return NextResponse.json({
            message: "Novo discípulo cadastrado com sucesso!",
            discipulo: discipulos
        })
    }
    catch(error){
        console.error("Erro ao cadastrar discípulo no servidor", error);
        return NextResponse.json({error: "Erro ao cadastrar discípulo no servidor"}, { status: 500 })
    }
}