export function ordenarPorTexto<T>(
  lista: T[],
  chave: keyof T,
  ordem: "asc" | "desc" = "asc"
): T[] {
  return [...lista].sort((a, b) => {
    const valorA = String(a[chave] ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const valorB = String(b[chave] ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (valorA < valorB) return ordem === "asc" ? -1 : 1;
    if (valorA > valorB) return ordem === "asc" ? 1 : -1;
    return 0;
  });
}