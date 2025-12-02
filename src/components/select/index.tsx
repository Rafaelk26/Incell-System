import { InputHTMLAttributes, SelectHTMLAttributes } from "react";

interface selectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  nome?: string;
  children: React.ReactNode
}

export function Select({ nome, children, ...rest }: selectProps) {
  return (
    <div className="w-full flex flex-col gap-2">
        {nome && (
          <>
            <label className="font-manrope text-lg">{nome}</label>
          </>
        )}
        <select
        {...rest}
        className="bg-[#514F4F]/40 p-3 pr-10 rounded-lg border border-white font-manrope
        hover:border-blue-400 
        focus:border-blue-500 focus:ring-blue-400 focus:outline-none">
            {children}
        </select>
    </div>
  );
}
