"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import Image from "next/image";
import { Navbar } from "@/components/all/navBar";
import { useAuth } from "@/app/context/useUser";

export default function Page() {

  const { user } = useAuth();

  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />

        <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image
              className="w-12 h-12 rounded-full border border-white"
              width={12}
              height={12}
              src={user?.foto || ""}
              alt="Perfil"
            />
          </header>

          <section className="max-w-6xl w-full px-10 md:mt-14 md:mb-10">
            <h1 className="font-bold text-4xl font-manrope">
              Relatório de GDC
            </h1>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
