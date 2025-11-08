    import { InputHTMLAttributes, useState } from "react";
    import { Eye, EyeOff } from "lucide-react"; // pacote de ícones leve

    interface InputLoginProps extends InputHTMLAttributes<HTMLInputElement> {
    nome: string;
    }

    export function InputLogin({ nome, type, ...rest }: InputLoginProps) {

    // Visualizar senha
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // Condição booleana
    const isPassword = type === "password";

    return (
        <div className="w-full flex flex-col">
        <label className="text-lg mb-1 font-manrope">{nome}</label>

        <div className="relative">
            <input
            type={isPassword && showPassword ? "text" : type}
            className={`w-full p-2 pr-10 border rounded-md transition-all 
                placeholder:opacity-50 placeholder:text-white
                border-white hover:border-blue-400 
                focus:outline-none focus:border-blue-400`}
            {...rest}
            />

            {isPassword && (
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white cursor-pointer focus:outline-none"
            >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>
            )}
        </div>
        </div>
    );
    }