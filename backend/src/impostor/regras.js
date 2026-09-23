import { ehPalavrao } from "./filtroPalavroes.js";

// O IMPOSTOR — regras puras (sem estado, sem socket, sem banco).
//
// Tudo o que decide quem ganha e quanto cada um leva mora aqui, separado da
// sala, pra dar pra testar cada regra sozinha.

export const MAX_DICA = 24;

// Pontuação (spec, seção 2). Entra direto no ranking mensal, sem divisor.
export const PONTOS = {
  votouNoImpostor: 150,   // tripulante que votou no impostor
  vitoriaTripulante: 50,  // extra pra cada tripulante quando eles vencem
  impostorNaoDescoberto: 300,
  impostorAdivinhou: 200, // descoberto, mas acertou a palavra na última chance
};

// Minúsculas, sem acento, sem espaços nas pontas. É a comparação do chute
// da última chance ("  Práia " casa com "PRAIA").
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Versão "colada" (sem espaço, hífen nem pontuação) pra checar se a dica
// esconde a palavra: "guarda sol", "guarda-sol" e "guardasol" viram a mesma coisa.
function colado(texto) {
  return normalizar(texto).replace(/[^a-z0-9]/g, "");
}

export function chuteCorreto(chute, palavra) {
  const c = normalizar(chute);
  return c.length > 0 && c === normalizar(palavra);
}

// Valida a dica. Devolve { dica } limpa ou { erro }.
//
// `palavra` é null quando quem escreve é o IMPOSTOR, e isso é de propósito:
// se a sala recusasse a dica do impostor por "conter a palavra", ele poderia
// chutar dicas até uma ser recusada — e aí saberia a palavra. Pro impostor
// valem só as regras que não dependem dela.
export function validarDica(texto, palavra) {
  const dica = String(texto ?? "").replace(/\s+/g, " ").trim();
  if (!dica) return { erro: "Escreva uma dica." };
  if (dica.length > MAX_DICA) return { erro: `A dica pode ter no máximo ${MAX_DICA} letras.` };
  if (/\s/.test(dica)) return { erro: "A dica é uma palavra só." };
  if (!/[\p{L}\p{N}]/u.test(dica)) return { erro: "Escreva uma palavra de verdade." };
  if (ehPalavrao(dica)) return { erro: "Essa dica não é permitida." };
  if (palavra) {
    const d = colado(dica);
    const p = colado(palavra);
    if (p && d.includes(p)) return { erro: "A dica não pode ter a palavra secreta." };
  }
  return { dica };
}

// Conta os votos e diz quem foi acusado.
//   votos: Map(eleitorId -> alvoId)
//   candidatos: ids que ainda estão na partida (voto em quem saiu não conta)
// Empate no topo, ou ninguém votou: acusadoId = null e empate = true.
export function apurarVotos(votos, candidatos) {
  const validos = new Set(candidatos);
  const contagem = new Map(candidatos.map((id) => [id, 0]));
  for (const [eleitor, alvo] of votos) {
    if (!validos.has(eleitor) || !validos.has(alvo) || eleitor === alvo) continue;
    contagem.set(alvo, contagem.get(alvo) + 1);
  }
  const max = Math.max(0, ...contagem.values());
  const topo = [...contagem.entries()].filter(([, n]) => n === max).map(([id]) => id);
  const empate = max === 0 || topo.length > 1;
  return {
    contagem: [...contagem.entries()]
      .map(([id, n]) => ({ id, votos: n }))
      .sort((a, b) => b.votos - a.votos),
    acusadoId: empate ? null : topo[0],
    empate,
  };
}

// Decide o vencedor a partir do que aconteceu.
//   descoberto: o acusado era o impostor
//   adivinhou: (só vale se descoberto) acertou a palavra na última chance
export function decidirVencedor({ descoberto, adivinhou }) {
  if (!descoberto) return "impostor";
  return adivinhou ? "impostor" : "tripulantes";
}

// Pontos da partida por jogador.
//   jogadores: ids de quem terminou a partida
//   votos: Map(eleitorId -> alvoId)
export function calcularPontuacao({ jogadores, impostorId, votos, descoberto, adivinhou }) {
  const vencedor = decidirVencedor({ descoberto, adivinhou });
  const pontos = {};
  for (const id of jogadores) {
    let p = 0;
    if (id === impostorId) {
      if (!descoberto) p += PONTOS.impostorNaoDescoberto;
      else if (adivinhou) p += PONTOS.impostorAdivinhou;
    } else {
      if (votos.get(id) === impostorId) p += PONTOS.votouNoImpostor;
      if (vencedor === "tripulantes") p += PONTOS.vitoriaTripulante;
    }
    pontos[id] = p;
  }
  return { vencedor, pontos };
}

// Fisher-Yates. `aleatorio` injetável pros testes.
export function embaralhar(lista, aleatorio = Math.random) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
