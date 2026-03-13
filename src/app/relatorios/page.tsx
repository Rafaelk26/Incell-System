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
                <main className="max-w-full h-dvh flex md:h-screen">
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

                        <section className="w-full mt-16 flex flex-col items-center md:mt-14">
                            <h1 className="font-bold text-3xl font-manrope text-center md:text-4xl">Qual o tipo do relatório?</h1>

                            <section
                            className="
                                max-w-4xl mt-10 flex flex-col gap-8 justify-center
                                md:flex-row md:flex-wrap md:gap-6 md:mt-16"
                            >
                                <Link href={"/relatorios/celula"}>
                                    <div className="w-full flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                            hover:scale-105 md:w-64">
                                        <BiSolidChurch size={48} />
                                        <span className="text-lg font-manrope font-semibold">Relatório de Célula</span>
                                    </div>
                                </Link>


                                <Link href={"/relatorios/discipulado"}>
                                    <div className="w-full flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                            hover:scale-105 md:w-64">
                                        <HiUsers size={48} />
                                        <span className="text-lg font-manrope font-semibold">Relatório de Discipulado</span>
                                    </div>
                                </Link>

                                {user?.cargo === "supervisor" && (
                                    <>
                                        <Link href={"/relatorios/gdl"}>
                                            <div className="w-full flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                            hover:scale-105 md:w-64">
                                                <PiUsersFourFill size={48} />
                                                <span className="text-lg font-manrope font-semibold">Relatório de GDL</span>
                                            </div>
                                        </Link>
                                    </>
                                )}


                                {user?.cargo === "coordenador" && (
                                    <>
                                        <Link href={"/relatorios/gds"}>
                                            <div className="w-full flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                            hover:scale-105 md:w-64">
                                                <FaUsers size={48} />
                                                <span className="text-lg font-manrope font-semibold">Relatório de GDS</span>
                                            </div>
                                        </Link>
                                    </>
                                )}

                                {user?.cargo === "supervisor" && (
                                    <>
                                        <Link href={"relatorios/supervisao/celula"}>
                                            <div className="w-max flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                            hover:scale-105">
                                                <BiSolidChurch size={48} />
                                                <span className="text-lg font-manrope font-semibold">Relatório de Supervisão de Célula</span>
                                            </div>
                                        </Link>
                                    </>
                                )}
                                
                                {user?.cargo === "coordenador" && (
                                    <>
                                        <Link href={"relatorios/supervisao/celula"}>
                                            <div className="w-max flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                            hover:scale-105">
                                                <BiSolidChurch size={48} />
                                                <span className="text-lg font-manrope font-semibold">Relatório de Supervisão de Célula</span>
                                            </div>
                                        </Link>
                                    </>
                                )}



                                {user?.cargo === "pastor" && (
                                    <>
                                        <Link href={"/relatorios/gdc"}>
                                            <div className="w-full flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                            hover:scale-105 md:w-64">
                                                <FaUsers size={48} />
                                                <span className="text-lg font-manrope font-semibold">Relatório de GDC</span>
                                            </div>
                                        </Link>
                                    </>
                                )}


                                {/* 
                                {user?.cargo === "coordenador" && (
                                    <>
                                        <Link href={"/relatorios/coordenacao/gdl"}>
                                            <div className="w-64 flex flex-col items-start bg-[#514F4F]/40 px-6 py-8 gap-4 rounded-2xl transition-all
                                            hover:scale-105">
                                                <PiUsersFourFill size={48} />
                                                <span className="text-lg font-manrope font-semibold">Relatório de Coordenação de GDL</span>
                                            </div>
                                        </Link>
                                    </>
                                )} */}
                            </section>
                        </section>
                    </main>
                </main>
            </ProtectedLayout>
        </>
    )
}