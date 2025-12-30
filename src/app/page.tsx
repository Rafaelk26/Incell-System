"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import imgLogo from "../../public/assets/file Incell.png";

export default function Home() {
  const videoSrc = useMemo(() => "/assets/fundo.mp4", []);

  // Texto com marcações (cores)
  const fullText = [
    { text: "A tecnologia", color: "text-blue-500" },
    { text: " a serviço da missão do Reino.\nOnde gestão e cuidado ", color: "text-white" },
    { text: "fazem a diferença!", color: "text-blue-500" },
  ];

  const [displayIndex, setDisplayIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");

  // Efeito de digitação
  useEffect(() => {
    const textToType = fullText.map((t) => t.text).join("");
    let index = 0;
    const speed = 50;
    const typing = setInterval(() => {
      setDisplayText(textToType.slice(0, index));
      index++;
      if (index > textToType.length) clearInterval(typing);
    }, speed);
    return () => clearInterval(typing);
  }, []);

  // Função para renderizar o texto com cores parciais
  const renderColoredText = () => {
    let remaining = displayText;
    const elements = [];
    for (const part of fullText) {
      const visible = remaining.slice(0, part.text.length);
      if (visible) {
        elements.push(
          <span key={part.text} className={part.color}>
            {visible}
          </span>
        );
        remaining = remaining.slice(part.text.length);
      }
    }
    return elements;
  };

  return (
    <main className="relative w-full h-screen overflow-hidden flex justify-center items-center bg-black">
      {/* 🎥 Fundo */}
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

      {/* Camada escura */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/85 z-[1]" />

      {/* Conteúdo */}
      <div className="relative z-[2] text-center text-white px-4 flex flex-col items-center max-w-5xl w-full">
        {/* Logo */}
        <Image
          className="w-52 mb-8"
          src={imgLogo}
          alt="Logo Incell"
          priority
        />

        {/* Título animado */}
        <h1 className="text-5xl mb-6 font-manrope font-semibold leading-tight whitespace-pre-line min-h-[7rem] transition-all duration-300">
          {renderColoredText()}
          <span className="animate-pulse text-blue-500">|</span>
        </h1>

        {/* Descrição fixa */}
        <p className="max-w-4xl text-xl font-light font-manrope leading-normal mb-10">
          Organize, acompanhe e fortaleça cada área da sua célula com um sistema feito para gestão,
          simplificar processos e impulsionar o crescimento da igreja. Porque cuidar de pessoas também é gestão,
          e o nosso propósito é claro: ganhar essa nação para <strong className="font-semibold">Jesus</strong>.
        </p>

        {/* Botão fixo */}
        <Link
          href="/auth/login"
          className="w-60 inline-block bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold font-manrope
          text-xl hover:bg-blue-600 hover:scale-110 transition-transform"
        >
          Acessar Login
        </Link>
      </div>
    </main>
  );
}
