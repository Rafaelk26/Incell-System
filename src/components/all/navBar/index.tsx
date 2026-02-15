import { useAuth } from "@/app/context/useUser"
import Image from "next/image"
import IncellLogo from '../../../../public/assets/file Incell.png'
import Link from "next/link"
import "../../../app/globals.css"

import { FaCross, FaCalendarDays, FaPeopleGroup } from "react-icons/fa6";
import { LuLayoutDashboard } from "react-icons/lu";
import { FaClipboardList, FaUserAlt } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import { MdSettingsSuggest } from "react-icons/md";
import { MdAttachMoney } from "react-icons/md";
import { IoClose, IoMenu } from "react-icons/io5"
import { useState } from "react";


export function Navbar(){

    const { user, logout } = useAuth() 
    const [mobileOpen, setMobileOpen] = useState(false);
    
    return(
        <>
            {/* Navbar desktop */}
            <nav className="hidden md:flex max-w-52 w-full h-full bg-[#41414163] py-6">
                <ul className="w-full h-full flex flex-col items-center justify-between">
                    {/* Logo */}
                    <div>
                        <li>
                            <Link href={"/dashboard"}>
                                <Image 
                                className="w-44"
                                src={IncellLogo} 
                                alt="Logo Incell Oficial" />
                            </Link>
                            
                        </li>
                    </div>
                    
                    {/* Lista de opções */}
                    <div className="w-full h-full flex flex-col items-center">
                        
                        <div className="h-full flex flex-col justify-center">
                            <div className="flex flex-col gap-2"> 
                                <li>
                                    <div className="flex items-center mb-1 gap-2">
                                        <FiUsers size={20} color="#f9f9f9a9"/> 
                                        <span className="font-manrope font-medium text-[#cfcfcfc2]">Operacional</span> 
                                    </div>
                                </li>

                                <>
                                    <li>
                                        <Link href={"/dashboard"}>
                                            <div className="flex items-center gap-2 transition-all
                                            hover:scale-110">
                                                <LuLayoutDashboard size={20} color="#fff"/> 
                                                <span className="font-manrope font-medium text-white">Dashboard</span> 
                                            </div>
                                        </Link>
                                    </li>
                                </>

                                {user?.cargo === "admin" || user?.nome === "Ronaldo Natalino" || user?.nome === "Naira Gomez" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/estatisticas"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaClipboardList size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Estatísticas</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}


                                {user?.cargo === "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/criar/usuarios"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaUserAlt size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Criar Usuário</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}


                                {user?.cargo === "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/criar/ministerios"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Criar Ministério</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}


                                {user?.cargo === "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/pagamentos"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <MdAttachMoney size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Pagamentos</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}

                                {user?.nome !== "Naira Gomez" && user?.nome !== "Ronaldo Natalino" && user?.cargo !== "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/relatorios"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaClipboardList size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Relatórios</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}

                                {user?.cargo !== "admin" && (
                                    <>
                                        <li>
                                            <Link href={`/agenda/${user?.id}`}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaCalendarDays size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Agenda</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}
                                
                            </div>
                            
                            
                            <div className="flex flex-col mt-12 gap-2"> 
                                <div className="flex items-center mb-1 gap-2">
                                    <MdSettingsSuggest size={26} color="#f9f9f9a9"/> 
                                    <span className="font-manrope font-medium text-[#cfcfcfc2]">Gestão</span> 
                                </div>
                                <li>
                                    {user?.nome !== "Ronaldo Natalino" && user?.cargo !== "admin" && (
                                        <>
                                            <Link href={"/celula"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaCross size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Célula</span> 
                                                </div>
                                            </Link>
                                        </>
                                    )}
                                    
                                </li>

                                {user?.cargo === "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/usuarios"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaUserAlt size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Usuários</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}

                                {user?.cargo === "pastor" && (
                                    <>
                                        <li>
                                            <Link href={"/celulas"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaCross size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Células</span> 
                                                </div>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link href={"/supervisoes"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Supervisões</span> 
                                                </div>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link href={"/coordenacoes"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Coordenações</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}

                                { user?.cargo === "supervisor" && (
                                    <>
                                        <li>
                                            <Link href={"/supervisao"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Supervisão</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}

                                {user?.cargo === "coordenador" && (
                                    <>
                                        <li>
                                            <Link href={"/coordenacao"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Coordenação</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}




                                {/* Admin */}


                                {user?.cargo === "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/celulas"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaCross size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Células</span> 
                                                </div>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link href={"/admin/supervisoes"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Supervisões</span> 
                                                </div>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link href={"/admin/coordenacoes"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope font-medium text-white">Coordenações</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}
                                
                            </div>
                            
                        </div>
                    </div>

                    {/* Perfil */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-full flex gap-2 items-center">
                            <Image 
                            className="w-12 h-12 rounded-full border-2 border-white"
                            src={user?.foto || ""}
                            width={50}
                            height={50}
                            alt="Perfil"/>

                            <Link href={"/perfil"}>{user?.nome}</Link>
                        </div>
                    
                        <button 
                        type="button"
                        onClick={logout}
                        className="w-full p-2 bg-red-600 text-white rounded-2xl cursor-pointer hover:scale-105 transition-all">Sair</button>
                    </div>
                </ul>
            </nav>



            {!mobileOpen && (
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-3 left-6 z-50 bg-[#41414163] p-3 rounded-lg md:hidden"
            >
                <IoMenu size={32} color="#fff" />
            </button>
            )}

            {/* Navbar mobile */}
            <nav className={`fixed z-40 top-0 left-0 flex justify-center 
            max-w-full w-full h-screen bg-[#0a0a0a]/90 py-10 transition-transform 
            duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
            md:hidden`}>

                {/* Logo de fechar modal navbar mobile */}
                <div className="absolute top-16 right-20">
                    <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute">
                    <IoClose size={40} color="oklch(57.7% 0.245 27.325)" />
                    </button>
                </div>

                <ul className="w-sm h-full flex flex-col items-center gap-20">
                    {/* Logo */}
                    <div>
                        <li>
                            <Link href={"/dashboard"}>
                                <Image 
                                className="w-44 md:w-44"
                                src={IncellLogo} 
                                alt="Logo Incell Oficial" />
                            </Link>
                            
                        </li>
                    </div>
                    
                    {/* Lista de opções */}
                    <div className="w-full flex flex-col items-center">
                        
                        <div className="w-max h-max flex flex-col items-start">
                            <div className="flex flex-col gap-2"> 
                                <li>
                                    <div className="flex items-center mb-1 gap-2">
                                        <FiUsers size={20} color="#f9f9f9a9"/> 
                                        <span className="font-manrope text-2xl text-[#cfcfcfc2]">Operacional</span> 
                                    </div>
                                </li>

                                <>
                                    <li>
                                        <Link href={"/dashboard"}>
                                            <div className="flex items-center gap-2 transition-all
                                            hover:scale-110">
                                                <LuLayoutDashboard size={20} color="#fff"/> 
                                                <span className="font-manrope text-xl text-white">Dashboard</span> 
                                            </div>
                                        </Link>
                                    </li>
                                </>

                                {user?.cargo === "admin" || user?.nome === "Ronaldo Natalino" || user?.nome === "Naira Gomez" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/estatisticas"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaClipboardList size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Estatísticas</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}


                                {user?.cargo === "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/criar/usuarios"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaUserAlt size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Criar Usuário</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}


                                {user?.cargo === "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/criar/ministerios"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Criar Ministério</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}

                                {user?.cargo === "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/pagamentos"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <MdAttachMoney size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Pagamentos</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}


                                {user?.nome !== "Naira Gomez" && user?.nome !== "Ronaldo Natalino" && user?.cargo !== "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/relatorios"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaClipboardList size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Relatórios</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}

                                {user?.cargo !== "admin" && (
                                    <>
                                        <li>
                                            <Link href={`/agenda/${user?.id}`}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaCalendarDays size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Agenda</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}
                                
                            </div>
                            
                            
                            <div className="flex flex-col mt-12 gap-2"> 
                                <div className="flex items-center mb-1 gap-2">
                                    <MdSettingsSuggest size={26} color="#f9f9f9a9"/> 
                                    <span className="font-manrope text-2xl text-[#cfcfcfc2]">Gestão</span> 
                                </div>
                                <li>
                                    {user?.nome !== "Naira Gomez" && user?.nome !== "Ronaldo Natalino" && user?.cargo !== "admin" && (
                                        <>
                                            <Link href={"/celula"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaCross size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Célula</span> 
                                                </div>
                                            </Link>
                                        </>
                                    )}
                                    
                                </li>

                                {user?.cargo === "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/usuarios"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaUserAlt size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Usuários</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}

                                {user?.cargo === "pastor" && (
                                    <>
                                        <li>
                                            <Link href={"/celulas"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaCross size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Células</span> 
                                                </div>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link href={"/supervisoes"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Supervisões</span> 
                                                </div>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link href={"/coordenacoes"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Coordenações</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}

                                { user?.cargo === "supervisor" && (
                                    <>
                                        <li>
                                            <Link href={"/supervisao"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Supervisão</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}

                                {user?.cargo === "coordenador" && (
                                    <>
                                        <li>
                                            <Link href={"/coordenacao"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Coordenação</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}




                                {/* Admin */}


                                {user?.cargo === "admin" && (
                                    <>
                                        <li>
                                            <Link href={"/admin/celulas"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaCross size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Células</span> 
                                                </div>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link href={"/admin/supervisoes"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Supervisões</span> 
                                                </div>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link href={"/admin/coordenacoes"}>
                                                <div className="flex items-center gap-2 transition-all
                                                hover:scale-110">
                                                    <FaPeopleGroup size={20} color="#fff"/> 
                                                    <span className="font-manrope text-xl text-white">Coordenações</span> 
                                                </div>
                                            </Link>
                                        </li>
                                    </>
                                )}
                                
                            </div>
                            
                        </div>
                    </div>

                    {/* Perfil */}
                    <div className="w-72 flex flex-col items-center gap-4">
                        <div className="w-max flex gap-2 items-center">
                            <Image 
                            className="w-12 h-12 rounded-full border-2 border-white"
                            src={user?.foto || ""}
                            width={50}
                            height={50}
                            alt="Perfil"/>

                            <Link href={"/perfil"} className="text-xl font-manrope">{user?.nome}</Link>
                        </div>
                    
                        <button 
                        type="button"
                        onClick={logout}
                        className="w-full p-2 bg-red-600 text-white rounded-md cursor-pointer hover:scale-105 transition-all">Sair</button>
                    </div>
                </ul>
            </nav>
        </>
    )
}
