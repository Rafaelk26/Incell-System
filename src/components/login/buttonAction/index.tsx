import { ButtonHTMLAttributes } from "react";

interface buttonProps extends ButtonHTMLAttributes<HTMLButtonElement>{
    nome: string;
}

// Login
export function Button({nome, ...rest}: buttonProps){
    
    return(
        <>
            <button 
            {...rest}
            className="w-full p-3 bg-blue-600 font-manrope font-extrabold rounded-sm transition-all
            hover:scale-105 hover:cursor-pointer
            focus:outline-none">
                {nome}
            </button>
        </>    
    )
    
}
