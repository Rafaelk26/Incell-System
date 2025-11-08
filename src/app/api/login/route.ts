// app/api/login/route.ts

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import bcrypt from "bcryptjs"

export async function POST(req: Request){
    
    // Tipando os users que voltam do banco
    type User = {
        id: string;
        nome: string;
        email: string
        foto: string;
        cargo: string;
    }
    
    try{
        const { user, senha } = await req.json();
        if(!user || !senha){
            return NextResponse.json({ sucess: false, message: "Preencha todos os campos!" }, { status: 400 });
        }

        // Fazendo a busca no banco
        const { data: usuarios, error } = await supabase
        .from("users")
        .select("id, nome, email, senha, foto, cargo")
        .or(`nome.eq.${user}, email.eq.${user}`)
        .limit(1)

        if(error) throw error;

        // Se não achar o usuário, retorna não encontrado
        if(!usuarios || usuarios.length === 0){
            return NextResponse.json({ sucess: false, message: "Usuário não encontrado!" }, { status: 400 });
        }

        // Se achar o usuário, retorna ele
        const usuario = usuarios[0]


        // Verifica a senha do usuário
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
        if(!senhaCorreta){
            return NextResponse.json({ sucess: false, message: "Senha incorreta!" }, { status: 401 });
        }

        // Retorna somente os dados corretos
        const dadosUsuario: User = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            foto: usuario.foto,
            cargo: usuario.cargo
        }
        
        // Se tudo der sucesso, exibe a mensagem e retorna o usuário
        return NextResponse.json({ sucess: true, message: "Login realizado com sucesso!", user: dadosUsuario });
    }
    catch(err){
        // Se tudo der errado no lado do servidor
        console.error("Erro no login:", err);
        return NextResponse.json({ success: false, message: "Erro interno no servidor." }, { status: 500 });
    }
}
