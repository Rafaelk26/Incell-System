
// Notificação de resposta para o usuário
import { toast } from 'react-hot-toast'

export type UserType = {
  id: string;
  nome: string;
  email: string;
  foto?: string;
  cargo: string;
};

export type LoginResult = {
  success: boolean;
  message: string;
  user?: UserType;
};

export async function handleLogin(user: string, senha: string): Promise<LoginResult> {
  try {

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, senha }),
    });

    const data = await res.json();

    // Mapear a resposta para ter a propriedade correta
    return {
      success: data.success ?? false,
      message: data.message ?? "Erro no login",
      user: data.user ?? undefined,
    };

  } catch (err) {
    toast.error("Erro ao conectar com o servidor.");
    console.error(err);
    return { success: false, message: "Erro ao conectar com o servidor." };
  }
}
