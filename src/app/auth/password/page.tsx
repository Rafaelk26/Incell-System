"use client";

import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import IncellLogo from "../../../../public/assets/file Incell.png";
import { Input } from "@/components/inputs";
import { ButtonAction } from "@/components/all/buttonAction";
import { useState, FormEvent } from "react";

export default function Password() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Digite seu e-mail");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Erro ao enviar e-mail");
        return;
      }

      console.log(data)

      toast.success("E-mail enviado! Verifique sua caixa de entrada.");
      setEmail("");
    } catch {
      toast.error("Erro ao solicitar recuperação de senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full h-screen flex justify-center items-center">
      <div className="max-w-sm w-full flex flex-col items-center gap-6">

        <Link href="/">
          <Image 
          width={250}
          src={IncellLogo} 
          alt="Logo" />
        </Link>

        <h1 className="text-xl text-center font-manrope">
          Digite seu e-mail para recuperar a senha
        </h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6">
          <Input
            placeholder="Ex: jorge.silva@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
          />

          <ButtonAction
            type="submit"
            color="bg-blue-500"
            disabled={loading}
          >
            <span className="text-white text-xl font-manrope">
              {loading ? "Enviando..." : "Recuperar senha"}
            </span>
          </ButtonAction>
        </form>
      </div>
    </main>
  );
}
