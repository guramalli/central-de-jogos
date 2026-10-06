// ===== Lenda do Campinho — LOJAS DOS JOGADORES ("MMO leve", etapa 4; estilo Metin2) =====
//
// Dono: "possibilidade de pessoas abrirem lojas para venda de itens no jogo, baseado no Metin2" → "Tudo, com limites"
// + "Barraca na cidade + mercado". Só TOSTÕES (nada de dinheiro de verdade).
// - O vendedor anuncia um item da mochila (sai do jogo dele e fica guardado AQUI); quem compra recebe o item e paga em
//   tostões; o vendedor recolhe os tostões depois (menos TAXA). Anúncio vence em DURACAO_MS: o item volta ao vendedor.
// - O inventário mora no aparelho de cada um, então aqui ficam os LIMITES: só itens do catálogo, preço entre
//   PRECO_MIN e PRECO_MAX × o valor de referência, nível mínimo para vender, anúncios ativos e por dia.
// - Barraca: o vendedor monta numa VAGA da Praça da Feira (título de uma lista e cor); aparece para todo mundo lá.
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
// dono: "crie um espaço específico onde ficarão concentradas as vendinhas" → PRAÇA DA FEIRA com VAGAS fixas
export const BARRACA_MS = 24 * 3600e3, VAGAS = 36;
export const TITULOS = ["Promoção!", "Itens raros", "Poções e comidas", "Equipamentos", "Materiais", "Tudo barato!", "Novidades",
  "Para iniciantes", "Para o Multiverso", "Relíquias e tesouros", "Itens refinados", "Leve 2!"];
export const CORES_BARRACA = 4;

// itens que a loja da cidade não compra (valem 1) mas que vale a pena trocar entre jogadores: valor de referência próprio
export const REF_ESPECIAL = { fragmento_desperto: 20000 };
// v407 (Raio-X U7): MÍTICOS e itens das ARENAS (troféus) ficam fora da feira — são prova de que a pessoa venceu o chefão
export const ITENS_ARENA = new Set(["trofeu_terrao", "trofeu_ondas", "trofeu_piramides", "trofeu_neon", "trofeu_nevasca", "trofeu_lendas", "trofeu_copa"]);
// pode vender? (itens únicos, troféus, chaves, bolsas e o que não tem valor — lembranças, medalhas — ficam de fora)
export function vendavel(id) {
  const c = CATALOGO[id];
  if (!c) return false;
  if (c.r === "mitico" || ITENS_ARENA.has(id)) return false;
  if (REF_ESPECIAL[id]) return true;
  if (c.t === "chave" || c.t === "bolsa") return false;
  return c.v > 1 || c.p > 0;
}
// v407 (Raio-X U7): quem pode VENDER — conta do site (não visitante) com 7 dias ou mais
export const CONTA_DIAS_VENDER = 7;
export function podeVender(conta, agora = Date.now()) {
  if (!conta) return { erro: "Conta não encontrada." };
  if (conta.isGuest) return { erro: "Para vender na feira é preciso ter uma conta do site (visitante só compra)." };
  const dias = (agora - new Date(conta.createdAt).getTime()) / 864e5;
  if (!(dias >= CONTA_DIAS_VENDER)) return { erro: `Para vender na feira a conta precisa ter ${CONTA_DIAS_VENDER} dias. Faltam ${Math.max(1, Math.ceil(CONTA_DIAS_VENDER - dias))} dia(s)!` };
  return { ok: true };
}
// v407 (Raio-X U7): teto de tostões RECOLHIDOS por dia (por conta), pelo nível de quem vende — segura a troca de
// tostões entre contas do mesmo dono. Nível 30: 180 mil; 100: 2 milhões; 300: 18 milhões.
export const tetoColetaDia = (nivel) => Math.max(100_000, Math.round((Number(nivel) || 1) ** 2 * 200));
// das vendas a recolher (mais antigas primeiro), quais cabem no que ainda falta do teto de hoje.
// Se hoje ainda não recolheu nada, a primeira venda sempre sai (uma venda maior que o teto não fica presa para sempre).
export function vendasQueCabem(vendas, jaHoje, teto) {
  const ordem = [...vendas].sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm));
  const sai = []; let soma = jaHoje || 0;
  for (const v of ordem) {
    const r = recebeVendedor(v.total);
    if (soma + r > teto && !(soma === 0 && sai.length === 0)) break;
    sai.push(v); soma += r;
  }
  return sai;
}
// v407 (Raio-X U7): o item anunciado estava no jogo da pessoa? (o servidor não guarda o inventário; olha o ÚLTIMO
// save na nuvem: mochila + armazém). `jaAnunciado` = o que a pessoa anunciou DEPOIS desse save (já saiu da mochila,
// mas o save ainda mostra). Devolve quantos ainda dá para anunciar.
export function quantosNoSave(save, itemId, refino = 0) {
  if (!save || typeof save !== "object") return 0;
  let n = 0;
  for (const lista of [save.mochila, save.armazem]) {
    if (!Array.isArray(lista)) continue;
    for (const x of lista) if (x && x.id === itemId && (Number(x.r) || 0) === refino) n += Math.max(1, Math.floor(Number(x.q) || 1));
  }
  return n;
}
export const refItem = (id) => { const c = CATALOGO[id]; return c ? Math.max(REF_ESPECIAL[id] || 0, c.v || 0, Math.round((c.p || 0) * 0.4), 1) : 0; };
export function faixaPreco(id, refino = 0) {
  const r = Math.max(0, Math.min(15, Math.floor(Number(refino) || 0)));
  const base = refItem(id) * (1 + r); // refinado vale mais (cada +1 soma o valor do item)
  return { min: Math.max(1, Math.floor(base * PRECO_MIN)), max: Math.max(1, Math.round(base * PRECO_MAX)) };
}
const inteiro = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.floor(n) : NaN; };
// confere um anúncio novo; devolve os dados limpos ou { erro }
// `nivel` = o do RANKING guardado no servidor (a rota busca; o que o jogo manda no corpo é ignorado)
export function validaAnuncio({ itemId, refino, qtd, preco, nivel } = {}) {
  const id = String(itemId || "");
  if (!vendavel(id)) return { erro: "Esse item não pode ser vendido na feira." };
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
export function validaBarraca({ vaga, titulo, cor } = {}) {
  const v = inteiro(vaga), t = inteiro(titulo), c = inteiro(cor);
  if (!(v >= 0 && v < VAGAS)) return { erro: "Escolha uma vaga da Praça da Feira." };
  if (!(t >= 0 && t < TITULOS.length)) return { erro: "Escolha um título." };
  if (!(c >= 0 && c < CORES_BARRACA)) return { erro: "Escolha uma cor." };
  return { ok: true, vaga: v, titulo: t, cor: c };
}
