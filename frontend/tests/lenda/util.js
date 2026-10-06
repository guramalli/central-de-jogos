// Ajudantes dos testes da Lenda: lê arquivos de frontend/ e roda scripts
// clássicos do jogo/vitrine dentro de um "navegador de mentira" (node:vm).
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const le = (rel) => readFileSync(path.join(RAIZ, rel), "utf8");
export function carrega(rel, contexto = {}) {
  const ctx = vm.createContext(contexto);
  vm.runInContext(le(rel), ctx, { filename: rel });
  return ctx;
}
