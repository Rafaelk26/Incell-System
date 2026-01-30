"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import Perfil from "../../../../public/assets/perfil teste.avif";
import Image from "next/image";
import { Input } from "@/components/inputs";
import { useForm } from "react-hook-form";
import { Select } from "@/components/select";
import toast from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/context/useUser";
import { supabase } from "@/lib/supabaseClient";
import { formatNumber } from '@/functions/formatNumber'


type CelulaType = {
    id: string;
    nome: string;
    genero: string;
}

type DiscipulosForm = {
  nome: string;
  cargo: string;
  contato: string;
  dataNascimento: string;
};

export default function CriarDiscipulos() {
    const { user } = useAuth();
    const { register, handleSubmit, reset } = useForm<DiscipulosForm>();
    const [ celulas, setCelulas ] = useState<CelulaType[]>([]);
    const [ loading, setLoading ] = useState(true);

    const requestCelulas = useCallback(async () => {
        if (!user?.id) return;
    
        try {
          const cacheKey = `celulas_${user.id}`;
          const cachedData = localStorage.getItem(cacheKey);
    
          if (cachedData) {
            setCelulas(JSON.parse(cachedData));
            setLoading(false);
          }
    
          const { data, error } = await supabase
            .from("celulas")
            .select("*")
            .eq("responsavel_id", user.id);

    
          if (error) throw error;
    
          if (data && JSON.stringify(data) !== cachedData) {
            localStorage.setItem(cacheKey, JSON.stringify(data));
            setCelulas(data);
          }
        } catch (err) {
          console.error("Erro ao buscar dados:", err);
        } finally {
          setLoading(false);
        }
      }, [user?.id]);
    
      useEffect(() => {
          if(user) requestCelulas();
      }, [user, requestCelulas]);


  const handleSubmitDiscipulo = async (data: DiscipulosForm) => {
        try {
          const formData = new FormData();
          formData.append("celula_id", celulas[0].id)
          formData.append("nome", data.nome);
          formData.append("cargo", data.cargo.trim());
          formData.append("contato", data.contato);
          formData.append("dataNascimento", data.dataNascimento);

          toast.loading("Cadastrando...");

          const res = await fetch("/api/celula/criar", {
          method: "POST",
          body: formData,
          });

          const result = await res.json();


          if (!res.ok) throw new Error(result.error || "Erro ao cadastrar discípulo!");
          toast.dismiss();
          toast.success("Discípulo criado com sucesso!");

          reset();
        } catch (err) {
          console.error(err);
          toast.dismiss();
          toast.error("Erro ao criar discípulo!");
        }
    };

  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-full w-full overflow-x-hidden xl:mx-auto px-6">
          <header className="w-full flex justify-end pt-6">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              width={12}
              height={12}
              src={user?.foto || ""}
              alt="Perfil"
            />
          </header>

          <section className="max-w-full w-full md:mt-14">
            <h1 className="font-bold text-4xl font-manrope">
              Cadastrar Discípulo
            </h1>

            <form
              onSubmit={handleSubmit(handleSubmitDiscipulo)}
              className="mt-10 flex flex-col gap-4"
            >
              <div className="w-full flex gap-10">
                <Input
                  nome="Nome do discípulo"
                  placeholder="Ex: Matheus Santos"
                  type="text"
                  {...register("nome", { required: true })}
                />

                <Select nome="Cargo do discípulo"
                {...register("cargo", { required: true })}>
                  <option value={""} className="text-black font-semibold">Selecione</option>
                  <option value={"Anfitrião"} className="text-black font-semibold">Anfitrião</option>
                  <option value={"LT"} className="text-black font-semibold">LT</option>
                  <option value={"Discípulo"} className="text-black font-semibold">Discípulo</option>
                </Select>

                <Input
                  nome="WhatsApp do discípulo"
                  placeholder="Ex: (12) 91234-5678"
                  type="text"
                  {...register("contato", { required: true })}
                  onChange={(e)=> {
                    e.target.value = formatNumber(e.target.value)
                  }}
                />
              </div>

              <div className="w-full flex gap-10">

                <Input
                nome="Data de Nascimento do discípulo"
                type="date"
                {...register("dataNascimento", { required: true })}
                />
                
              </div>

              <button
              className="w-full p-4 mt-6 bg-blue-600 text-white font-manrope font-bold cursor-pointer rounded-lg 
              hover:bg-blue-500 hover:cursor-pointer transition-all" 
              type="submit">Cadastrar</button>

            </form>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
