import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Discipulo {
  celula_id: string;
}

export function useDashboardData(userId?: string) {
  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [totalLideres, setTotalLideres] = useState(0);
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

  useEffect(() => {
    if (!userId) return;
    loadCelulas();
    loadLideresSupervisao();
  }, [userId, loadCelulas, loadLideresSupervisao]);

  useEffect(() => {
    loadDiscipulos();
    setLoading(false);
  }, [loadDiscipulos]);

  return {
    discipulos,
    totalLideres,
    loading,
  };
}
