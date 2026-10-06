// ===== Lenda do Campinho — FILTRO de nomes digitados (nome do time) =====
//
// v408 (dono: "Deixe o skalzinho escolher um nick, não uma lista"): o nome do time volta a ser TEXTO LIVRE, mas só
// aparece para os outros (ranking, ficha do site) se passar por aqui. Reprovado → o público vê só "Time".
// Regras (as mesmas ideias do apelido de conta do site, routes/auth.js):
//   - 3 a 24 letras; só letras, números, espaço e - _ ' . (o apelido aceita letras, números, espaço e _);
//   - nada de palavra reservada da equipe (admin, moderador, suporte... — APELIDOS_RESERVADOS do auth.js);
//   - nada de palavrão: a lista do Impostor (impostor/filtroPalavroes.js) + a daqui, com "leetspeak" (p1k4, p!c@),
//     letras repetidas (piiika) e separadores no meio (p.i.k.a, p i k a);
//   - nada de contato (telefone, @, site, zap/insta...) — público infantil.
// O MESMO filtro roda no jogo (js/online_seguro.js, entre FILTRO-NOME-INICIO e FILTRO-NOME-FIM); o teste
// test/lenda/filtroNome.test.js confere que os dois dão o mesmo resultado.
import { LISTA as PALAVROES_SITE } from "../impostor/filtroPalavroes.js";

/* FILTRO-NOME-INICIO */
// palavras proibidas INTEIRAS (comparadas palavra por palavra: "cu" não barra "Cupim", "puta" não barra "Disputa")
const NF_PALAVRAS = ["pica", "pinto", "rola", "bunda", "peido", "piroca", "pau no", "xota", "xana", "teta", "tetas", "bct", "pnc", "crl", "fdm", "bosta", "mijo", "gay", "lesbica", "traveco", "chupa", "mama", "safado", "safada", "gostosa", "gostoso", "tesao", "transa", "sexo"];
// trechos proibidos em QUALQUER lugar (também com as palavras grudadas: "skalzinhopika")
const NF_TRECHOS = ["porra", "caralh", "karalh", "krlh", "buceta", "boceta", "bucet", "xoxot", "xerec", "piroc", "pirok", "pika", "punhet", "siriric",
  "putari", "foda", "foder", "fodid", "fudid", "fuder", "merda", "cacete", "arromb", "vagabund", "babaca", "otari", "retardad", "cuzao", "cusao",
  "cuzinh", "porno", "sexy", "nazi", "hitler", "xvideo", "pqp", "vsf", "fdp", "vtnc", "tnc", "viad", "boiola", "baitola", "punheta", "fodase",
  "pornô", "estupr", "drogad", "maconh", "cocain", "suicid", "matar", "assassin"];
// equipe do site (o apelido de conta também não pode)
const NF_RESERVADOS = ["admin", "administrador", "moderador", "moderator", "staff", "suporte", "support", "sistema", "system", "root", "equipe", "oficial", "official", "educacaogamer"];
const NF_LEET = { 0: "o", 1: "i", 2: "z", 3: "e", 4: "a", 5: "s", 6: "g", 7: "t", 8: "b", 9: "g", "@": "a", $: "s", "!": "i", "|": "i", "€": "e" };
function nfSimples(s) { // minúsculas, sem acento, leetspeak trocado, v → u
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ç/g, "c").replace(/[0-9@$!|€]/g, (c) => NF_LEET[c] || c).replace(/v/g, "u"); // ("pvta": v vale u — nas duas pontas)
}
// "pika" → /p+i+k+a+/ (letras repetidas não escapam); "porra" → /p+o+r+r+a+/
const nfRx = (w, inteira) => new RegExp((inteira ? "^" : "") + [...nfSimples(w).replace(/[^a-z ]/g, "")].map((c) => (c === " " ? "" : c + "+")).join("") + (inteira ? "s*$" : ""));
let NF_RX = null;
function nfRegras(extras) {
  if (NF_RX) return NF_RX;
  const palavras = [...new Set([...NF_PALAVRAS.filter((p) => !p.includes(" ")), ...(extras || [])])];
  NF_RX = {
    palavras: palavras.map((w) => nfRx(w, true)),
    trechos: NF_TRECHOS.map((w) => nfRx(w, false)),
    pares: NF_PALAVRAS.filter((p) => p.includes(" ")).map((p) => nfRx(p, false)), // ("pau no", "coco de"...: grudadas)
    reservados: NF_RESERVADOS.map((w) => nfRx(w, false)),
  };
  return NF_RX;
}
// confere um nome digitado. Devolve { ok: true, nome } (já limpo) ou { ok: false, motivo }
function nfConfere(texto, extras) {
  const nome = String(texto == null ? "" : texto).replace(/\s+/g, " ").trim();
  if (nome.length < 3) return { ok: false, motivo: "curto" };
  if (nome.length > 24) return { ok: false, motivo: "longo" };
  if (!/^[\p{L}\p{N} _'.-]+$/u.test(nome)) return { ok: false, motivo: "simbolo" };
  if ((nome.match(/\p{L}/gu) || []).length < 2) return { ok: false, motivo: "letras" };
  if ((nome.match(/\d/g) || []).length >= 6 || /(www|http|\.com|\.br|insta|zap|whats|tiktok|discord|telegram|facebook)/i.test(nome)) return { ok: false, motivo: "contato" };
  const R = nfRegras(extras), s = nfSimples(nome);
  const junto = s.replace(/[^a-z]/g, "");
  const pedacos = s.split(/[^a-z]+/).filter(Boolean);
  // letras soltas seguidas viram uma palavra só ("C U", "p u t a")
  for (let i = 0; i < pedacos.length; i++) if (pedacos[i].length === 1) { let j = i, w = ""; while (j < pedacos.length && pedacos[j].length === 1) w += pedacos[j++]; if (j - i > 1) pedacos.push(w); i = j - 1; }
  if (R.reservados.some((rx) => rx.test(junto))) return { ok: false, motivo: "reservado" };
  if (R.trechos.some((rx) => rx.test(junto)) || R.pares.some((rx) => rx.test(junto))) return { ok: false, motivo: "palavrao" };
  if (pedacos.some((p) => R.palavras.some((rx) => rx.test(p)))) return { ok: false, motivo: "palavrao" };
  return { ok: true, nome };
}
/* FILTRO-NOME-FIM */

// a lista de palavrões do site (Impostor) entra como palavras inteiras
export const confereNome = (texto) => nfConfere(texto, PALAVROES_SITE);
export const nomeAprovado = (texto) => { const r = confereNome(texto); return r.ok ? r.nome : null; };
export const NOME_MAX = 24;
