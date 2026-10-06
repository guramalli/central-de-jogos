// ===== Lenda do Campinho — preferências de convivência de cada jogador (v407, Raio-X U5) =====
// O jogo manda ao conectar (evento "lenda-prefs", em socketMundo.js) e quando a pessoa muda em ⚙️ › 🌐 Online.
// Fica só na memória (o jogo manda de novo a cada conexão). Sem mandar nada, valem os PADRÕES — os mais protegidos:
//   - convitesTodos: false → convite de grupo só de AMIGOS e colegas de guilda (guilda e torcida já eram só de amigos);
//   - invisivel: false     → aparece para os outros no mundo compartilhado (ligado: vê os outros, mas ninguém vê você).
export const PADRAO = Object.freeze({ convitesTodos: false, invisivel: false });
const prefs = new Map();
export const prefsDe = (userId) => prefs.get(userId) || PADRAO;
export function definePrefs(userId, p) {
  if (!userId) return PADRAO;
  const atual = prefsDe(userId);
  const novo = {
    convitesTodos: typeof p?.convitesTodos === "boolean" ? p.convitesTodos : atual.convitesTodos,
    invisivel: typeof p?.invisivel === "boolean" ? p.invisivel : atual.invisivel,
  };
  if (prefs.size > 20000 && !prefs.has(userId)) prefs.clear(); // (teto de memória; o jogo manda de novo ao reconectar)
  prefs.set(userId, novo);
  return novo;
}
export function __zeraPrefs() { prefs.clear(); }
