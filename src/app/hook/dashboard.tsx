import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Discipulo {
  celula_id: string;
}

export function useDashboardData(userId?: string) {
  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [totalLideres, setTotalLideres] = useState(0);
  const [totalSupervisores, setTotalSupervisores] = useState(0);
  const [totalCoordenadores, setTotalCoordenadores] = useState(0);
  const [celulas, setCelulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  const loadCelulas = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("celulas")
      .select("*")
      .eq("responsavel_id", userId);

    setCelulas(data || []);
  }, [userId]);



  const loadDiscipulos = useCallback(async () => {
    if (!celulas[0]?.id) return;

    const { data } = await supabase
      .from("discipulos")
      .select("*")
      .eq("celula_id", celulas[0].id);

    setDiscipulos(data || []);
  }, [celulas]);




  const loadLideresSupervisao = useCallback(async () => {
    if (!userId) return;

    const { data: supervisao } = await supabase
      .from("supervisoes")
      .select("id")
      .eq("supervisor_id", userId)
      .single();

    if (!supervisao) return;

    const { data: lideres } = await supabase
      .from("supervisao_lideres")
      .select("id")
      .eq("supervisao_id", supervisao.id);

    setTotalLideres(lideres?.length || 0);
  }, [userId]);




  const loadSupervisoresCoordenacao = useCallback(async () => {
    if (!userId) return;

    const { data: coordenacao } = await supabase
      .from("coordenacoes")
      .select("id")
      .eq("coordenador_id", userId)
      .single();

    if (!coordenacao) return;

    const { data: supervisores } = await supabase
      .from("coordenacao_supervisoes")
      .select("id")
      .eq("coordenacao_id", coordenacao.id);

    setTotalSupervisores(supervisores?.length || 0);
  }, [userId]);




  const loadCoordenadores = useCallback(async () => {
  const { data: coordenadores } = await supabase
    .from("users")
    .select("id")
    .eq("cargo", "coordenador");

  setTotalCoordenadores(coordenadores?.length || 0);
}, []);
  

  useEffect(() => {
    if (!userId) return;
    loadCelulas();
    loadLideresSupervisao();
    loadSupervisoresCoordenacao();
    loadCoordenadores();
  }, [
    userId, 
    loadCelulas, 
    loadLideresSupervisao, 
    loadSupervisoresCoordenacao, 
    loadCoordenadores]);

  useEffect(() => {
    loadDiscipulos();
    setLoading(false);
  }, [loadDiscipulos]);

  return {
    discipulos,
    totalLideres,
    totalSupervisores,
    totalCoordenadores,
    loading,
  };
}
