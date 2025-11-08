"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import imgLogo from '../../public/assets/file Incell.png';

export default function Home() {
  // 🔹 useMemo evita re-render desnecessário do vídeo
  const videoSrc = useMemo(() => "/assets/fundo.mp4", []);

  return (
    <main className="relative w-full h-screen overflow-hidden flex justify-center items-center bg-black">
      
      {/* 🔹 Fundo de vídeo otimizado */}
      <video
        key={videoSrc}
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src={videoSrc} type="video/webm" />
        <source src="/assets/fundo.mp4" type="video/mp4" />
        Seu navegador não suporta vídeo em HTML5.
      </video>

      {/* 🔹 Camada de sobreposição escura para legibilidade */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/85 z-[1]" />

      {/* 🔹 Conteúdo principal */}
      <div className="relative z-[2] text-center text-white px-4 flex flex-col items-center">
        
        <Image 
        className="w-52 mb-8"
        src={imgLogo}
        alt="Logo Incell"
        />

        <h1 className="text-5xl mb-6 font-manrope font-semibold leading-tight">
          Lorem Ipsum is simply dummy text of the <br />printing and <span className="text-blue-600">typesetting industry</span>
        </h1>
        <p className="max-w-4xl w-full text-xl font-light font-manrope leading-normal mb-10">
          Organize, acompanhe e fortaleça cada área da sua célula com um sistema feito para unir pessoas, simplificar processos e impulsionar o crescimento da igreja.
          Porque aqui, o nosso propósito é claro: amar, servir e crescer juntos, isso é <strong className="font-semibold">Simplesmente Célula</strong>.
        </p>
        <Link
          href="/auth/login"
          className="w-50 inline-block bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold font-manrope
          text-xl
          hover:bg-blue-600 hover:scale-110 transition"
        >
          Login
        </Link>
      </div>
    </main>
  );
}
