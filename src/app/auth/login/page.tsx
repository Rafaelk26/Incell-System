"use client";

import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import Planet from "../../../../public/assets/background planet.png";
import IncellLogo from "../../../../public/assets/file Incell.png";
import { InputLogin } from "@/components/login/inputLogin";
import { Button } from "@/components/login/buttonAction";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/useUser";
import { handleLogin, LoginResult } from "@/functions/handleLogin";

export default function Login() {

  const [userInput, setUserInput] = useState("");
  const [senha, setSenha] = useState("");
  const { setUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const loadingToast = toast.loading("Verificando usuário...", {
      duration: 10000,
    });

    try {
      const result: LoginResult = await handleLogin(userInput, senha);

      toast.dismiss(loadingToast);

      if (!result.success || !result.user) {
        toast.error(result.message || "Usuário não encontrado.");
        return;
      }

      toast.success("Login realizado com sucesso!");
      toast.success(`Seja bem-vindo, ${result.user.nome}!`);

      setUser(result.user);
      router.push("/dashboard");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Erro interno no servidor ao tentar logar.");
      console.error(err);
    }
  };

  return (
    <main className="w-full h-dvh flex flex-col justify-center items-center bg-cover
    md:h-screen">
      <Image className="absolute -z-10 opacity-75" src={Planet} alt="Planeta" />

      <div className="max-w-sm w-full h-fit bg-[#020202b9] border border-solid rounded-lg flex flex-col justify-center items-center py-8 md:max-w-sm">
        <Link href={"/"} className="w-fit focus:outline-none">
          <Image
            src={IncellLogo}
            alt="Logo Oficial"
            className="w-54 focus:outline-none"
          />
        </Link>

        <form
          onSubmit={handleSubmit}
          className="max-w-80 w-full mt-4 flex flex-col gap-6"
        >
          <InputLogin
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            nome="Nome ou Email"
            placeholder="Ex: Paulo Silva | paulo.s@gmail.com"
            type="text"
          />

          <InputLogin
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            nome="Senha"
            placeholder="Senha"
            type="password"
          />

          <Link
            href={"/auth/password"}
            className="w-fit text-blue-400 underline hover:text-white"
          >
            Esqueci minha senha
          </Link>

          <Button type="submit" nome="Entrar" />
        </form>
      </div>
    </main>
  );
}
