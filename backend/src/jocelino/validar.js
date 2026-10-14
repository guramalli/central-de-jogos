// ===== Família Santos: Tijolo e Tempero — validação do save na conta =====
//
// O jogo (frontend/public/jocelino/) roda inteiro no navegador. O servidor só guarda uma cópia do save,
// comprimida pelo próprio jogo (gzip em base64), para continuar em outro computador. Não abre o conteúdo:
// confere só formato e tamanho — os mesmos limites do save do Lenda (lenda/validar.js).
import { LIMITES as LIMITES_LENDA } from "../lenda/validar.js";

export const LIMITES = {
  saveMaxChars: LIMITES_LENDA.saveMaxChars, // 90.000 caracteres de base64 (o express.json aceita até 100 kB)
  diaMax: 100_000,
};

const RE_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export function validarSaveJocelino(body) {
  const { dados, dia } = body || {};
  if (typeof dados !== "string" || !dados.length) return { erro: "Save vazio." };
  if (dados.length > LIMITES.saveMaxChars) return { erro: "Save grande demais." };
  if (!RE_BASE64.test(dados)) return { erro: "Save em formato inválido." };
  if (!Number.isInteger(dia) || dia < 1 || dia > LIMITES.diaMax) return { erro: "Dia inválido." };
  return { ok: true, dados, dia };
}
