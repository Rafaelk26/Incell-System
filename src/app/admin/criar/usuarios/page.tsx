"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import Perfil from "../../../../../public/assets/perfil teste.avif";
import { SpinnerLoading } from "@/components/all/spinnerLoading";
import Image from "next/image";
import { Input } from "@/components/inputs";
import { useForm } from "react-hook-form";
import { formatNumber } from "@/functions/formatNumber";
import { Select } from "@/components/select";
import toast from "react-hot-toast";
import { useState } from "react";
import { useAuth } from "@/app/context/useUser";
import { useRouter } from "next/navigation";

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

  const { user } = useAuth();
  const router = useRouter()

  const { register, handleSubmit, reset } = useForm<UsuariosForm>(); // hook também no topo
  const [ useLoading, setUseLoading ] = useState<boolean>(false)

  const handleSubmitUser = async (data: UsuariosForm) => {
        setUseLoading(true)
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
                reset({
                  nome: "",
                  cargo: "",
                  dataNascimento: "",
                  email: "",
                  foto: null as any,
                  telefone: ""
                })
                setUseLoading(false)
                
                if(data.cargo.trim() === "lider") router.push("/admin/criar/ministerios/celula")
                if(data.cargo.trim() === "supervisor") router.push("/admin/criar/ministerios/supervisao")
                if(data.cargo.trim() === "coordenador") router.push("/admin/criar/ministerios/coordenacao")
        } catch (err) {
                console.error(err);
                toast.error("Erro ao criar usuário!");
                setUseLoading(false)
        }
    };


  return (
    <ProtectedLayout>
      { useLoading && (
        <>
          <SpinnerLoading />
        </>
      )}
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-full w-full overflow-x-hidden xl:mx-auto px-6">
          <header className="w-full flex justify-end px-2 pt-6 md:px-10">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              src={user?.foto || ""}
              alt="Perfil"
              width={12}
              height={12}
            />
          </header>

          <section className="max-w-full w-full mt-10 md:mt-4">
            <h1 className="text-center font-bold text-4xl font-manrope md:text-start">
              Criar Usuário
            </h1>

            <form
              onSubmit={handleSubmit(handleSubmitUser)}
              className="mt-6 flex flex-col gap-4 mb-24
              md:mb-0 md:mt-0"
            >
              <div className="w-full flex flex-col gap-4
              md:flex-row md:gap-10">
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

              <div className="w-full flex flex-col gap-4
              md:flex-row md:gap-10">

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
                  value={"1234"}
                  {...register("senha", { required: true })}
                />
                
              </div>

              <div className="w-full flex flex-col gap-4
              md:flex-row md:gap-10">

                <Input
                  nome="Foto do usuário"
                  type="file"
                  {...register("foto", { required: true })}
                />
                
              </div>

              <button
              className="w-full p-3 mt-4 bg-blue-600 font-manrope font-extrabold rounded-sm transition-all
              md:mt-0
              hover:bg-blue-500 hover:cursor-pointer
              focus:outline-none" 
              type="submit">Registrar</button>

            </form>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
