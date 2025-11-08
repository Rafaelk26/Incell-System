"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
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
                const lideres = users.filter((user) =>
                    ["lider", "supervisor", "coordenador", "pastor"].includes(user.cargo)
                );
                setDataUsers(lideres);
            }
        } 
        catch (err) {
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
                    <option value="">Selecione</option>
                    {dataUsers.map((user) => (
                        <option key={user.id} value={user.id} className="text-black">
                        {user.nome} - {user.cargo}
                        </option>
                    ))}
                </Select>

                <Select nome="Tipo da Célula"
                {...register("genero", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={"masculino"} className="text-black">Masculino</option>
                  <option value={"feminina"} className="text-black">Feminina</option>
                  <option value={"kids"} className="text-black">Kids</option>
                  <option value={"casal"} className="text-black">Casal</option>
                  <option value={"mista"} className="text-black">Mista</option>
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
                  <option value={""} className="text-black">Selecione</option>
                  <option value={"Benfica"} className="text-black">Benfica</option>
                </Select>
                
              </div>

              <div className="w-full flex gap-10">

                <Select nome="Dia da Semana"
                {...register("dia_semana", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={"Segunda-feira"} className="text-black">Segunda-feira</option>
                  <option value={"Terça-feira"} className="text-black">Terça-feira</option>
                  <option value={"Quinta-feira"} className="text-black">Quinta-feira</option>
                  <option value={"Sexta-feira"} className="text-black">Sexta-feira</option>
                  <option value={"Sábado"} className="text-black">Sábado</option>
                </Select>

                <Input
                  nome="Hora da Célula"
                  type="time"
                  {...register("horario", { required: true })}
                />

                <Select nome="Faixa Etária"
                {...register("idade", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={"04-09"} className="text-black">04 até 09 anos</option>
                  <option value={"10-17"} className="text-black">10 até 17 anos</option>
                  <option value={"18-25"} className="text-black">18 até 25 anos</option>
                  <option value={"26-35"} className="text-black">26 até 35 anos</option>
                  <option value={"36-45"} className="text-black">36 até 45 anos</option>
                  <option value={"46-52"} className="text-black">46 até 52 anos</option>
                  <option value={"53-59"} className="text-black">53 até 59 anos</option>
                  <option value={"60+"} className="text-black">60+ anos</option>
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
