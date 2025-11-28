import Image from "next/image";
import logoIncell from "../../../../public/assets/file Incell.png";

export function SpinnerLoading() {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center absolute z-50 bg-black/85">
      <Image
        alt="Incell System"
        src={logoIncell}
        className="w-50 animate-pulse"
      />
      <span className="mt-10 text-white text-sm font-manrope">Carregando...</span>
    </div>
  );
}
