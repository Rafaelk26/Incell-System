"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Perfil from "../../../../public/assets/perfil teste.avif";
import Image from "next/image";
import { useState } from "react";

export default function RelatorioGDL(){

    const { dataUserCookie } = useAuth();

    return(
        <>
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

                        <section className="w-full md:mt-14">
                            <h1 className="font-bold text-4xl font-manrope">Relatório GDL</h1>
                        </section>
                    </main>
                </main>
            </ProtectedLayout>
        </>
    )
}