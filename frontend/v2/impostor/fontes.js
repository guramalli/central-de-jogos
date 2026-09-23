// Anton (títulos, números, palavra da carta, dicas) e Manrope (resto).
// Carregadas só quando o Impostor abre — o index.html da v2 não muda e as
// outras páginas não baixam essas fontes.
const ID = "imp-fontes";
const URL =
  "https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;600;700;800&display=swap";

export function carregarFontes() {
  if (document.getElementById(ID)) return;
  const link = document.createElement("link");
  link.id = ID;
  link.rel = "stylesheet";
  link.href = URL;
  document.head.appendChild(link);
}
