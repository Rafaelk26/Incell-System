import Image from "next/image";
import logoIncell from "../../../../public/assets/file Incell.png";

export function Spinner() {
  return (
    <div className="w-full h-dvh flex flex-col justify-center items-center
    md:h-screen">
      <Image
        alt="Incell System"
        src={logoIncell}
        className="w-50 animate-pulse"
      />
      <span className="mt-10 text-white text-sm font-manrope">Carregando...</span>
    </div>
  );
}
