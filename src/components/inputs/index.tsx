import { InputHTMLAttributes } from "react";

interface inputProps extends InputHTMLAttributes<HTMLInputElement> {
  nome?: string;
}

export function Input({ nome, ...rest }: inputProps) {
  return (
    <div className="w-full flex flex-col gap-1 md:gap-2">
      {nome && <><label className="font-manrope text-lg">{nome}</label></>}
      <input
        className="w-full bg-[#514F4F]/40 p-3 rounded-lg border border-white
                   hover:border-blue-400
                   focus:border-blue-500 focus:ring-blue-400 focus:outline-none
                   no-picker"
        {...rest}
      />
    </div>
  );
}
