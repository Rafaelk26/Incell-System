"use client";

// import { useAuth } from "../../../context/useUser";
import Perfil from "../../../../../public/assets/perfil teste.avif";
import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import Link from "next/link";
import { BiSolidChurch } from "react-icons/bi";
import { HiUsers } from "react-icons/hi";
import { FaUsers } from "react-icons/fa6";
import { useAuth } from "@/app/context/useUser";




export default function CriarMinisterios(){

    const { user } = useAuth();

    return(
        <>
            <ProtectedLayout>
                <main className="max-w-full h-screen flex">
                    <Navbar />
                    <main className="max-w-[84rem] w-full overflow-x-hidden xl:mx-auto">
                        <header className="w-full flex justify-end px-10 pt-6">
                            <Image
                            className="w-12 h-12 rounded-full border border-white"
                            src={user?.foto || ""}
                            alt="Perfil"
                            width={12}
                            height={12}
                            />
                        </header>

                        <section className="w-full md:mt-14 flex flex-col items-center">
                            <h1 className="font-bold text-4xl font-manrope">Qual o ministério a ser criado?</h1>

                            {/* Criar Célula */}
                            <section className="flex gap-6 mt-16">
                                <Link href={"/admin/criar/ministerios/celula"}>
                                    <div className="max-w-64 w-64 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                    hover:scale-105">
                                        <BiSolidChurch size={48} />
                                        <span className="text-lg font-manrope font-semibold">Célula</span>
                                    </div>
                                </Link>

                                {/* Criar Supervisão */}
                                <Link href={"/admin/criar/ministerios/supervisao"}>
                                    <div className="max-w-64 w-64 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                    hover:scale-105">
                                        <HiUsers size={48} />
                                        <span className="text-lg font-manrope font-semibold">Supervisão</span>
                                    </div>
                                </Link>


                                {/* Criar Coordenação */}
                                <Link href={"/admin/criar/ministerios/coordenacao"}>
                                    <div className="max-w-64 w-64 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                    hover:scale-105">
                                        <FaUsers size={48} />
                                        <span className="text-lg font-manrope font-semibold">Coordenação</span>
                                    </div>
                                </Link>
                            </section>
                        </section>
                    </main>
                </main>
            </ProtectedLayout>
        </>
    )
}