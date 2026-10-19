// Página Árvore: resumo de pontos, anéis e bônus ativos
import { NODES, RINGS, STAT_LABEL, ringEraName } from '../data/talents.js';
import { S } from '../sim/state.js';
import { mods } from '../sim/mods.js';
import { peAvailable, nextPeAlt, ringOpen, owned } from '../sim/talents.js';
import { $, setText, setHTML } from './dom.js';
import { fmtM } from './format.js';

const num = v => (Math.round(v * 100) / 100).toString().replace('.', ',');
const REDUCE = new Set(['fcost', 'interest', 'cost_obra', 'cost_forn', 'cost_log', 'cost_eng', 'cost_merc']);

export function updateTalentPanel() {
  setText($('a-pe'), String(peAvailable()));
  setText($('a-next'), `Os pontos vêm da altura recorde da torre. Próximo ponto em ${fmtM(nextPeAlt(S.maxAlt))}.`);
  const n = Object.keys(S.tree).filter(owned).length - 1;
  setText($('a-count'), `${n} de ${Object.keys(NODES).length - 1}`);
  let open = 0; for (let k = 1; k <= RINGS; k++) if (ringOpen(k)) open = k;
  setText($('a-rings'), open < RINGS ? `${open} de ${RINGS} · próximo na era ${ringEraName(open + 1)}` : `${RINGS} de ${RINGS}`);

  const M = mods(), rows = [];
  Object.keys(STAT_LABEL).forEach(s => {
    if (s === 'offline') return;
    const m = M.mult(s);
    if (Math.abs(m - 1) < 1e-6) return;
    const v = REDUCE.has(s) ? `−${Math.round((1 - m) * 100)}%` : `×${num(m)}`;
    rows.push(`<li><span>${STAT_LABEL[s]}</span><b>${v}</b></li>`);
  });
  const off = M.plus('offline');
  if (off) rows.push(`<li><span>progresso offline</span><b>+${num(off / 3600)} h</b></li>`);
  Object.keys(S.tree).forEach(id => {
    const nd = NODES[id];
    if (nd && nd.kind === 'key' && owned(id)) rows.push(`<li class="key"><span>◆ ${nd.name}</span></li>`);
  });
  setHTML($('a-bonus'), rows.length ? rows.join('') : '<li class="none">Nenhum ainda. Abra o mapa e aprenda o primeiro nó.</li>');
}
