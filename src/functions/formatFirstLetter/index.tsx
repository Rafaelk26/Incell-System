export function formatFirstLetter(word: string) {
  if (!word) return ""; // Evita erro se for undefined
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
