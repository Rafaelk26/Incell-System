// app/admin/celulas/page.tsx 
"use client";

import ProtectedLayout from "@/app/middleware/protectedLayout";
import { Navbar } from "@/components/all/navBar";
import Image from "next/image";
import Perfil from "../../../../public/assets/perfil teste.avif";
// import { Input } from "@/components/inputs";
// import { Select } from "@/components/select";
// import { useForm } from "react-hook-form";
// import { supabase } from "@/lib/supabaseClient";
// import { useEffect, useState } from "react";
// import toast from "react-hot-toast";
// import { ButtonAction } from "@/components/all/buttonAction";


export default function AdminCelulas() {

  return (
    <ProtectedLayout>
      <main className="max-w-full h-screen flex">
        <Navbar />
        <main className="max-w-full w-full overflow-x-hidden xl:mx-auto px-6">
          <header className="w-full flex justify-end px-10 pt-6">
            <Image className="w-12 rounded-full border border-white" src={Perfil} alt="Perfil" />
          </header>

          <section className="max-w-full w-full md:mt-14">
            <h1 className="font-bold text-4xl font-manrope">Células</h1>
          </section>
        </main>
      </main>
    </ProtectedLayout>
  );
}
