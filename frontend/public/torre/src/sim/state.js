import { SAVE_KEY } from '../data/constants.js';
import { UP, KEYS } from '../data/upgrades.js';
import { BAL } from '../data/balance.js';
import { CENTER } from '../data/talents.js';
import { FLAGS } from '../data/flags.js';
import { VIVA } from '../data/viva.js';

// o protótipo Obra Viva usa um save separado, para não misturar com o modo atual
export const saveKey = () => SAVE_KEY + (FLAGS.viva ? '-viva' : '');

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
    // prestígio "Nova obra": ficam de uma obra para outra (ver sim/prestige.js)
    obra: 1, cidade: 0, pontos: 0, pontosTotal: 0, board: {}, bestAlt: 0,
    marcos: {},                   // marcos dos primeiros minutos já mostrados (ui/milestones.js)
    introSeen: false,             // Obra Viva: a abertura (história) já foi vista
    // rodada de 20 min (Obra Viva): tempo restante, encerrada, ★ já creditadas; gerentes ligados por ramo
    roundLeft: FLAGS.viva ? VIVA.round.secs : 0, roundOver: false, roundPaid: false, mgr: {}, mgrPool: 0,
    offers: [], perks: [], marksDone: 0, rushLeft: 0, // contratos de altura da rodada (sim/contracts.js)
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
    S.lv = Object.assign(fresh().lv, o.lv || {});
    S.broker = Object.assign(fresh().broker, o.broker || {});
    S.stats = Object.assign(fresh().stats, o.stats || {});
    S.board = {}; S.pontos = 0; S.ver = SAVE_VERSION; // v6: sem compras com ★ (só Reputação)
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
