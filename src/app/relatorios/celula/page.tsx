"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Perfil from "../../../../public/assets/perfil teste.avif";
import Image from "next/image";
import { Input } from "@/components/inputs";
import { useForm } from "react-hook-form";
import { Select } from "@/components/select";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type RelatorioForm = {
  dataCelula: string;
  horaInicio: string;
  horaFinal: string;
  dinamica: string;
  oracaoInicio: string;
  oracaoFinal: string;
  oracaoLanche: string;
  ministracao: string;
  visitantes: string;
  reconciliacao: string;
  aceitouJesus: string;
  supervisorPresente: string;
  observacoes: string;
  fotoCelula: string;
};


type DiscipulosType = {
  id: string;
  nome: string;
  cargo: string;
  contato: string;
  dataNascimento: string;
  celula_id?: string;
};

export default function RelatorioCelula() {

  const { user } = useAuth();
  const { register, handleSubmit } = useForm<RelatorioForm>();
  const [discipulos, setDiscipulos] = useState<DiscipulosType[]>([]);

  const requestDiscipulos = useCallback(async () => {

    try {
      const cacheKey = `discipulos_all`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        setDiscipulos(JSON.parse(cachedData));
      }

      const { data, error } = await supabase.from("discipulos").select("*");

      if (error) throw error;

      if (data) {
        // salva em cache para respostas mais rápidas posteriormente
        localStorage.setItem(cacheKey, JSON.stringify(data));
        setDiscipulos(data);
      }
    } catch (err) {
      console.error("Erro ao resgatar os discípulos no banco.", err);
    }
  }, []);


  useEffect(() => {
    if (user) {
      requestDiscipulos();
    }
  }, [user, requestDiscipulos]);

  


  // FUNÇÃO PARA ENVIAR O PDF PARA O BACKEND
  const handleSubmitRelatoryCell = (data: RelatorioForm) => {
    console.log("Objeto final:", data);
    // aqui você pode mandar pro backend
  };

  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image
              className="w-12 rounded-full border border-white"
              src={Perfil}
              alt="Perfil"
            />
          </header>

          <section className="max-w-6xl w-full px-10 md:mt-14">
            <h1 className="font-bold text-4xl font-manrope">
              Relatório de Célula
            </h1>

            <form
              onSubmit={handleSubmit(handleSubmitRelatoryCell)}
              className="mt-10 flex flex-col gap-4"
            >
              <div className="w-full flex gap-10">
                <Input
                  nome="Data da célula"
                  type="date"
                  {...register("dataCelula", { required: true })}
                />

                <Input
                  nome="Hora inicial"
                  type="time"
                  {...register("horaInicio", { required: true })}
                />

                <Input
                  nome="Hora final"
                  type="time"
                  {...register("horaFinal", { required: true })}
                />
              </div>

              <div className="w-full flex gap-10">

                <Select nome="Dinâmica"
                {...register("dinamica", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>

                <Select nome="Oração Inicial"
                {...register("oracaoInicio", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>

                <Select nome="Oração Final"
                {...register("oracaoFinal", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>
              </div>

              <div className="w-full flex gap-10">

                <Select nome="Oração do lanche"
                {...register("oracaoLanche", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>

                <Select nome="Ministração"
                {...register("ministracao", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={user?.nome} className="text-black font-bold">{user?.nome} - {user?.cargo}</option>
                  {discipulos.map((d)=> (
                    <>
                      <option value={d.nome} className="text-black font-bold">{d.nome} - {d.cargo}</option>
                    </>
                  ))}
                </Select>

                <Input
                  nome="Quantos visitantes?"
                  type="number"
                  {...register("visitantes", { required: true })}
                />
              </div>

              <div className="w-full flex gap-10">
                <Input
                  nome="Quantos reconciliaram?"
                  type="number"
                  {...register("reconciliacao", { required: true })}
                />

                <Input
                  nome="Quantos aceitaram Jesus?"
                  type="number"
                  {...register("aceitouJesus", { required: true })}
                />

                <Select nome="Supervisor presente?"
                {...register("supervisorPresente", { required: true })}>
                  <option value={""} className="text-black">Selecione</option>
                  <option value={"Sim"} className="text-black">Sim</option>
                  <option value={"Não"} className="text-black">Não</option>
                </Select>
                
              </div>

              <div className="w-full flex items-stretch justify-between gap-8">

                <div className="w-full flex flex-col gap-2">
                  <label className="font-manrope text-lg">Observações</label>
                  <textarea
                  className="bg-[#514F4F]/40 p-4 rounded-lg border border-white
                  hover:border-blue-400 
                  focus:border-blue-500 focus:ring-blue-400 focus:outline-none"
                  {...register("observacoes", { required: true })}>
                  </textarea>
                </div>

                <Input
                  nome="Foto da célula"
                  type="file"
                  {...register("fotoCelula", { required: true })}
                />
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
