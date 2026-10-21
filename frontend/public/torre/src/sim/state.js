import { SAVE_KEY } from '../data/constants.js';
import { UP, KEYS } from '../data/upgrades.js';
import { BAL } from '../data/balance.js';
import { CENTER } from '../data/talents.js';
import { FLAGS } from '../data/flags.js';
import { VIVA } from '../data/viva.js';
import { TIPS } from '../data/tips.js';
import { t } from '../i18n.js';

// o protótipo Obra Viva usa um save separado, para não misturar com o modo atual
// Obra Viva: 3 espaços de save; o 1 é a chave de sempre (o save de antes vira o espaço 1 sem conversão)
const SLOT_KEY = 'torre-infinita-espaco';
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
// o espaço desta aba fica guardado aqui (lido uma vez); a chave do localStorage só lembra o último espaço usado.
// Assim outra aba que troca de espaço não faz esta gravar no lugar errado.
let slot = null;
export const activeSlot = () => { if (!FLAGS.viva) return 1; if (slot == null) { const n = Number(lsGet(SLOT_KEY)); slot = n === 2 || n === 3 ? n : 1; } return slot; };
// torre única: save próprio; '-risco2' desde 21/10/2026 (o usuário pediu para zerar os saves de todo mundo: os de '-risco'
// ficam esquecidos no navegador, sem uso)
const keyOf = n => SAVE_KEY + (FLAGS.viva ? '-viva' + (n > 1 ? '-' + n : '') : '') + (FLAGS.risco ? '-risco2' : '');
export const saveKey = () => keyOf(activeSlot());

export const SAVE_VERSION = 6;

export function fresh() {
  const lv = {};
  KEYS.forEach(k => lv[k] = UP[k].start || 0);
  return {
    ver: SAVE_VERSION,
    money: FLAGS.viva ? VIVA.startMoney : BAL.startMoney, floors: 0, ground: 10, top: 0, lv, last: Date.now(), era: 0,
    maxAlt: 0,                    // altura recorde (m) — dá Pontos de Engenharia e libera tipos
    // imóveis: andares [0, assigned) já têm destino; [assigned, floor(floors)) estão prontos esperando
    assigned: 0, rented: 0, sold: 0,
    rentBase: 0,                  // soma do aluguel-base dos andares alugados (antes dos multiplicadores)
    typeSegs: [[0, 'apto']],      // [índice do andar, tipo] — tipo escolhido a partir daquele andar
    typeCount: {},                // andares com destino, por tipo
    broker: { on: true, sellPct: FLAGS.viva ? VIVA.autoSellPct : 30, acc: 0 },
    // banco
    debt: 0, inDefault: false,
    // árvore de Engenharia
    tree: { [CENTER]: true }, peSpent: 0, peBonus: 0,
    stats: { saleTotal: 0, tourTotal: 0, interestTotal: 0 },
    won: false,                   // Obra Viva: já chegou à Órbita (fim do jogo, tela de parabéns uma vez)
    winSeen: false,               // a tela de parabéns já foi mostrada
    playTime: 0,                  // segundos de jogo ativo (para a tela de parabéns)
    policy: {},                   // Obra Viva: política de imóveis por era ('sell' = vender; padrão alugar)
    obra: 1, cidade: 0, pontosTotal: 0, bestAlt: 0, // Reputação (pontos internos) e recorde da campanha
    marcos: {},                   // marcos dos primeiros minutos já mostrados (ui/milestones.js)
    introSeen: false,             // Obra Viva: a abertura (história) já foi vista
    altTotal: 0,                  // soma das alturas de todas as obras entregues (ranking "recorde total")
    orbitaSec: 0,                 // segundos de jogo até a primeira Órbita (ranking)
    rank: { jogador: '', apelido: '', ativo: false, nao: false, ficha: '', fichaObra: 0, enviado: {} }, // ranking online (ui/ranking.js)
    roundLeft: FLAGS.viva ? VIVA.round.secs : 0, roundOver: false, // relógio do ano da torre única (sim/prestige.js)
    dicas: {},                    // dicas para quem começa já vistas (ui/tips.js)
    jornais: [],                  // capas de jornal dos marcos de andares já noticiados (ui/jornal.js)
    marcosAlt: [],                // marcos depois da Órbita já alcançados na campanha (VIVA.marcosOrbita)
  };
}

// Estado do jogo. `export let` é live binding: quem importa vê a troca feita por load()/resetState().
export let S = fresh();

// Devolve a versão do save carregado (0 se não havia save)
export function load() {
  try {
    const raw = localStorage.getItem(saveKey());
    if (!raw) return 0;
    const o = JSON.parse(raw);
    // formato antigo: guarda uma cópia intacta antes de qualquer conversão (uma vez por versão)
    if ((o.ver || 1) < SAVE_VERSION) {
      const bk = saveKey() + '-backup-v' + (o.ver || 1);
      if (!localStorage.getItem(bk)) localStorage.setItem(bk, raw);
    }
    const f = fresh();
    // Obra Viva antes das rodadas (v<5): a campanha começa do zero; ficam só a abertura vista e os marcos
    if (FLAGS.viva && (o.ver || 1) < 5) { S = Object.assign(f, { introSeen: !!o.introSeen, marcos: o.marcos || {} }); return o.ver || 1; }
    S = Object.assign(f, o);
    if (!('altTotal' in o)) S.altTotal = o.bestAlt || 0;
    S.rank = Object.assign(fresh().rank, o.rank || {});
    if (FLAGS.viva && !('dicas' in o) && (o.floors > 0 || (o.obra || 1) > 1)) S.dicas = Object.fromEntries(Object.keys(TIPS).map(k => [k, true])); // quem já joga não vê as dicas de começo
    S.lv = Object.assign(fresh().lv, o.lv || {});
    S.broker = Object.assign(fresh().broker, o.broker || {});
    S.stats = Object.assign(fresh().stats, o.stats || {});
    S.ver = SAVE_VERSION;
    return o.ver || 1;
  } catch (e) { return 0; /* save corrompido ou storage bloqueado: começa do zero */ }
}

export function save() {
  S.last = Date.now();
  try { localStorage.setItem(saveKey(), JSON.stringify(S)); } catch (e) { }
}

export function resetState() {
  S = fresh();
  save();
}

// Para testes e para o robô de balanceamento
export function setState(o) { S = o; }

// ---------- espaços de save (Obra Viva) ----------
// troca de espaço: grava o atual e carrega o outro (vazio = partida nova, só gravada quando o jogo salvar)
export function setSlot(n) {
  if (!FLAGS.viva || ![1, 2, 3].includes(n)) return;
  save();
  slot = n; lsSet(SLOT_KEY, String(n));
  if (!load()) S = fresh();
}
// resumo de um espaço (null = vazio)
export function slotSummary(n) {
  const raw = lsGet(keyOf(n));
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (o.vazio) return null; // espaço apagado (a partida em branco que o jogo salva sozinho não conta)
    return { torre: o.riscoTentativa || 1, ano: (o.risco && o.risco.ano) || 1, bestAlt: Math.max(o.bestAlt || 0, o.maxAlt || 0), pontosTotal: o.pontosTotal || 0, won: !!o.won, last: o.last || 0 };
  } catch (e) { return null; }
}
// apaga o espaço; devolve o jogador do ranking que estava nele (para tirar o apelido do ranking)
export function deleteSlot(n) {
  let jogador = '';
  try { const o = JSON.parse(lsGet(keyOf(n)) || 'null'); jogador = (o && o.rank && (o.rank.ativo || o.rank.apelido) && o.rank.jogador) || ''; } catch (e) { }
  if (n === activeSlot() && S.rank && (S.rank.ativo || S.rank.apelido)) jogador = S.rank.jogador || jogador;
  try { localStorage.removeItem(keyOf(n)); } catch (e) { }
  if (n === activeSlot()) { S = fresh(); S.vazio = true; } // até o jogador começar a jogar
  return jogador;
}
export const exportSave = () => JSON.stringify(S);
// importa um save (texto JSON) para o espaço n; confere antes de gravar e não mexe no espaço se recusar
export function importSave(texto, n) {
  let o;
  try { o = JSON.parse(texto); } catch (e) { return { ok: false, erro: t('O arquivo não é um save da Torre Infinita.') }; }
  const okNum = v => typeof v === 'number' && Number.isFinite(v);
  if (!o || typeof o !== 'object' || !okNum(o.ver) || !o.lv || typeof o.lv !== 'object' || !okNum(o.floors) || !okNum(o.money) || (o.obra != null && !okNum(o.obra)) || (o.roundLeft != null && !okNum(o.roundLeft)))
    return { ok: false, erro: t('O arquivo não é um save da Torre Infinita.') };
  if (o.ver > SAVE_VERSION) return { ok: false, erro: t('Esse save é de uma versão mais nova do jogo.') };
  if (FLAGS.viva && o.ver < 5) return { ok: false, erro: t('Esse save é de uma versão antiga do jogo (antes dos contratos de 365 dias) e não pode ser importado.') };
  const antes = lsGet(keyOf(n)); if (antes) lsSet(keyOf(n) + '-antes-importar', antes); // cópia do que havia no espaço
  lsSet(keyOf(n), JSON.stringify(o));
  if (n === activeSlot()) load();
  return { ok: true };
}
