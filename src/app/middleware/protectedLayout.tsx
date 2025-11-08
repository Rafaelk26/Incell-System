"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "../context/useUser";
import { usePathname } from "next/navigation";
import { Spinner } from "@/components/all/spiner";

type Props = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // 1️⃣ Se ainda está carregando, não faz nada
    if (isLoading) return;

    // 2️⃣ Se não tiver usuário, vai para login
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    // 3️⃣ Se o caminho for /admin e o cargo não for admin, redireciona para o dashboard
    if (pathname.startsWith("/admin") && user.cargo !== "admin") {
      window.location.href = "/dashboard";
    }
  }, [isLoading, user, pathname]);

  if (isLoading || !user)
    return (
      <Spinner />
    );

  return <>{children}</>;
}
