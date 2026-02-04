"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type UserType = {
  id: string;
  nome: string;
  email: string;
  foto?: string;
  cargo: string;
};

type AuthContextType = {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  logout: () => void;
  isLoading: boolean;
  atualizarUsuario: (novoUser: UserType) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Carrega usuário do localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("userSession");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  // 🔹 Salva sempre que o usuário mudar
  useEffect(() => {
    if (user) {
      localStorage.setItem("userSession", JSON.stringify(user));
    } else {
      localStorage.removeItem("userSession");
    }
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userSession");
    window.location.href = "/auth/login";
  };

  const atualizarUsuario = (novoUser: UserType) => {
    setUser(novoUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, logout, isLoading, atualizarUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro do AuthProvider");
  return context;
}