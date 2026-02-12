export function formatarNome(nome: string): string {
  return nome
    .trim() 
    .toLowerCase()
    .split(/\s+/)
    .map(palavra => 
      palavra.charAt(0).toUpperCase() + palavra.slice(1)
    )
    .join(" ");
}
