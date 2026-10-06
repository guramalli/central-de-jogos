// ===== Lenda do Campinho — validação do que o jogo manda pro servidor =====
//
// O jogo roda inteiro no navegador. O servidor só guarda duas coisas:
//   - o SAVE (comprimido pelo próprio jogo: gzip em base64). O servidor não
//     abre o conteúdo — só confere tamanho e formato;
//   - a CASA publicada (móveis e itens expostos), que os outros jogadores
//     veem ao passar na porta e ao visitar.
//
// Tudo aqui é função pura (sem banco), pra ser testado em test/lenda/.
import { lePartesTime, nomeTimePublico } from "./times.js";
// Os limites são folgados pro jogo normal e apertados pra quem tentar
// mandar lixo.

export const LIMITES = {
  saveMaxChars: 90_000, // save comprimido em base64 (o express.json aceita até 100 kB)
  nivelMax: 999,
  xpMax: 1_000_000_000_000_000, // 10^15 (o nível 999 fica bem abaixo disso)
  moveisMax: 150,
  itensMax: 150,
  vitrineMax: 3,
  coordMax: 40,
  refinoMax: 10,
  prestigioMax: 100_000,
};

const RE_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const RE_MAPA = /^[a-z]{2,12}$/;
const RE_CASA = /^casa_([a-z]{2,12})_(\d{1,2})$/;
const RE_MOVEL = /^mv_[a-z_]{2,30}$/;
const RE_ITEM = /^[a-z0-9_]{2,40}$/;

const inteiro = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

export function validarSave(body) {
  const { dados, nivel } = body || {};
  if (typeof dados !== "string" || !dados.length) return { erro: "Save vazio." };
  if (dados.length > LIMITES.saveMaxChars) return { erro: "Save grande demais." };
  if (!RE_BASE64.test(dados)) return { erro: "Save em formato inválido." };
  if (!inteiro(nivel, 1, LIMITES.nivelMax)) return { erro: "Nível inválido." };
  return { ok: true, dados, nivel };
}

function coordOk(o) {
  return o && inteiro(o.x, 0, LIMITES.coordMax) && inteiro(o.y, 0, LIMITES.coordMax);
}

export function validarCasa(body) {
  const { casaId, mapa, moveis, itens, vitrine, prestigio } = body || {};
  const m = typeof casaId === "string" ? casaId.match(RE_CASA) : null;
  if (!m) return { erro: "Casa inválida." };
  if (typeof mapa !== "string" || !RE_MAPA.test(mapa) || m[1] !== mapa) return { erro: "Lugar da casa inválido." };
  if (!Array.isArray(moveis) || moveis.length > LIMITES.moveisMax) return { erro: "Móveis inválidos." };
  if (!Array.isArray(itens) || itens.length > LIMITES.itensMax) return { erro: "Itens inválidos." };
  if (!Array.isArray(vitrine) || vitrine.length > LIMITES.vitrineMax) return { erro: "Vitrine inválida." };
  if (!inteiro(prestigio, 0, LIMITES.prestigioMax)) return { erro: "Prestígio inválido." };

  const ocupado = new Set();
  const moveisOk = [];
  for (const mv of moveis) {
    if (!coordOk(mv) || typeof mv.id !== "string" || !RE_MOVEL.test(mv.id)) return { erro: "Móvel inválido." };
    const k = mv.x + "," + mv.y;
    if (ocupado.has(k)) return { erro: "Dois móveis no mesmo lugar." };
    ocupado.add(k);
    moveisOk.push({ x: mv.x, y: mv.y, id: mv.id });
  }
  const itemNoLugar = new Set();
  const itensOk = [];
  for (const it of itens) {
    if (!coordOk(it) || typeof it.id !== "string" || !RE_ITEM.test(it.id)) return { erro: "Item inválido." };
    const r = it.r == null ? 0 : it.r;
    if (!inteiro(r, 0, LIMITES.refinoMax)) return { erro: "Refino inválido." };
    const k = it.x + "," + it.y;
    if (itemNoLugar.has(k)) return { erro: "Dois itens no mesmo lugar." };
    itemNoLugar.add(k);
    itensOk.push({ x: it.x, y: it.y, id: it.id, r });
  }
  const vitrineOk = [];
  for (const v of vitrine) {
    if (!v || typeof v.id !== "string" || !RE_ITEM.test(v.id)) return { erro: "Vitrine inválida." };
    const r = v.r == null ? 0 : v.r;
    if (!inteiro(r, 0, LIMITES.refinoMax)) return { erro: "Vitrine inválida." };
    vitrineOk.push({ id: v.id, r });
  }
  return { ok: true, casa: { casaId, mapa, moveis: moveisOk, itens: itensOk, vitrine: vitrineOk, prestigio } };
}

// Resumo do progresso pro ranking online. Só números e nomes curtos; o nome
// mostrado vem da conta (apelido), então o do personagem nem é aceito aqui.
const FASES_VALIDAS = new Set(["Criança", "Juvenil", "Sub-20", "Profissional", "Lenda"]);
const RE_POSICAO = /^[a-z_]{2,20}$/;
export function validarRanking(body) {
  const { nivel, xp, posicao, fase, time, chefes = 0, figs = 0 } = body || {};
  if (!inteiro(nivel, 1, LIMITES.nivelMax)) return { erro: "Nível inválido." };
  // o XP total passa de 2 bilhões por volta do nível 355 (no 481 são ~7,2 bilhões): limite folgado e ainda exato em número JS
  if (!inteiro(xp, 0, LIMITES.xpMax)) return { erro: "XP inválido." };
  if (posicao != null && (typeof posicao !== "string" || !RE_POSICAO.test(posicao))) return { erro: "Posição inválida." };
  if (!FASES_VALIDAS.has(fase)) return { erro: "Fase inválida." };
  if (!inteiro(chefes, 0, 100_000) || !inteiro(figs, 0, 100_000)) return { erro: "Números inválidos." };
  let timeOk = null;
  if (time != null) {
    // v408 (dono: "deixe o skalzinho escolher um nick"): o nome DIGITADO vale se passar no filtro (filtroNome.js);
    // reprovado (ou grande demais) fica sem nome — o envio do ranking não é recusado por causa do nome.
    // As partes da lista (v407) continuam valendo para quem escolheu da lista.
    if (typeof time !== "object" || !inteiro(time.div, 0, 50) || !inteiro(time.titulos ?? 0, 0, 100_000)) return { erro: "Time inválido." };
    const partes = lePartesTime(time.partes) ? time.partes : null;
    const digitado = typeof time.nome === "string" && time.nome.length <= 60 ? time.nome : null;
    timeOk = { partes, nome: nomeTimePublico({ nome: digitado, partes }), div: time.div, titulos: time.titulos ?? 0 };
  }
  // v388: as habilidades treinadas (opcional; jogo antigo não manda) — números de 0 a SKILL_MAX
  let skills = null;
  const sk = body?.skills;
  if (sk != null) {
    if (typeof sk !== "object" || !SKILLS_RANK.every((k) => inteiro(sk[k] ?? 0, 0, SKILL_MAX))) return { erro: "Habilidades inválidas." };
    skills = Object.fromEntries(SKILLS_RANK.map((k) => [k, sk[k] ?? 0]));
  }
  return { ok: true, ranking: { nivel, xp, posicao: posicao ?? null, fase, time: timeOk, chefes, figs }, skills };
}
export const SKILLS_RANK = ["drible", "chute", "defesa", "visao"];
export const SKILL_MAX = 1000;

// ---------- v407 (Raio-X U7): o ranking confere se o progresso é possível ----------
// A MESMA curva do jogo (js/game.js, xpPara): XP total para ESTAR no nível L. Se o jogo mudar a curva, mude aqui também
// (senão todo mundo vira "suspeito" — o painel mostra o motivo, e nada é apagado).
export function xpPara(L) {
  if (L <= 1) return 0;
  const base = (50 / 9) * (L * L * L - 6 * L * L + 17 * L - 12);
  const extra = L > 50 ? 1 + (L - 50) / 40 : 1;
  return Math.round(base * extra);
}
export const xpDoNivel = (L) => Math.max(1, xpPara(L + 1) - xpPara(L));
// folgas: bem largas para o jogo normal (missões, chefões, prêmios de guilda e eventos dão XP de uma vez)
export const PROGRESSO = {
  niveisPorHora: 30,      // ganho máximo por hora até o nível 100: o XP de 30 níveis do nível em que estava
  // v409 (dono: "eu e o Skal não aparecemos no ranking"): no alto o 5/hora era apertado demais — com o balanço v407 cada
  // andar NOVO da Torre dá 0,35 (de 10 em 10: 0,8) do XP do nível, repetir andar dá XP 3×/dia, Ecos e missões também
  // vêm em lotes. Agora nunca menos de 20 níveis/hora, mais um LOTE de 5 níveis por envio.
  niveisPorHoraMin: 20,
  loteNiveis: 5,          // + o XP de 5 níveis de uma vez (prêmio grande que cai entre dois envios)
  absurdo: 10,            // ganho 10× acima do máximo = impossível jogando (só este, e XP fora da curva, escondem a conta)
  folgaHoras: 0.25,       // + 15 min de folga (relógios, salvamento atrasado)
  xpFolga: 2000,          // + um tanto fixo (os primeiros níveis)
  nivelLivre: 50,         // personagem sem linha no ranking: até este nível entra sem conferir a idade da conta
  niveisPorEnvio: 60,     // nunca sobe mais que isto de um envio para o outro
};
export const niveisPorHora = (nivel) => Math.max(PROGRESSO.niveisPorHoraMin, (PROGRESSO.niveisPorHora * 100) / Math.max(100, nivel));
// primeiro envio de um personagem já crescido (jogou sem conta e depois entrou): a conta precisa ter pelo menos
// estas horas de vida (bem menos do que o jogo leva de verdade: nível 100 → 2 h; 300 → 18 h; 600 → 72 h)
export const horasMinimas = (nivel) => 0.5 * (nivel / 50) ** 2;
// Confere um envio do ranking contra a curva e contra o envio anterior (ou a idade da conta, no primeiro).
// `antes` = { nivel, xp, atualizadoEm } | null; `contaDesde` = criação da conta. Devolve { ok } ou { ok: false, motivo, detalhe }.
export function conferirProgresso({ nivel, xp }, antes, contaDesde, agora = Date.now()) {
  // 1) o XP bate com o nível?
  if (xp < xpPara(nivel) - 1 || (nivel < LIMITES.nivelMax && xp > xpPara(nivel + 1))) {
    return { ok: false, motivo: "xp_fora_da_curva", detalhe: `nível ${nivel} com ${xp} de XP (esse nível vai de ${xpPara(nivel)} a ${xpPara(nivel + 1) - 1})` };
  }
  // 2) ganhou rápido demais desde o último envio (ou, no primeiro, desde que a conta foi criada)?
  const ref = antes && Number.isFinite(Number(antes.xp)) ? { nivel: antes.nivel, xp: Number(antes.xp), t: new Date(antes.atualizadoEm).getTime() } : null;
  if (!ref) {
    if (nivel <= PROGRESSO.nivelLivre) return { ok: true };
    const idade = contaDesde ? (agora - new Date(contaDesde).getTime()) / 3600e3 : 0;
    if (idade < horasMinimas(nivel)) return { ok: false, motivo: "xp_rapido_demais", detalhe: `primeiro envio já no nível ${nivel} com a conta criada há ${idade.toFixed(1)} h (mínimo ${horasMinimas(nivel).toFixed(1)} h)` };
    return { ok: true };
  }
  const base = ref;
  if (xp <= base.xp) return { ok: true }; // ficou igual ou começou outro personagem
  const horas = Math.max(0, (agora - (Number.isFinite(base.t) ? base.t : agora)) / 3600e3);
  const maxGanho = xpDoNivel(Math.max(1, base.nivel)) * (niveisPorHora(base.nivel) * (horas + PROGRESSO.folgaHoras) + PROGRESSO.loteNiveis) + PROGRESSO.xpFolga;
  if (xp - base.xp > maxGanho) {
    const detalhe = `+${Math.round(xp - base.xp)} de XP em ${horas.toFixed(2)} h (máximo ${Math.round(maxGanho)}), nível ${base.nivel} → ${nivel}`;
    return { ok: false, motivo: xp - base.xp > maxGanho * PROGRESSO.absurdo ? "xp_absurdo" : "xp_rapido_demais", detalhe };
  }
  if (ref && nivel - ref.nivel > PROGRESSO.niveisPorEnvio) {
    return { ok: false, motivo: "nivel_pulou", detalhe: `nível ${ref.nivel} → ${nivel} de uma vez` };
  }
  return { ok: true };
}

// Quais casas mostrar num lugar: algumas das mais prestigiadas (as "vitrines"
// que valem a visita) + um sorteio entre as outras, pra todo mundo ter chance
// de ser visto. `lista` já vem do banco; `sortear` é injetável pra teste.
export function escolherCasas(lista, { excluir = null, limite = 6, topo = 2, sortear = Math.random } = {}) {
  const candidatas = lista.filter((c) => c.userId !== excluir);
  const porPrestigio = [...candidatas].sort((a, b) => b.prestigio - a.prestigio);
  const escolhidas = porPrestigio.slice(0, Math.min(topo, limite));
  const resto = porPrestigio.slice(escolhidas.length);
  while (escolhidas.length < limite && resto.length) {
    const i = Math.floor(sortear() * resto.length) % resto.length;
    escolhidas.push(resto.splice(i, 1)[0]);
  }
  return escolhidas;
}
