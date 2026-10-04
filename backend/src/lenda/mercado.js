// ===== Lenda do Campinho — LOJAS DOS JOGADORES ("MMO leve", etapa 4; estilo Metin2) =====
//
// Dono: "possibilidade de pessoas abrirem lojas para venda de itens no jogo, baseado no Metin2" → "Tudo, com limites"
// + "Barraca na cidade + mercado". Só TOSTÕES (nada de dinheiro de verdade).
// - O vendedor anuncia um item da mochila (sai do jogo dele e fica guardado AQUI); quem compra recebe o item e paga em
//   tostões; o vendedor recolhe os tostões depois (menos TAXA). Anúncio vence em DURACAO_MS: o item volta ao vendedor.
// - O inventário mora no aparelho de cada um, então aqui ficam os LIMITES: só itens do catálogo, preço entre
//   PRECO_MIN e PRECO_MAX × o valor de referência, nível mínimo para vender, anúncios ativos e por dia.
// - Barraca: o vendedor monta na cidade (posição, título de uma lista e cor); aparece para todo mundo naquele mapa.
// O catálogo (itens_mercado.json) é exportado do jogo: { id: { n: nome, v: venda, p: preço, l: nível, t: tipo, e: empilha, r: raridade } }.
import { readFileSync } from "node:fs";

export const CATALOGO = JSON.parse(readFileSync(new URL("./itens_mercado.json", import.meta.url), "utf8"));
export const NIVEL_VENDER = 30;
export const MAX_ATIVOS = 12;
export const MAX_POR_DIA = 20;
export const MAX_QTD = 999;
export const DURACAO_MS = 3 * 24 * 3600e3;
export const TAXA = 0.05;                 // tostões que somem a cada venda (segura a inflação)
export const PRECO_MIN = 0.5, PRECO_MAX = 25;
export const BARRACA_MS = 24 * 3600e3, BARRACAS_POR_MAPA = 40, BARRACA_DIST = 2;
export const TITULOS = ["Promoção!", "Itens raros", "Poções e comidas", "Equipamentos", "Materiais", "Tudo barato!", "Novidades",
  "Para iniciantes", "Para o Multiverso", "Relíquias e tesouros", "Itens refinados", "Leve 2!"];
export const CORES_BARRACA = 4;

// pode vender? (itens únicos, troféus, chaves, bolsas e o que não tem valor ficam de fora)
export function vendavel(id) {
  const c = CATALOGO[id];
  if (!c) return false;
  if (c.t === "chave" || c.t === "bolsa") return false;
  return c.v > 0 || c.p > 0;
}
export const refItem = (id) => { const c = CATALOGO[id]; return c ? Math.max(c.v || 0, Math.round((c.p || 0) * 0.4), 1) : 0; };
export function faixaPreco(id, refino = 0) {
  const r = Math.max(0, Math.min(15, Math.floor(Number(refino) || 0)));
  const base = refItem(id) * (1 + r); // refinado vale mais (cada +1 soma o valor do item)
  return { min: Math.max(1, Math.floor(base * PRECO_MIN)), max: Math.max(1, Math.round(base * PRECO_MAX)) };
}
const inteiro = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.floor(n) : NaN; };
// confere um anúncio novo; devolve os dados limpos ou { erro }
export function validaAnuncio({ itemId, refino, qtd, preco, nivel } = {}) {
  const id = String(itemId || "");
  if (!vendavel(id)) return { erro: "Esse item não pode ser vendido." };
  if (!(inteiro(nivel) >= NIVEL_VENDER)) return { erro: `Para vender é preciso estar no nível ${NIVEL_VENDER}.` };
  const r = Math.max(0, inteiro(refino) || 0);
  if (r > 15) return { erro: "Refino inválido." };
  const q = inteiro(qtd);
  if (!(q >= 1 && q <= MAX_QTD)) return { erro: `Quantidade entre 1 e ${MAX_QTD}.` };
  if ((r > 0 || !CATALOGO[id].e) && q !== 1) return { erro: "Esse item se vende um de cada vez." };
  const p = inteiro(preco), f = faixaPreco(id, r);
  if (!(p >= f.min && p <= f.max)) return { erro: `O preço de ${CATALOGO[id].n}${r ? ` +${r}` : ""} tem que ficar entre ${f.min} e ${f.max} tostões (cada).` };
  return { ok: true, itemId: id, refino: r, qtd: q, preco: p };
}
export const recebeVendedor = (total) => Math.floor(total * (1 - TAXA));
export const inicioDoDia = (agora = Date.now()) => { const d = new Date(agora - 3 * 3600e3); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + 3 * 3600e3); };
// itens cujo nome casa com a busca (sem acento, sem maiúscula)
const simples = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function idsDaBusca(q) {
  const b = simples(q).trim(); if (!b) return null;
  return Object.keys(CATALOGO).filter((id) => simples(CATALOGO[id].n).includes(b)).slice(0, 300);
}
export function validaBarraca({ mapa, x, y, titulo, cor } = {}) {
  if (!(typeof mapa === "string" && /^[a-z0-9_]{1,40}$/.test(mapa))) return { erro: "Lugar inválido." };
  const X = Number(x), Y = Number(y), t = inteiro(titulo), c = inteiro(cor);
  if (!(X >= 0 && X < 1000 && Y >= 0 && Y < 1000)) return { erro: "Posição inválida." };
  if (!(t >= 0 && t < TITULOS.length)) return { erro: "Escolha um título." };
  if (!(c >= 0 && c < CORES_BARRACA)) return { erro: "Escolha uma cor." };
  return { ok: true, mapa, x: Math.floor(X) + 0.5, y: Math.floor(Y) + 0.5, titulo: t, cor: c };
}
export const pertoDemais = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < BARRACA_DIST;
