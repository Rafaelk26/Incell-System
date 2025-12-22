"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import Perfil from "../../../../public/assets/perfil teste.avif";
import Image from "next/image";
import { Navbar } from "@/components/all/navBar";

export default function Page() {
  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />

        <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image
              className="w-12 rounded-full border border-white"
              src={Perfil}
              alt="Perfil"
            />
          </header>

          <section className="max-w-6xl w-full px-10 md:mt-14 md:mb-10">
            <h1 className="font-bold text-4xl font-manrope">
              Relatório de GDS
            </h1>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
