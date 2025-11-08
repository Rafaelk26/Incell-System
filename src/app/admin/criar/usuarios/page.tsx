"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import Perfil from "../../../../../public/assets/perfil teste.avif";
import Image from "next/image";
import { Input } from "@/components/inputs";
import { useForm } from "react-hook-form";
import { formatNumber } from "@/functions/formatNumber";
import { Select } from "@/components/select";
import toast from "react-hot-toast";

type UsuariosForm = {
  nome: string;
  cargo: string;
  telefone: string;
  dataNascimento: string;
  email: string;
  senha: string;
  foto: FileList;
};

export default function CriarUsuarios() {
  const { register, handleSubmit } = useForm<UsuariosForm>(); // hook também no topo

  const handleSubmitUser = async (data: UsuariosForm) => {
        try {
                const formData = new FormData();
                formData.append("nome", data.nome);
                formData.append("cargo", data.cargo.trim());
                formData.append("telefone", data.telefone);
                formData.append("dataNascimento", data.dataNascimento);
                formData.append("email", data.email);
                formData.append("senha", data.senha);
                formData.append("foto", data.foto[0]);

                const res = await fetch("/api/usuarios/criar", {
                method: "POST",
                body: formData,
                });

                const result = await res.json();

                if (!res.ok) throw new Error(result.error || "Erro ao cadastrar usuário");

                toast.success("Usuário criado com sucesso!");
        } catch (err) {
                console.error(err);
                toast.error("Erro ao criar usuário!");
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
              Criar Usuário
            </h1>

            <form
              onSubmit={handleSubmit(handleSubmitUser)}
              className="mt-10 flex flex-col gap-4"
            >
              <div className="w-full flex gap-10">
                <Input
                  nome="Nome"
                  type="text"
                  placeholder="Ex: Alan Santos"
                  {...register("nome", { required: true })}
                />

                <Select nome="Cargo"
                {...register("cargo", { required: true })}>
                  <option value={""} className="text-black font-semibold">Selecione</option>
                  <option value={"lider"} className="text-black font-semibold">Líder</option>
                  <option value={"supervisor"} className="text-black font-semibold">Supervisor</option>
                  <option value={"coordenador"} className="text-black font-semibold">Coordenador</option>
                  <option value={"pastor"} className="text-black font-semibold">Pastor</option>
                  <option value={"admin"} className="text-black font-semibold">Admin</option>
                </Select>

                <Input
                  nome="WhatsApp"
                  type="text"
                  placeholder="Ex: (12) 91234-5678"
                  {...register("telefone", { required: true })}
                  onChange={(e)=> {
                    e.target.value = formatNumber(e.target.value)
                  }}
                />
              </div>

              <div className="w-full flex gap-10">

                <Input
                nome="Data de Nascimento"
                type="date"
                {...register("dataNascimento", { required: true })}
                />

                <Input
                  nome="Email"
                  type="email"
                  placeholder="Ex: alan.santos01@gmail.com"
                  {...register("email", { required: true })}
                />

                <Input
                  nome="Senha"
                  type="text"
                  {...register("senha", { required: true })}
                />
                
              </div>

              <div className="w-full flex gap-10">

                <Input
                  nome="Foto do usuário"
                  type="file"
                  {...register("foto", { required: true })}
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
