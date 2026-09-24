import { temPalavrao } from "./filtroPalavroes.js";

// O IMPOSTOR — regras puras (sem estado, sem socket, sem banco).
//
// Tudo o que decide quem ganha e quanto cada um leva mora aqui, separado da
// sala, pra dar pra testar cada regra sozinha.

export const MAX_DICA = 24;

// Os modos de jogo. "palavra" é o original (palavra do banco); os outros
// usam o conteúdo fixo de conteudoModos.js.
export const MODOS = ["palavra", "situacao", "pergunta", "historia"];

// Limites do texto que cada modo pede (vão no estado, pro cliente mostrar
// o contador). `palavras` = máximo de palavras (sem campo = livre).
export const LIMITES = {
  palavra: { caracteres: MAX_DICA, palavras: 1 },   // dica
  situacao: { caracteres: 40, palavras: 3 },        // dica de até 3 palavras
  historia: { caracteres: 120 },                     // uma frase da história
  pergunta: { caracteres: 60 },                      // resposta à pergunta
};

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
//
// `modo` "situacao" aceita até 3 palavras (LIMITES) e o segredo é uma frase
// ("Na fila do SUS"): aí vale a mesma regra das compostas, com as palavras
// importantes da situação ("fila", "sus") proibidas na dica.
export function validarDica(texto, palavra, modo = "palavra") {
  const lim = LIMITES[modo] || LIMITES.palavra;
  const dica = String(texto ?? "").replace(/\s+/g, " ").trim();
  if (!dica) return { erro: "Escreva uma dica." };
  if (dica.length > lim.caracteres) return { erro: `A dica pode ter no máximo ${lim.caracteres} letras.` };
  const nPalavras = dica.split(" ").length;
  if (lim.palavras === 1 && nPalavras > 1) return { erro: "A dica é uma palavra só." };
  if (nPalavras > lim.palavras) return { erro: `A dica pode ter no máximo ${lim.palavras} palavras.` };
  if (!/[\p{L}\p{N}]/u.test(dica)) return { erro: "Escreva uma palavra de verdade." };
  if (temPalavrao(dica)) return { erro: "Essa dica não é permitida." };
  if (palavra) {
    const d = colado(dica);
    const p = colado(palavra);
    if (p && d.includes(p)) return { erro: "A dica não pode ter a palavra secreta." };
    const frase = modo !== "palavra";
    if (usaPedacoDaComposta(dica, palavra, frase ? { vazias: PALAVRAS_VAZIAS, sempre: true } : {})) {
      return { erro: frase ? "A dica não pode usar palavras da situação." : "A dica não pode usar parte da palavra secreta." };
    }
  }
  return { dica };
}

// Uma frase da HISTÓRIA (modo "historia"). Mesmo raciocínio da dica: pro
// impostor, `tema` é null (sem oráculo). Pros outros, as palavras do tema
// com 4+ letras ("viagem", "praia" em "Uma viagem à praia") não podem
// aparecer — senão a história entrega o tema de bandeja pro impostor.
// Palavras de 3 letras ficam livres de propósito: "dia" ou "mar" num tema
// barrariam frases demais.
export function validarFrase(texto, tema) {
  const max = LIMITES.historia.caracteres;
  const frase = String(texto ?? "").replace(/\s+/g, " ").trim();
  if (!frase) return { erro: "Escreva uma frase." };
  if (frase.length > max) return { erro: `A frase pode ter no máximo ${max} letras.` };
  if (!/[\p{L}]/u.test(frase)) return { erro: "Escreva uma frase de verdade." };
  if (temPalavrao(frase)) return { erro: "Essa frase não é permitida." };
  if (tema) {
    const t = colado(tema);
    if (t && colado(frase).includes(t)) return { erro: "A frase não pode ter o tema da história." };
    if (usaPedacoDaComposta(frase, tema, { vazias: PALAVRAS_VAZIAS, sempre: true, minLetras: 4 })) {
      return { erro: "A frase não pode usar palavras do tema da história." };
    }
  }
  return { frase };
}

// Resposta do modo "pergunta": texto curto livre. Não tem regra de
// "segredo" (é a resposta de uma pergunta), só tamanho e palavrão.
export function validarResposta(texto) {
  const max = LIMITES.pergunta.caracteres;
  const resposta = String(texto ?? "").replace(/\s+/g, " ").trim();
  if (!resposta) return { erro: "Escreva uma resposta." };
  if (resposta.length > max) return { erro: `A resposta pode ter no máximo ${max} letras.` };
  if (!/[\p{L}\p{N}]/u.test(resposta)) return { erro: "Escreva uma resposta de verdade." };
  if (temPalavrao(resposta)) return { erro: "Essa resposta não é permitida." };
  return { resposta };
}

// Palavra composta ("pão de queijo", "guarda-chuva"): cada pedaço com 3+
// letras, sem os conectores, também é proibido como dica. A comparação é
// com as PALAVRAS INTEIRAS da dica (separadas por hífen), não "contém" —
// senão "melodia" cairia por causa do "dia" de "dia das crianças". Aceita
// plural simples nos dois sentidos: "queijos" x "queijo", "lata" x "latas".
const CONECTORES = new Set(["de", "da", "do", "das", "dos", "sem"]);

// Nas frases (situação, tema de história) há mais palavras "vazias" que
// não contam como pedaço do segredo ("Numa festa de aniversário": só
// "festa" e "aniversario" são proibidas).
const PALAVRAS_VAZIAS = new Set([
  ...CONECTORES, "na", "no", "nas", "nos", "num", "numa", "nuns", "numas", "em", "um", "uma",
  "uns", "umas", "o", "a", "os", "as", "e", "com", "para", "pra", "pro", "pela", "pelo", "ao",
  "que", "dum", "duma", "sua", "seu", "meu", "minha",
]);

// `sempre`: nas frases, o segredo de uma palavra só ("No banco" → "banco")
// também conta. No modo Palavra isso já é coberto pelo "contém" lá em cima.
function usaPedacoDaComposta(dica, palavra, { vazias = CONECTORES, sempre = false, minLetras = 3 } = {}) {
  const pedacos = normalizar(palavra).split(/[\s-]+/).map(colado);
  if (pedacos.length < 2 && !sempre) return false;
  const proibidos = pedacos.filter((p) => p.length >= minLetras && !vazias.has(p));
  const partesDaDica = normalizar(dica).split(/[\s-]+/).map(colado).filter(Boolean);
  const mesma = (a, b) => a === b || a === `${b}s` || b === `${a}s`;
  return partesDaDica.some((d) => proibidos.some((p) => mesma(d, p)));
}

// O texto da vez nos modos com turno (palavra/situação = dica, história =
// frase). Devolve { texto } ou { erro }. Usado pela sala e pelos bots.
export function validarTextoDaVez(modo, texto, segredo) {
  if (modo === "historia") {
    const r = validarFrase(texto, segredo);
    return r.erro ? r : { texto: r.frase };
  }
  const r = validarDica(texto, segredo, modo);
  return r.erro ? r : { texto: r.dica };
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
