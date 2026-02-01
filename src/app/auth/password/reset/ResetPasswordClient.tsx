"use client";

import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import IncellLogo from "../../../../../public/assets/file Incell.png";
import { Input } from "@/components/inputs";
import { useState, FormEvent } from "react";
import { ButtonAction } from "@/components/all/buttonAction";
import { useSearchParams, useRouter } from "next/navigation";
import { InputLogin } from "@/components/login/inputLogin";

export default function ResetPasswordClient() {
  const [password, setPassword] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!password) return toast.error("Digite a nova senha");
    if (!confirmarSenha) return toast.error("Confirme a nova senha");
    if (password !== confirmarSenha)
      return toast.error("As senhas não coincidem");

    if (!token)
      return toast.error("Token inválido ou expirado");

    try {
      setLoading(true);

      const response = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      toast.success("Senha alterada com sucesso!");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full h-dvh flex flex-col justify-center items-center bg-cover
    md:h-screen">
      <div className="max-w-sm w-full h-fit flex flex-col justify-center items-center py-8 md:max-w-md">
        <Link href="/" className="w-fit focus:outline-none">
          <Image src={IncellLogo} alt="Logo Oficial" className="w-54" />
        </Link>

        <h1 className="w-full text-xl text-center font-manrope my-2">
          Digite a nova senha
        </h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">


          <InputLogin
            onChange={(e) => setPassword(e.target.value)}
            nome="Nova senha"
            placeholder="Nova senha"
            type="password"
          />

          <InputLogin
            onChange={(e) => setConfirmarSenha(e.target.value)}
            nome="Confirmar nova senha"
            placeholder="Confirmar nova senha"
            type="password"
          />

          
          <ButtonAction 
          type="submit" color="bg-blue-500" disabled={loading}>
            <span className="text-white text-xl font-manrope">
              {loading ? "Alterando..." : "Alterar senha"}
            </span>
          </ButtonAction>
        </form>
      </div>
    </main>
  );
}
