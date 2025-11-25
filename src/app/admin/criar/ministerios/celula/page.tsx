"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import { formatFirstLetter } from "@/functions/formatFirstLetter";
import Perfil from "../../../../../../public/assets/perfil teste.avif";
import Image from "next/image";
import { Input } from "@/components/inputs";
import { useForm } from "react-hook-form";
import { Select } from "@/components/select";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type MinisterioCelulaForm = {
  nome: string;
  responsavel_id: string;
  rua: string;
  numero: string;
  bairro: string;
  dia_semana: string;
  horario: string;
  genero: string;
  idade: string;
};

interface UserSupabase {
    id: string;
    nome: string;
    cargo: string;
}



export default function CriarMinisterioCelula() {
  const { register, handleSubmit } = useForm<MinisterioCelulaForm>(); // hook também no topo
  const [ dataUsers, setDataUsers ] = useState<UserSupabase[]>([])


    // Requisição para buscar os líderes cadastrados
    async function requestLideres() {
      try {
        const { data: users, error } = await supabase
          .from("users")
          .select("*");

        if (error) throw error;

        if (users) {
          // Filtra somente cargos de liderança
          const lideres = users.filter((user) =>
            ["lider", "supervisor", "coordenador", "pastor"].includes(user.cargo)
          );

          // Busca as células com seus responsáveis
          const { data: celulas, error: celError } = await supabase
            .from("celulas")
            .select("responsavel_id");

          if (celError) throw celError;

          // Monta uma lista contendo IDs de líderes que já têm célula
          const idsComCelula = celulas?.map((c) => c.responsavel_id) || [];

          // Remove do array de líderes aqueles que já têm célula
          const lideresSemCelula = lideres.filter(
            (l) => !idsComCelula.includes(l.id)
          );
          
          setDataUsers(lideresSemCelula);
        }
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
      }
    }


    // Assim que acessa a página, efetua a requisição
    useEffect(()=> {
        requestLideres()
    }, [])



  const handleSubmitCelula = async (data: MinisterioCelulaForm) => {
        try {
                const formData = new FormData();
                formData.append("nome", data.nome);
                formData.append("responsavel_id", data.responsavel_id);
                formData.append("rua", data.rua);
                formData.append("numero", data.numero);
                formData.append("bairro", data.bairro);
                formData.append("dia_semana", data.dia_semana);
                formData.append("horario", data.horario);
                formData.append("genero", data.genero);
                formData.append("idade", data.idade);


                const res = await fetch("/api/ministerios/criar/celula", {
                method: "POST",
                body: formData,
                });

                const result = await res.json();

                if (!res.ok) throw new Error(result.error || "Erro ao cadastrar nova célula");

                toast.success("Nova célula criada com sucesso!");
        } catch (err) {
                toast.error("Erro ao criar nova célula!") 
                console.error(err);
                alert("Erro ao criar nova célula!");
        }
    };


  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-full w-full overflow-x-hidden xl:mx-auto px-6">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image
              className="w-12 rounded-full border border-white"
              src={Perfil}
              alt="Perfil"
            />
          </header>

          <section className="max-w-full w-full md:mt-14">
            <h1 className="font-bold text-4xl font-manrope">
              Criar Célula
            </h1>

            <form
              onSubmit={handleSubmit(handleSubmitCelula)}
              className="mt-10 flex flex-col gap-4"
            >
              <div className="w-full flex gap-10">
                <Input
                  nome="Nome da Célula"
                  type="text"
                  {...register("nome", { required: true })}
                />

                <Select nome="Líder da Célula" {...register("responsavel_id", { required: true })}>
                    <option value="" className="text-black font-semibold">Selecione</option>
                    {dataUsers.map((user) => (
                        <option key={user.id} value={user.id} className="text-black font-semibold">
                        {user.nome} - {formatFirstLetter(user.cargo)}
                        </option>
                    ))}
                </Select>

                <Select nome="Tipo da Célula"
                {...register("genero", { required: true })}>
                  <option value={""} className="text-black font-semibold">Selecione</option>
                  <option value={"masculino"} className="text-black font-semibold">Masculino</option>
                  <option value={"feminina"} className="text-black font-semibold">Feminina</option>
                  <option value={"kids"} className="text-black font-semibold">Kids</option>
                  <option value={"casal"} className="text-black font-semibold">Casal</option>
                  <option value={"mista"} className="text-black font-semibold">Mista</option>
                </Select>

              </div>


              <div className="w-full flex gap-10">
                
                <Input
                  nome="Rua"
                  type="text"
                  {...register("rua", { required: true })}
                />

                <Input
                  nome="Número"
                  type="text"
                  {...register("numero", { required: true })}
                />

                <Select nome="Bairro"
                {...register("bairro", { required: true })}>
                  <option value={""} className="text-black font-semibold">Selecione</option>
                  <option value="Barranco Alto" className="text-black font-semibold">Barranco Alto</option>
                  <option value="Benfica" className="text-black font-semibold">Benfica</option>
                  <option value="Cantagalo" className="text-black font-semibold">Cantagalo</option>
                  <option value="Capricórnio I" className="text-black font-semibold">Capricórnio I</option>
                  <option value="Capricórnio II" className="text-black font-semibold">Capricórnio II</option>
                  <option value="Capricórnio III" className="text-black font-semibold">Capricórnio III</option>
                  <option value="Caputera" className="text-black font-semibold">Caputera</option>
                  <option value="Canto do Mar" className="text-black font-semibold">Canto do Mar</option>
                  <option value="Centro" className="text-black font-semibold">Centro</option>
                  <option value="Cidade Jardim" className="text-black font-semibold">Cidade Jardim</option>
                  <option value="Estrela D' Alva" className="text-black font-semibold">Estrela D' Alva</option>
                  <option value="Getuba" className="text-black font-semibold">Getuba</option>
                  <option value="Golfinho" className="text-black font-semibold">Golfinho</option>
                  <option value="Indaiá" className="text-black font-semibold">Indaiá</option>
                  <option value="Ipiranga" className="text-black font-semibold">Ipiranga</option>
                  <option value="Jaraguá" className="text-black font-semibold">Jaraguá</option>
                  <option value="Jaraguazinho" className="text-black font-semibold">Jaraguazinho</option>
                  <option value="Jardim Aruan" className="text-black font-semibold">Jardim Aruan</option>
                  <option value="Jardim Britânia" className="text-black font-semibold">Jardim Britânia</option>
                  <option value="Jardim Califórnia" className="text-black font-semibold">Jardim Califórnia</option>
                  <option value="Jardim Casa Branca" className="text-black font-semibold">Jardim Casa Branca</option>
                  <option value="Jardim Flecheiras" className="text-black font-semibold">Jardim Flecheiras</option>
                  <option value="Jardim Gaivotas" className="text-black font-semibold">Jardim Gaivotas</option>
                  <option value="Jardim Jaqueira" className="text-black font-semibold">Jardim Jaqueira</option>
                  <option value="Jardim Mariella" className="text-black font-semibold">Jardim Mariella</option>
                  <option value="Jardim Olaria" className="text-black font-semibold">Jardim Olaria</option>
                  <option value="Jardim Primavera" className="text-black font-semibold">Jardim Primavera</option>
                  <option value="Jardim Rio Claro" className="text-black font-semibold">Jardim Rio Claro</option>
                  <option value="Jardim Rio Santos" className="text-black font-semibold">Jardim Rio Santos</option>
                  <option value="Jardim Tarumãs" className="text-black font-semibold">Jardim Tarumãs</option>
                  <option value="Jardim Terralão" className="text-black font-semibold">Jardim Terralão</option>
                  <option value="Martim de Sá" className="text-black font-semibold">Martim de Sá</option>
                  <option value="Massaguaçu" className="text-black font-semibold">Massaguaçu</option>
                  <option value="Morro do Algodão" className="text-black font-semibold">Morro do Algodão</option>
                  <option value="Nova Caraguá I" className="text-black font-semibold">Nova Caraguá I</option>
                  <option value="Nova Caraguá II" className="text-black font-semibold">Nova Caraguá II</option>
                  <option value="Pegorelli" className="text-black font-semibold">Pegorelli</option>
                  <option value="Perequê Mirim" className="text-black font-semibold">Perequê Mirim</option>
                  <option value="Poiares" className="text-black font-semibold">Poiares</option>
                  <option value="Pontal Santa Marina" className="text-black font-semibold">Pontal Santa Marina</option>
                  <option value="Porto Novo" className="text-black font-semibold">Porto Novo</option>
                  <option value="Praia da Cocanha" className="text-black font-semibold">Praia da Cocanha</option>
                  <option value="Praia da Mococa" className="text-black font-semibold">Praia da Mococa</option>
                  <option value="Praia das Palmeiras" className="text-black font-semibold">Praia das Palmeiras</option>
                  <option value="Prainha" className="text-black font-semibold">Prainha</option>
                  <option value="Rio do Ouro" className="text-black font-semibold">Rio do Ouro</option>
                  <option value="Sumaré" className="text-black font-semibold">Sumaré</option>
                  <option value="Tabatinga" className="text-black font-semibold">Tabatinga</option>
                  <option value="Tinga" className="text-black font-semibold">Tinga</option>
                  <option value="Travessão" className="text-black font-semibold">Travessão</option>
                  <option value="Vila Ponte Seca" className="text-black font-semibold">Vila Ponte Seca</option>
                </Select>
                
              </div>

              <div className="w-full flex gap-10">

                <Select nome="Dia da Semana"
                {...register("dia_semana", { required: true })}>
                  <option value={""} className="text-black font-semibold">Selecione</option>
                  <option value={"Segunda-feira"} className="text-black font-semibold">Segunda-feira</option>
                  <option value={"Terça-feira"} className="text-black font-semibold">Terça-feira</option>
                  <option value={"Quinta-feira"} className="text-black font-semibold">Quinta-feira</option>
                  <option value={"Sexta-feira"} className="text-black font-semibold">Sexta-feira</option>
                  <option value={"Sábado"} className="text-black font-semibold">Sábado</option>
                </Select>

                <Input
                  nome="Hora da Célula"
                  type="time"
                  {...register("horario", { required: true })}
                />

                <Select nome="Faixa Etária"
                {...register("idade", { required: true })}>
                  <option value={""} className="text-black font-semibold">Selecione</option>
                  <option value={"05-10"} className="text-black font-semibold">05 a 10 anos</option>
                  <option value={"11-17"} className="text-black font-semibold">11 a 17 anos</option>
                  <option value={"18-40"} className="text-black font-semibold">18 a 40 anos</option>
                  <option value={"40+"} className="text-black font-semibold">40+</option>
                </Select>
                
              </div>

              <button
              className="w-25 p-4 bg-blue-400 text-white font-manrope font-bold rounded-lg" 
              type="submit">Registrar</button>

            </form>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
