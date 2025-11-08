
import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface buttonProps extends ButtonHTMLAttributes<HTMLButtonElement>{
    children: ReactNode;
    color: string;
    link?: string;
}

// Login
export function ButtonAction({children, color, link, ...rest}: buttonProps){
    
    return(
        <>
            <button 
            {...rest}
            className={`w-max p-2 ${color} font-manrope font-extrabold rounded-sm transition-all
            hover:scale-105 hover:cursor-pointer
            focus:outline-none`}>
                { link ? (
                        <>
                            <Link href={link}>{children}</Link>
                        </>
                    ):(
                        <>
                            {children}
                        </>
                    )    
                }
            </button>
        </>    
    )
    
}