"use client";

import { Navbar } from "@/components/all/navBar";
import ProtectedLayout from "../middleware/protectedLayout";
import Image from "next/image";
import { useAuth } from "../context/useUser";


export default function Perfil() {

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
        
                                <section className="w-full flex flex-col px-6">
                                    <h1 className="font-bold text-4xl font-manrope">Meu perfil</h1>

                                    <div className="bg-gray-500/40 rounded-md p-4 mt-4">
                                        <div className="flex gap-4 items-center">
                                            {/* PRECISA CARREGAR A FOTO DO BANCO */}
                                            <input 
                                            className="w-40 h-40 rounded-full border border-white"
                                            type="file" 
                                            name="Foto" />

                                            <div className="flex flex-col mt-16">
                                                <span className="font-bold font-manrope text-3xl">{user?.nome}</span>
                                                <span className="font-light font-manrope text-xl">{user && user?.cargo.charAt(0).toUpperCase() + user?.cargo.slice(1)}</span>
                                            </div>

                                        </div>
                                        <span>Email: {user?.email}</span>
                                        <span>Cargo: {user?.cargo}</span>
                                    </div>
                                </section>
                            </main>
                        </main>
        </ProtectedLayout>
    );
}