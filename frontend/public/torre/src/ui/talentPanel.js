// Resumo da árvore (pontos, anéis e bônus ativos), mostrado no painel do mapa quando nenhum nó está selecionado
import { NODES, RINGS, STAT_LABEL, ringEraName } from '../data/talents.js';
import { S } from '../sim/state.js';
import { mods } from '../sim/mods.js';
import { peAvailable, nextPeAlt, ringOpen, owned } from '../sim/talents.js';
import { fmtM } from './format.js';

const num = v => (Math.round(v * 100) / 100).toString().replace('.', ',');
const REDUCE = new Set(['fcost', 'interest', 'cost_obra', 'cost_forn', 'cost_log', 'cost_eng', 'cost_merc']);

export function summaryHTML() {
  const pe = peAvailable();
  const n = Object.keys(S.tree).filter(owned).length - 1;
  let open = 0; for (let k = 1; k <= RINGS; k++) if (ringOpen(k)) open = k;
  const rows = [];
  const M = mods();
  Object.keys(STAT_LABEL).forEach(s => {
    if (s === 'offline') return;
    const m = M.mult(s);
    if (Math.abs(m - 1) < 1e-6) return;
    rows.push(`<li><span>${STAT_LABEL[s]}</span><b>${REDUCE.has(s) ? `−${Math.round((1 - m) * 100)}%` : `×${num(m)}`}</b></li>`);
  });
  const off = M.plus('offline');
  if (off) rows.push(`<li><span>progresso offline</span><b>+${num(off / 3600)} h</b></li>`);
  Object.keys(S.tree).forEach(id => {
    const nd = NODES[id];
    if (nd && nd.kind === 'key' && owned(id)) rows.push(`<li class="key"><span>◆ ${nd.name}</span></li>`);
  });
  return `
    <div class="pebig"><b>${pe}</b><span>Pontos de Engenharia para gastar</span></div>
    <p class="hint">${pe > 0 ? 'Clique num nó aceso ao lado dos seus e em Aprender. ' : ''}Os pontos vêm da altura recorde da torre: o próximo chega em ${fmtM(nextPeAlt(S.maxAlt))}.</p>
    <div class="kv">
      <span>Nós aprendidos</span><b>${n} de ${Object.keys(NODES).length - 1}</b>
      <span>Anéis abertos</span><b>${open} de ${RINGS}</b>
    </div>
    ${open < RINGS ? `<p class="hint">Próximo anel na era ${ringEraName(open + 1)}.</p>` : ''}
    <div class="sub">Bônus ativos</div>
    <ul class="bonus">${rows.length ? rows.join('') : '<li class="none">Nenhum ainda.</li>'}</ul>
    <p class="hint">Arraste para mover o mapa e use a roda do mouse ou pinça para zoom. Redistribuir devolve todos os pontos, de graça.</p>`;
}
