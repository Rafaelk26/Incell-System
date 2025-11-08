"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { useAuth } from "../context/useUser";
import { Navbar } from "@/components/all/navBar";
import Perfil from "../../../public/assets/perfil teste.avif";
import Image from "next/image";
import Link from "next/link";
import { BiSolidChurch } from "react-icons/bi";
import { HiUsers } from "react-icons/hi";
import { PiUsersFourFill } from "react-icons/pi";
import { FaUsers } from "react-icons/fa6";




export default function Relatorios(){

    const { user } = useAuth();

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

                        <section className="w-full md:mt-14 flex flex-col items-center">
                            <h1 className="font-bold text-4xl font-manrope">Qual o tipo do relatório?</h1>

                            <section className="flex gap-6 mt-16">
                                <Link href={"/relatorios/celula"}>
                                    <div className="max-w-64 w-64 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                    hover:scale-105">
                                        <BiSolidChurch size={48} />
                                        <span className="text-lg font-manrope font-semibold">Relatório de Célula</span>
                                    </div>
                                </Link>


                                <Link href={"/relatorios/discipulado"}>
                                    <div className="max-w-64 w-64 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                    hover:scale-105">
                                        <HiUsers size={48} />
                                        <span className="text-lg font-manrope font-semibold">Relatório de Discipulado</span>
                                    </div>
                                </Link>

                                {user?.cargo === "Supervisor" && (
                                    <>
                                        <Link href={"/relatorios/gdl"}>
                                            <div className="max-w-64 w-64 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                            hover:scale-105">
                                                <PiUsersFourFill size={48} />
                                                <span className="text-lg font-manrope font-semibold">Relatório de GDL</span>
                                            </div>
                                        </Link>
                                    </>
                                )}


                                {user?.cargo === "Coordenador" && (
                                    <>
                                        <Link href={"/relatorios/gds"}>
                                            <div className="max-w-64 w-64 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                            hover:scale-105">
                                                <FaUsers size={48} />
                                                <span className="text-lg font-manrope font-semibold">Relatório de GDS</span>
                                            </div>
                                        </Link>
                                    </>
                                )}



                                {user?.cargo === "Pastor" && (
                                    <>
                                        <Link href={"/relatorios/gdc"}>
                                            <div className="max-w-64 w-64 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                            hover:scale-105">
                                                <FaUsers size={48} />
                                                <span className="text-lg font-manrope font-semibold">Relatório de GDC</span>
                                            </div>
                                        </Link>
                                    </>
                                )}
                            </section>
                        </section>
                    </main>
                </main>
            </ProtectedLayout>
        </>
    )
}