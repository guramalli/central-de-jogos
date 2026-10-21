// Central de testes da árvore (arvore-lab.html). Mexe numa cópia da árvore: as mudanças (M) vão para os Workers, que
// jogam com o robô (lab/robo.js) e devolvem marcos, quedas, gasto e compras. O jogo de verdade não lê nada daqui.
import { UP, KEYS, ERA_TECH } from '../src/data/upgrades.js';
import { ERAS } from '../src/data/eras.js';
import { VIVA } from '../src/data/viva.js';
import { PREMIOS } from '../src/data/premios.js';
import { RISCO, AMEACAS } from '../src/sim/risco.js';
import { fmt, fmtM } from '../src/ui/format.js';
import { CENARIOS, BUILDS_PRONTAS } from './cenarios.js';
import { MARCOS, BUILDS, ladoB } from './robo.js';

const $ = id => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const a in attrs) { if (a === 'class') e.className = attrs[a]; else if (a.startsWith('on')) e[a] = attrs[a]; else if (attrs[a] != null) e.setAttribute(a, attrs[a]); } for (const k of kids) e.append(k); return e; };
const copia = v => JSON.parse(JSON.stringify(v));

// ---------- dados originais (o jogo como está) ----------
const ORIG = copia(Object.fromEntries(KEYS.map(k => [k, UP[k]])));
const ORIG_RISCO = copia(RISCO), ORIG_VIVA = copia(VIVA), ORIG_PREMIOS = copia(PREMIOS), ORIG_AMEACAS = copia(AMEACAS);
const RAMOS = [{ b: 'obra', n: 'Mão de obra', c: '#e0a020' }, { b: 'forn', n: 'Fornecimento', c: '#d0603a' }, { b: 'log', n: 'Logística', c: '#e8c02a' }, { b: 'eng', n: 'Engenharia', c: '#4a90d0' }, { b: 'merc', n: 'Mercado', c: '#6fd08c' }];
const NOME_RAMO = Object.fromEntries(RAMOS.map(r => [r.b, r.n]));
const DEF = ['contravento', 'sondagem', 'clima', 'seguranca', 'manutencao'];
const ETAPAS = { prod: 'Material chegando', tran: 'Material subindo', lay: 'Assentamento', capF: 'Limite da fundação', fcost: 'Material por andar', rent: 'Aluguel', tour: 'Turismo', ticket: 'Ingresso do turismo', cap: 'Carga por viagem', fundCost: 'Preço da fundação', sale: 'Valor de venda', floorPay: 'Pagamento por andar' };
// etapa fixa das compras do dia a dia (o jogo calcula em economy.js rates())
const ETAPA_FIXA = { pedreiro: 'lay', treino: 'lay', ferram: 'lay', mestre: 'lay', fornec: 'prod', caminhao: 'prod', olaria: 'prod', premold: 'prod', elevador: 'tran', motor: 'tran', cacamba: 'tran', maglev: 'tran', guindaste: 'tran', fundacao: 'capF', projeto: 'fcost', aluguel: 'rent', bilheteria: 'tour', marketing: 'tour', heliponto: 'tour', porto: 'tour' };

// ---------- estado do laboratório ----------
const VAZIO = () => ({ up: {}, novas: {}, remover: [], risco: {}, viva: {}, premios: {}, ameacas: {} });
const lsLer = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
const lsGravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
let M = Object.assign(VAZIO(), lsLer('torre-lab-mudancas', {}));
const CFG = Object.assign({ robo: 'excelente', build: 'equilibrado', modo: 'risco', horas: 8, sementes: 3, auto: true }, lsLer('torre-lab-config', {}));
const desfazer = [];
const guardar = () => { lsGravar('torre-lab-mudancas', M); lsGravar('torre-lab-config', CFG); };
const vazio = m => !Object.keys(m.up).length && !Object.keys(m.novas).length && !m.remover.length && !Object.keys(m.risco).length && !Object.keys(m.viva).length && !Object.keys(m.premios).length && !Object.keys(m.ameacas).length;

// ---------- números ----------
function num(s) {
  s = String(s ?? '').trim().toLowerCase().replace(/r\$/g, '').replace(/[×x+%\s]/g, '');
  if (!s) return NaN;
  let m = 1;
  for (const [suf, v] of [['tri', 1e12], ['mil', 1e3], ['bi', 1e9], ['mi', 1e6], ['km', 1000], ['m', 1]]) if (s.endsWith(suf)) { m = v; s = s.slice(0, -suf.length); break; }
  s = s.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  return parseFloat(s) * m;
}
const dec = v => (Math.round(v * 1000) / 1000).toLocaleString('pt-BR');
const reais = v => v == null || !isFinite(v) ? '—' : 'R$ ' + fmt(v);
const hm = s => s == null ? '—' : `${Math.floor(s / 3600)}h${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}`;
const minSeg = s => s == null || !isFinite(s) ? '—' : s >= 172800 ? `${Math.round(s / 86400).toLocaleString('pt-BR')} dias` : s >= 3600 ? hm(s) : s >= 60 ? `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s` : `${Math.round(s)} s`;
const difMin = d => (d < 0 ? '−' : '+') + (Math.abs(d) >= 3600 ? hm(Math.abs(d)) : Math.round(Math.abs(d) / 60) + ' min');

// ---------- leitura e escrita dos valores de uma melhoria ----------
const isNova = k => !!M.novas[k];
const ehTech = k => !!(val(k, 'era') || isNova(k) || ORIG[k]?.st);
function val(k, f) {
  if (isNova(k)) return M.novas[k][f];
  const m = M.up[k];
  if (m && f in m) return m[f] === null ? undefined : m[f];
  return ORIG[k] ? ORIG[k][f] : undefined;
}
const mudou = (k, f) => !isNova(k) && !!M.up[k] && f in M.up[k];
const nomeDe = k => val(k, 'n') || k;
function marca() { desfazer.push(JSON.stringify(M)); if (desfazer.length > 60) desfazer.shift(); }
function setVal(k, f, v, semMarca) {
  if (!semMarca) marca();
  if (isNova(k)) { if (v === undefined) delete M.novas[k][f]; else M.novas[k][f] = v; }
  else {
    const o = ORIG[k][f];
    if (JSON.stringify(v) === JSON.stringify(o)) { if (M.up[k]) { delete M.up[k][f]; if (!Object.keys(M.up[k]).length) delete M.up[k]; } }
    else (M.up[k] ||= {})[f] = v === undefined ? null : v;
  }
}
function voltarCampo(k, f) { marca(); if (M.up[k]) { delete M.up[k][f]; if (!Object.keys(M.up[k]).length) delete M.up[k]; } mudanca(); }

// ---------- montagem da árvore ----------
const efeitoTxt = k => { const mul = val(k, 'mul'), add = val(k, 'add'), flag = val(k, 'flag'); if (mul) return '×' + dec(mul); if (add) return '+' + dec(add * 100) + '%'; if (flag) return 'regra'; return 'fixo'; };
const liberaTxt = k => { const r = val(k, 'req'), a = val(k, 'reqAlt'); const p = []; if (r) p.push(`${nomeDe(r[0])} nv ${r[1]}`); if (a) p.push(fmtM(a)); return p.join(' · ') || 'início'; };
function entrada(k, f, txt, ok = true) {
  const i = el('input', { class: 'in' + (mudou(k, f) || (f === 'efeito' && (mudou(k, 'mul') || mudou(k, 'add'))) ? ' mod' : ''), value: txt });
  if (!ok) { i.disabled = true; i.title = txt === 'fixo' ? 'Efeito calculado direto no código do jogo (uma unidade a mais por nível, ou regra própria): não dá para editar aqui' : 'Regra especial do jogo: não dá para editar aqui'; }
  const orig = f === 'base' ? reais(ORIG[k]?.base) : f === 'k' ? dec(ORIG[k]?.k ?? 0) : f === 'max' ? (ORIG[k]?.max ?? 'sem teto') : f === 'efeito' && ORIG[k] ? (ORIG[k].mul ? '×' + dec(ORIG[k].mul) : ORIG[k].add ? '+' + dec(ORIG[k].add * 100) + '%' : '') : '';
  if (!isNova(k) && ok) i.title = 'Original: ' + orig;
  i.onchange = () => editar(k, f, i.value);
  return i;
}
function editar(k, f, txt) {
  marca();
  const t = String(txt).trim();
  if (f === 'base' || f === 'k') { const v = num(t); if (isFinite(v) && v > 0) setVal(k, f, v, true); }
  else if (f === 'max') { if (!t || /sem|∞|-/.test(t.toLowerCase())) setVal(k, 'max', undefined, true); else { const v = Math.round(num(t)); if (isFinite(v) && v >= 0) setVal(k, 'max', v, true); } }
  else if (f === 'efeito') {
    const v = num(t); if (!isFinite(v)) return mudanca();
    const comoMul = /^[×x*]/i.test(t) || (!/[+%]/.test(t) && !!val(k, 'mul'));
    if (comoMul) { setVal(k, 'mul', v, true); setVal(k, 'add', undefined, true); } else { setVal(k, 'add', v / 100, true); setVal(k, 'mul', undefined, true); }
  }
  else if (f === 'reqAlt') { const v = num(t); setVal(k, 'reqAlt', t && isFinite(v) && v > 0 ? v : undefined, true); }
  mudanca();
}
function linha(k) {
  const removida = M.remover.includes(k), conta = !val(k, 'mul') && !val(k, 'add');
  const bt = el('button', { class: 'nome' + (removida ? ' removida' : '') + (isNova(k) ? ' nova' : ''), onclick: () => abrirDetalhe(k) }, (isNova(k) ? '+ ' : '') + nomeDe(k));
  const extra = ehTech(k) && val(k, 'st') ? el('div', { class: 'par' }, ETAPAS[val(k, 'st')] || val(k, 'st')) : '';
  const td1 = el('td', {}, bt, extra);
  if (val(k, 'pair')) td1.append(el('div', { class: 'par' }, `par: ${nomeDe(val(k, 'pair'))} (lado ${ladoB(k) ? 'B' : 'A'})`));
  const def = DEF.includes(k);
  return el('tr', {}, td1,
    el('td', {}, entrada(k, 'base', reais(val(k, 'base')))),
    el('td', {}, entrada(k, 'k', dec(val(k, 'k') ?? 1))),
    el('td', {}, def ? el('span', { class: 'par' }, k === 'manutencao' ? 'cura/nível' : k === 'seguranca' ? 'fiscalização' : `dano ×${dec(RISCO.defMul)}/nível`) : entrada(k, 'efeito', efeitoTxt(k), !conta && !val(k, 'flag'))),
    el('td', {}, entrada(k, 'max', val(k, 'max') == null ? 'sem teto' : String(val(k, 'max')))),
    el('td', {}, el('button', { class: 'nome', onclick: () => abrirDetalhe(k), style: 'font-size:12px;color:#9aa0ad' }, liberaTxt(k))));
}
const cab = () => el('tr', {}, ...['Melhoria', 'Preço nv 1', '× por nível', 'Efeito/nível', 'Máx.', 'Libera'].map(t => el('th', {}, t)));
function montarArvore() {
  const box = $('tabela'); box.innerHTML = '';
  const todas = [...KEYS, ...Object.keys(M.novas)];
  for (const r of RAMOS) {
    const ks = todas.filter(k => val(k, 'b') === r.b && !val(k, 'era') && !DEF.includes(k) && !VIVA.hidden.includes(k) && k !== 'imoveis');
    if (!ks.length) continue;
    box.append(el('div', { class: 'ramo', style: `--c:${r.c}` }, r.n.toUpperCase()), el('table', { class: 'arv' }, cab(), ...ks.map(linha)));
  }
  box.append(el('div', { class: 'ramo', style: '--c:#9fd0a8' }, 'DEFESAS (TORRE ÚNICA)'), el('table', { class: 'arv' }, cab(), ...DEF.map(linha)));
  for (let e = 1; e < ERAS.length; e++) {
    const ks = Object.keys(ERA_TECH).filter(k => val(k, 'era') === e);
    if (!ks.length) continue;
    const ord = []; for (const r of RAMOS) for (const k of ks.filter(k => val(k, 'b') === r.b && !ladoB(k))) { ord.push(k); const p = val(k, 'pair'); if (p && ks.includes(p)) ord.push(p); }
    for (const k of ks) if (!ord.includes(k)) ord.push(k);
    box.append(el('div', { class: 'ramo', style: '--c:#b48cf0' }, `TECNOLOGIAS · ${ERAS[e].n.toUpperCase()} (${fmtM(ERAS[e].m)})`), el('table', { class: 'arv' }, cab(), ...ord.map(linha)));
  }
}

// ---------- regras do jogo ----------
const REGRAS = [
  { g: 'Intempéries', itens: [
    ['risco', 'gap', 'Intervalo entre ameaças (s, mín e máx)', 'par'], ['risco', 'warn', 'Aviso antes da ameaça (s)'], ['risco', 'anoK', 'Dano multiplica por ano'], ['risco', 'gapAno', 'Intervalo multiplica por ano'],
    ['risco', 'diaK', 'Dano a mais no fim do ano (fração)'], ['risco', 'altPow', 'Peso da altura no dano (expoente)'], ['risco', 'defMul', 'Cada nível de defesa multiplica o dano por'], ['risco', 'nuvens', 'Acima disso o temporal fica embaixo (m)'] ] },
  { g: 'Integridade, reforço e parcelamento', itens: [
    ['risco', 'regen', 'Cura por nível de Manutenção (/s)'], ['risco', 'reforco', 'Sobra de integridade que vira máxima no fim do ano'], ['risco', 'interdMax', 'Interdições no ano até cair'],
    ['risco', 'reforcoNiveis', 'Fração do preço dos níveis do laudo'], ['risco', 'parcelaJuros', 'Juros do parcelamento'], ['risco', 'retencao', 'Parte da renda que paga a dívida (mín e máx)', 'par'], ['risco', 'taxaEra', 'Taxa por andar em cada era (R$)', 'lista'] ] },
  { g: 'Prêmios de defesa', itens: [['risco', 'premioDefMax', 'Corte máximo por grupo'], ...['amortecedor', 'fundProfunda', 'blindagem'].map(id => ['premios', id + '.defCorte', `${ORIG_PREMIOS[id].n}: corte de dano`])] },
  { g: 'Outros prêmios', itens: Object.keys(ORIG_PREMIOS).filter(id => ORIG_PREMIOS[id].mul).map(id => ['premios', id + '.mul', `${ORIG_PREMIOS[id].n}: multiplica`]) },
  { g: 'Dano base de cada intempérie', itens: Object.keys(ORIG_AMEACAS).filter(t => ORIG_AMEACAS[t].base).map(t => ['ameacas', t + '.base', ORIG_AMEACAS[t].n]) },
  { g: 'Economia', itens: [['viva', 'startMoney', 'Dinheiro no começo'], ['viva', 'prestige.rep', 'Reputação: bônus por ponto'], ['viva', 'prestige.k', 'Pontos de Reputação: multiplicador'], ['viva', 'prestige.pow', 'Pontos de Reputação: expoente da altura'],
    ['viva', 'floorCost.mult', 'Material por andar: multiplicador'], ['viva', 'floorCost.eraMult', 'Material por andar: × por era'], ['viva', 'floorCost.pow', 'Material por andar: expoente'], ['viva', 'round.secs', 'Duração do ano (s de relógio)'] ] },
];
const pega = (o, p) => p.split('.').reduce((a, x) => a == null ? a : a[x], o);
function regraVal(sec, p) {
  if (sec === 'risco') return p in M.risco ? M.risco[p] : ORIG_RISCO[p];
  if (sec === 'viva') return p in M.viva ? M.viva[p] : pega(ORIG_VIVA, p);
  const [id, c] = p.split('.'), base = sec === 'premios' ? ORIG_PREMIOS : ORIG_AMEACAS, m = M[sec][id];
  return m && c in m ? m[c] : base[id][c];
}
function regraOrig(sec, p) { if (sec === 'risco') return ORIG_RISCO[p]; if (sec === 'viva') return pega(ORIG_VIVA, p); const [id, c] = p.split('.'); return (sec === 'premios' ? ORIG_PREMIOS : ORIG_AMEACAS)[id][c]; }
const regraTxt = (v, tipo) => tipo === 'par' || tipo === 'lista' ? (v || []).map(dec).join(' ; ') : dec(v);
function setRegra(sec, p, txt, tipo) {
  marca();
  let v;
  if (tipo === 'par' || tipo === 'lista') { v = String(txt).split(/[;\/]/).map(num).filter(isFinite); if (!v.length) return mudanca(); }
  else { v = num(txt); if (!isFinite(v)) return mudanca(); }
  const igual = JSON.stringify(v) === JSON.stringify(regraOrig(sec, p));
  if (sec === 'risco' || sec === 'viva') { if (igual) delete M[sec][p]; else M[sec][p] = v; }
  else { const [id, c] = p.split('.'); if (igual) { if (M[sec][id]) { delete M[sec][id][c]; if (!Object.keys(M[sec][id]).length) delete M[sec][id]; } } else (M[sec][id] ||= {})[c] = v; }
  mudanca();
}
function montarRegras() {
  const box = $('regrasBox'); box.innerHTML = '';
  for (const g of REGRAS) {
    const d = el('div', { class: 'grupo' }, el('div', { class: 'ramo', style: '--c:#9aa0ad' }, g.g.toUpperCase()));
    for (const [sec, p, nome, tipo] of g.itens) {
      const v = regraVal(sec, p), o = regraOrig(sec, p), mod = JSON.stringify(v) !== JSON.stringify(o);
      const i = el('input', { class: 'in' + (mod ? ' mod' : ''), value: regraTxt(v, tipo), title: 'Original: ' + regraTxt(o, tipo) });
      i.onchange = () => setRegra(sec, p, i.value, tipo);
      d.append(el('label', {}, el('span', {}, nome, el('small', {}, `original: ${regraTxt(o, tipo)}`)), i));
    }
    box.append(d);
  }
}

// ---------- faixa de mudanças ----------
function chips() {
  const box = $('chips'); box.innerHTML = '';
  if (vazio(M)) { box.append(el('span', { class: 'vazio' }, 'Nenhuma mudança: a árvore está como no jogo. Mude um valor, abra um cenário pronto ou crie uma melhoria nova.')); return; }
  box.append(el('span', { class: 'vazio' }, 'SUAS MUDANÇAS:'));
  const chip = (txt, desfaz) => box.append(el('span', { class: 'chip' }, txt, el('button', { title: 'Desfazer esta mudança', onclick: () => { marca(); desfaz(); mudanca(); } }, '✕')));
  const NOMES = { base: 'preço', k: '× por nível', mul: 'efeito ×', add: 'efeito +', max: 'máx.', reqAlt: 'libera em', req: 'requisito', pair: 'par', st: 'etapa', n: 'nome', b: 'ramo' };
  const mostra = (f, v) => v == null ? (f === 'max' ? 'sem teto' : '—') : f === 'base' ? reais(v) : f === 'reqAlt' ? fmtM(v) : f === 'add' ? '+' + dec(v * 100) + '%' : Array.isArray(v) ? v.join(' nv ') : typeof v === 'number' ? dec(v) : String(v);
  for (const k in M.up) for (const f in M.up[k]) chip(`${nomeDe(k)} · ${NOMES[f] || f} ${mostra(f, ORIG[k][f])} → ${mostra(f, M.up[k][f])}`, () => { delete M.up[k][f]; if (!Object.keys(M.up[k]).length) delete M.up[k]; });
  for (const k in M.novas) chip(`NOVA: ${M.novas[k].n || k} (${NOME_RAMO[M.novas[k].b] || ''})`, () => { delete M.novas[k]; });
  for (const k of M.remover) chip(`Tirada da árvore: ${nomeDe(k)}`, () => { M.remover = M.remover.filter(x => x !== k); });
  for (const p in M.risco) chip(`Regra · ${p} ${regraTxt(ORIG_RISCO[p], Array.isArray(ORIG_RISCO[p]) ? 'par' : '')} → ${regraTxt(M.risco[p], Array.isArray(M.risco[p]) ? 'par' : '')}`, () => { delete M.risco[p]; });
  for (const p in M.viva) chip(`Regra · ${p} ${dec(pega(ORIG_VIVA, p))} → ${dec(M.viva[p])}`, () => { delete M.viva[p]; });
  for (const id in M.premios) for (const c in M.premios[id]) chip(`Prêmio · ${ORIG_PREMIOS[id].n} ${c} ${dec(ORIG_PREMIOS[id][c])} → ${dec(M.premios[id][c])}`, () => { delete M.premios[id][c]; if (!Object.keys(M.premios[id]).length) delete M.premios[id]; });
  for (const t in M.ameacas) for (const c in M.ameacas[t]) chip(`Intempérie · ${ORIG_AMEACAS[t].n} ${c} ${dec(ORIG_AMEACAS[t][c])} → ${dec(M.ameacas[t][c])}`, () => { delete M.ameacas[t][c]; if (!Object.keys(M.ameacas[t]).length) delete M.ameacas[t]; });
}

// ---------- painel de uma melhoria ----------
let aberto = null;
function precoNivel(k, i, orig) { const u = orig ? ORIG[k] : { base: val(k, 'base'), k: val(k, 'k') }; return u ? u.base * Math.pow(u.k, i - 1) : NaN; }
function abrirDetalhe(k) {
  aberto = k; const p = $('detalhe'); p.hidden = false; p.innerHTML = '';
  const tech = ehTech(k), nova = isNova(k), removida = M.remover.includes(k);
  p.append(el('div', { class: 'card-h' }, el('h2', {}, nomeDe(k)), el('button', { class: 'btn sm', onclick: () => { p.hidden = true; aberto = null; } }, 'Fechar')));
  p.append(el('p', { class: 'hint' }, `${NOME_RAMO[val(k, 'b')] || 'Defesas'} · ${nova ? 'melhoria nova (só no laboratório)' : val(k, 'era') ? 'tecnologia de era' : DEF.includes(k) ? 'defesa da torre única' : 'compra do dia a dia'}${removida ? ' · TIRADA DA ÁRVORE' : ''}`));
  if (ORIG[k]?.d || val(k, 'd')) p.append(el('p', { class: 'hint', style: 'color:#cfd3dc' }, val(k, 'd') || ''));
  const f = el('div', { class: 'form' });
  const campo = (rot, input, origTxt, wide) => f.append(el('label', { class: wide ? 'wide' : '' }, rot, input, origTxt != null && !nova ? el('span', { class: 'orig' }, 'original: ' + origTxt) : ''));
  const txt = (fld, v, onv) => { const i = el('input', { class: 'in' + (mudou(k, fld) ? ' mod' : ''), value: v ?? '' }); i.onchange = () => onv(i.value); return i; };
  const sel = (fld, opcoes, atual, onv) => { const s = el('select', { class: 'in' + (mudou(k, fld) ? ' mod' : '') }); for (const [v, t] of opcoes) { const o = el('option', { value: v }, t); if (String(v) === String(atual ?? '')) o.selected = true; s.append(o); } s.onchange = () => onv(s.value); return s; };
  campo('Nome', txt('n', nomeDe(k), v => { setVal(k, 'n', v.trim() || undefined); mudanca(); }), ORIG[k]?.n, true);
  if (!DEF.includes(k)) campo('Ramo', sel('b', RAMOS.map(r => [r.b, r.n]), val(k, 'b'), v => { setVal(k, 'b', v); mudanca(); }), NOME_RAMO[ORIG[k]?.b]);
  campo('Preço do nível 1', txt('base', reais(val(k, 'base')), v => editar(k, 'base', v)), reais(ORIG[k]?.base));
  campo('Preço sobe × por nível', txt('k', dec(val(k, 'k') ?? 1), v => editar(k, 'k', v)), dec(ORIG[k]?.k ?? 1));
  if (!DEF.includes(k)) {
    campo('Efeito por nível (×1,5 multiplica · +30% soma)', txt('mul', efeitoTxt(k), v => editar(k, 'efeito', v)), ORIG[k] ? (ORIG[k].mul ? '×' + dec(ORIG[k].mul) : ORIG[k].add ? '+' + dec(ORIG[k].add * 100) + '%' : 'conta por nível') : null);
    if (tech) campo('O que melhora (etapa)', sel('st', [['', '—'], ...Object.entries(ETAPAS)], val(k, 'st'), v => { setVal(k, 'st', v || undefined); mudanca(); }), ORIG[k]?.st ? ETAPAS[ORIG[k].st] : null);
    else campo('O que melhora', el('span', { class: 'par' }, ETAPAS[ETAPA_FIXA[k]] || 'regra própria do jogo'), null);
  }
  campo('Máximo de níveis (vazio = sem teto)', txt('max', val(k, 'max') ?? '', v => editar(k, 'max', v)), ORIG[k] ? (ORIG[k].max ?? 'sem teto') : null);
  campo('Libera com a torre em (ex.: 2 km)', txt('reqAlt', val(k, 'reqAlt') ? fmtM(val(k, 'reqAlt')) : '', v => editar(k, 'reqAlt', v)), ORIG[k] ? (ORIG[k].reqAlt ? fmtM(ORIG[k].reqAlt) : 'sem') : null);
  const req = val(k, 'req') || ['', 1];
  const opReq = [['', 'nenhum'], ...[...KEYS, ...Object.keys(M.novas)].filter(x => x !== k && !VIVA.hidden.includes(x)).map(x => [x, nomeDe(x)])];
  const sReq = sel('req', opReq, req[0], v => { setVal(k, 'req', v ? [v, Math.max(1, req[1] || 1)] : undefined); mudanca(); });
  const nReq = txt('req', req[0] ? req[1] : '', v => { if (req[0]) { setVal(k, 'req', [req[0], Math.max(1, Math.round(num(v)) || 1)]); mudanca(); } });
  campo('Precisa de outra melhoria', sReq, ORIG[k] ? (ORIG[k].req ? `${nomeDe(ORIG[k].req[0])} nv ${ORIG[k].req[1]}` : 'nenhuma') : null);
  campo('… nesse nível', nReq, null);
  if (tech) campo('Par (escolha 1 de 2)', sel('pair', [['', 'nenhum'], ...[...Object.keys(ERA_TECH), ...Object.keys(M.novas)].filter(x => x !== k).map(x => [x, nomeDe(x)])], val(k, 'pair'), v => { setVal(k, 'pair', v || undefined); mudanca(); }), ORIG[k]?.pair ? nomeDe(ORIG[k].pair) : null, true);
  p.append(f);
  // preço de cada nível (original × agora) e em minutos de renda nas alturas em que a compra costuma acontecer
  const ref = rendaRef(), n = Math.min(15, val(k, 'max') ?? 15), tb = el('table', { class: 'compras' });
  tb.append(el('tr', {}, ...['Compra nº', 'Original', 'Agora', 'Renda a 1 km', 'a 12 km', 'a 100 km'].map(t => el('th', {}, t))));
  for (let i = 1; i <= n; i += (n > 8 && i >= 4 ? 2 : 1)) {
    const pa = precoNivel(k, i, false), po = nova ? NaN : precoNivel(k, i, true), mins = m => ref[m] ? minSeg(pa / ref[m]) : '—';
    tb.append(el('tr', {}, el('td', {}, String(i)), el('td', { class: 'mut' }, nova ? '—' : reais(po)), el('td', { class: pa < po ? 'up' : pa > po ? 'dn' : '' }, reais(pa)), el('td', {}, mins(1000)), el('td', {}, mins(12000)), el('td', {}, mins(100000))));
  }
  p.append(el('h3', { style: 'margin:16px 0 6px' }, 'Preço de cada nível'), tb, el('p', { class: 'hint' }, 'Renda: a média do robô (cenário de hoje) ao chegar em cada altura. O turismo encarece mais depois do 10º nível (não aparece aqui).'));
  const so = el('div', { id: 'soEsta' });
  p.append(el('div', { class: 'row' },
    el('button', { class: 'btn y', onclick: () => testarSoEsta(k, so) }, 'Testar só esta mudança'),
    el('button', { class: 'btn', onclick: () => { marca(); if (nova) { delete M.novas[k]; p.hidden = true; aberto = null; } else delete M.up[k]; mudanca(); if (!nova) abrirDetalhe(k); } }, nova ? 'Apagar a nova' : 'Voltar ao original'),
    el('button', { class: 'btn', onclick: () => duplicar(k) }, 'Duplicar como nova'),
    el('button', { class: 'btn red', onclick: () => { marca(); M.remover = removida ? M.remover.filter(x => x !== k) : [...M.remover, k]; mudanca(); abrirDetalhe(k); } }, removida ? 'Devolver à árvore' : 'Tirar da árvore')), so);
}
function duplicar(k) {
  marca(); const id = novoId(nomeDe(k) + ' 2');
  M.novas[id] = { n: nomeDe(k) + ' (cópia)', b: val(k, 'b') || 'eng', st: val(k, 'st') || ETAPA_FIXA[k] || 'lay', base: val(k, 'base'), k: val(k, 'k'), mul: val(k, 'mul') || (val(k, 'add') ? undefined : 1.3), add: val(k, 'add'), max: val(k, 'max'), reqAlt: val(k, 'reqAlt') };
  for (const c in M.novas[id]) if (M.novas[id][c] === undefined) delete M.novas[id][c];
  mudanca(); abrirDetalhe(id);
}
const novoId = nome => { let b = 'nova_' + String(nome).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20), id = b, i = 2; while (UP[id] || M.novas[id]) id = b + i++; return id; };

// ---------- melhoria nova ----------
function abrirNova() {
  const f = $('novaForm'); f.innerHTML = '';
  const c = (rot, inp, wide) => f.append(el('label', { class: wide ? 'wide' : '' }, rot, inp));
  const i = (id, v, ph) => el('input', { class: 'in', id, value: v, placeholder: ph || '' });
  const s = (id, op, v) => { const e = el('select', { class: 'in', id }); for (const [a, b] of op) { const o = el('option', { value: a }, b); if (a === v) o.selected = true; e.append(o); } return e; };
  c('Nome', i('nvNome', '', 'Ex.: Ponte aérea de carga'), true);
  c('Ramo', s('nvRamo', RAMOS.map(r => [r.b, r.n]), 'log'));
  c('O que melhora', s('nvSt', Object.entries(ETAPAS), 'tran'));
  c('Preço do nível 1', i('nvBase', 'R$ 5 mi'));
  c('Preço sobe × por nível', i('nvK', '2,5'));
  c('Efeito por nível', i('nvEf', '×1,3', '×1,3 multiplica · +30% soma'));
  c('Máximo de níveis (vazio = sem teto)', i('nvMax', '8'));
  c('Libera com a torre em', i('nvAlt', '2 km'));
  c('Par (escolha 1 de 2)', s('nvPar', [['', 'nenhum'], ...Object.keys(ERA_TECH).map(x => [x, nomeDe(x)])], ''));
  $('dlgNova').showModal();
}
function criarNova() {
  const nome = $('nvNome').value.trim() || 'Melhoria nova', ef = $('nvEf').value, v = num(ef), id = novoId(nome);
  const u = { n: nome, b: $('nvRamo').value, st: $('nvSt').value, base: num($('nvBase').value) || 100, k: num($('nvK').value) || 2 };
  if (/^[×x*]/i.test(ef.trim()) || !/[+%]/.test(ef)) u.mul = v || 1.3; else u.add = (v || 30) / 100;
  const mx = num($('nvMax').value); if (isFinite(mx)) u.max = Math.round(mx);
  const a = num($('nvAlt').value); if (isFinite(a) && a > 0) u.reqAlt = a;
  if ($('nvPar').value) u.pair = $('nvPar').value;
  marca(); M.novas[id] = u; $('dlgNova').close(); mudanca(); abrirDetalhe(id);
}

// ---------- simulados (Workers) ----------
const NUCLEOS = Math.max(2, Math.min(8, (navigator.hardwareConcurrency || 4) - 1));
let geracao = 0, workers = [];
const CACHE = new Map(); // "hoje" por robô/build/modo/horas/semente
function pararTudo() { geracao++; for (const w of workers) w.terminate(); workers = []; }
// tarefas: [{ chave, cfg }]; aoProg(tarefa, p); devolve uma promessa com { chave: resultado }
function rodar(tarefas, aoProg) {
  pararTudo(); const g = geracao, res = {}, fila = tarefas.slice();
  return new Promise(ok => {
    if (!fila.length) return ok(res);
    let vivos = 0;
    const proximo = w => {
      if (g !== geracao) return;
      const t = fila.shift(); if (!t) { w.terminate(); if (--vivos === 0) ok(res); return; }
      w.onmessage = e => {
        if (g !== geracao) return;
        const d = e.data;
        if (d.tipo === 'progresso') aoProg && aoProg(t, d.p);
        else if (d.tipo === 'fim') { res[t.chave] = d.res; proximo(w); }
        else { console.error(d.msg); res[t.chave] = null; proximo(w); }
      };
      w.postMessage({ id: t.chave, cfg: t.cfg });
    };
    for (let i = 0; i < Math.min(NUCLEOS, fila.length); i++) { const w = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }); workers.push(w); vivos++; proximo(w); }
  });
}
const cfgBase = (sem, extra = {}) => ({ robo: CFG.robo, build: CFG.build, modo: CFG.modo, horas: +CFG.horas, semente: sem, pararNaOrbita: true, ...extra });
const chaveCache = c => JSON.stringify([c.robo, c.build, c.modo, c.horas, c.semente]);
const limpo = m => { const o = copia(m); for (const k of Object.keys(o.up)) if (!Object.keys(o.up[k]).length) delete o.up[k]; return o; };
let RES = { hoje: [], agora: [], prog: {} };

async function simular() {
  if (CFG.modo !== 'risco' && CFG.modo !== 'corrida') CFG.modo = 'risco';
  const sems = Array.from({ length: +CFG.sementes }, (_, i) => i + 1), tarefas = [], m = limpo(M), igual = vazio(M);
  RES = { hoje: [], agora: [], prog: {} };
  for (const s of sems) {
    const c = cfgBase(s), ch = chaveCache(c);
    if (CACHE.has(ch)) RES.hoje[s - 1] = CACHE.get(ch); else tarefas.push({ chave: 'h' + s, cfg: c });
    if (!igual) tarefas.push({ chave: 'a' + s, cfg: { ...c, mudancas: m } });
  }
  status(`rodando ${tarefas.length} partida(s) do robô em ${Math.min(NUCLEOS, tarefas.length) || 0} núcleos…`, true);
  desenharResultado();
  const t0 = performance.now();
  const res = await rodar(tarefas, (t, p) => { RES.prog[t.chave] = p; desenharResultado(); });
  if (!res) return;
  for (const s of sems) {
    if (res['h' + s]) { RES.hoje[s - 1] = res['h' + s]; CACHE.set(chaveCache(cfgBase(s)), res['h' + s]); }
    RES.agora[s - 1] = igual ? RES.hoje[s - 1] : res['a' + s];
  }
  RES.prog = {};
  status(`pronto em ${((performance.now() - t0) / 1000).toFixed(1)} s · ${sems.length} semente(s) · robô ${CFG.robo} · ${BUILDS[CFG.build].split(':')[0]}`);
  desenharResultado();
  if (aberto) abrirDetalhe(aberto);
}
let espera = null;
function mudanca() { guardar(); chips(); montarArvore(); montarRegras(); if (aberto && (M.novas[aberto] || ORIG[aberto])) abrirDetalhe(aberto); if (CFG.auto) { clearTimeout(espera); espera = setTimeout(simular, 1000); } }
const status = (t, rodando) => { $('status').textContent = t; $('status').className = 'status' + (rodando ? ' rodando' : ''); };

// ---------- resultado ----------
function marcoInfo(lista, m, prog, pref) {
  const v = []; let n = 0;
  lista.forEach((r, i) => { const x = r ? r.marcos[m] : prog[pref + (i + 1)] && prog[pref + (i + 1)].marcos[m]; if (x != null) { v.push(x); n++; } });
  return { med: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null, n };
}
const mediaDe = (lista, f) => { const v = lista.filter(Boolean).map(f).filter(x => x != null && isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
function rendaRef() { const o = {}; for (const m of MARCOS) o[m] = mediaDe(RES.hoje, r => r.rendaEm[m]); return o; }
function desenharResultado() {
  const sems = +CFG.sementes, igual = vazio(M), H = RES.hoje, A = RES.agora, P = RES.prog;
  const lista = (arr, pref) => Array.from({ length: sems }, (_, i) => arr[i] || null);
  const hj = lista(H), ag = igual ? hj : lista(A), pa = igual ? 'h' : 'a';
  // cartões
  const orbH = marcoInfo(hj, 400000, P, 'h'), orbA = marcoInfo(ag, 400000, P, pa);
  const torreA = mediaDe(ag, r => r.torreEm[400000]), torreH = mediaDe(hj, r => r.torreEm[400000]);
  const espA = mediaDe(ag, r => r.maiorEspera), espH = mediaDe(hj, r => r.maiorEspera);
  const melA = mediaDe(ag, r => r.melhor), melH = mediaDe(hj, r => r.melhor);
  const card = (rot, v, sub, cls) => el('div', { class: 'k' }, el('small', {}, rot), el('b', {}, v), el('span', { class: cls || 'mut' }, sub));
  const cmp = (a, h, menorMelhor, f) => a == null || h == null || igual ? ['', 'mut'] : [`hoje: ${f(h)}`, (menorMelhor ? a < h : a > h) ? 'up' : a === h ? 'mut' : 'dn'];
  const [s1, c1] = cmp(orbA.med, orbH.med, true, hm), [s2, c2] = cmp(torreA, torreH, true, v => dec(Math.round(v * 10) / 10) + 'ª'), [s3, c3] = cmp(espA, espH, true, minSeg), [s4, c4] = cmp(melA, melH, false, fmtM);
  $('cards').replaceChildren(
    card('Órbita (400 km)', orbA.n ? hm(orbA.med) : 'não chegou', orbA.n && orbA.n < sems ? `${orbA.n} de ${sems} chegaram · ${s1}` : s1, c1),
    card('Torre em que chega à Órbita', torreA ? dec(Math.round(torreA * 10) / 10) + 'ª' : '—', s2, c2),
    card('Maior espera sem compra útil', minSeg(espA), s3, c3),
    card('Melhor altura', melA ? fmtM(melA) : '—', s4, c4));
  // marcos
  const tb = $('marcos'); tb.innerHTML = '';
  tb.append(el('tr', {}, ...['Marco', 'Hoje', igual ? '' : 'Com suas mudanças', igual ? '' : 'Diferença'].map(t => el('th', {}, t))));
  const fmtInfo = i => i.n ? hm(i.med) + (i.n < sems ? ` (${i.n}/${sems})` : '') : '—';
  for (const m of MARCOS) {
    const h = marcoInfo(hj, m, P, 'h'), a = marcoInfo(ag, m, P, pa), d = h.med != null && a.med != null ? a.med - h.med : null;
    tb.append(el('tr', {}, el('td', {}, m === 400000 ? 'Órbita' : fmtM(m)), el('td', { class: 'mut' }, fmtInfo(h)), el('td', {}, igual ? '' : fmtInfo(a)),
      el('td', { class: d == null || igual ? 'mut' : d < -30 ? 'up' : d > 30 ? 'dn' : 'mut' }, igual || d == null ? '' : Math.abs(d) < 30 ? 'igual' : difMin(d))));
  }
  const extra = (rot, f, fmtf, menorMelhor) => { const h = mediaDe(hj, f), a = mediaDe(ag, f); tb.append(el('tr', {}, el('td', {}, rot), el('td', { class: 'mut' }, h == null ? '—' : fmtf(h)), el('td', {}, igual || a == null ? '' : fmtf(a)), el('td', { class: igual || a == null || h == null ? 'mut' : (menorMelhor ? a < h : a > h) ? 'up' : a === h ? 'mut' : 'dn' }, igual || a == null || h == null || a === h ? '' : (a > h ? '+' : '−') + fmtf(Math.abs(a - h))))); };
  const um = v => dec(Math.round(v * 10) / 10);
  extra('Torres que caíram', r => r.quedas.length, um, true);
  extra('Interdições', r => r.interdicoes, um, true);
  extra('Reforços parcelados', r => r.parcelas, um, true);
  extra('Tempo de jogo simulado', r => r.t, hm, true);
  // progresso dos que ainda rodam
  const lanes = Object.entries(P).map(([k, p]) => `${k[0] === 'h' ? 'hoje' : 'agora'} s${k.slice(1)}: ${hm(p.t)} · ${fmtM(p.melhor)}`);
  $('notaRes').textContent = lanes.length ? 'Rodando: ' + lanes.join(' · ') : 'Verde = mais rápido que hoje. Os números saem do robô jogando com as regras de verdade do jogo; a mesma semente nos dois lados (mesmas intempéries e prêmios sorteados). (n/3) = quantas sementes chegaram.';
  grafico(hj[0], igual ? null : ag[0]);
  gasto(hj, igual ? null : ag);
  compras(hj, igual ? null : ag);
}
function grafico(h, a) {
  const W = 760, Hh = 220, x0 = 46, y0 = 196, top = 14, ly = v => Math.log10(Math.max(10, v)), yMin = 1, yMax = ly(500000);
  const tMax = Math.max(1, h ? h.t : 0, a ? a.t : 0), X = t => x0 + (W - x0 - 10) * t / tMax, Y = alt => y0 - (y0 - top) * (ly(alt) - yMin) / (yMax - yMin);
  const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'), add = (tag, at, txt) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (txt) e.textContent = txt; s.append(e); return e; };
  s.setAttribute('viewBox', `0 0 ${W} ${Hh}`); s.setAttribute('width', '100%');
  for (const [alt, t] of [[100, '100 m'], [1000, '1 km'], [12000, '12 km'], [100000, '100 km'], [400000, 'Órbita']]) { add('line', { x1: x0, x2: W - 10, y1: Y(alt), y2: Y(alt), stroke: '#232836' }); add('text', { x: 4, y: Y(alt) + 4, fill: '#9aa0ad', 'font-size': 11 }, t); }
  for (let hr = 0; hr * 3600 <= tMax; hr += tMax > 6 * 3600 ? 2 : 1) add('text', { x: X(hr * 3600) - 6, y: Hh - 6, fill: '#9aa0ad', 'font-size': 11 }, hr + ' h');
  const linha = (r, cor, tracej) => { if (!r || !r.serie.length) return; add('path', { d: 'M' + r.serie.map(([t, alt]) => `${X(t).toFixed(1)} ${Y(alt).toFixed(1)}`).join(' L'), fill: 'none', stroke: cor, 'stroke-width': 2.2, 'stroke-dasharray': tracej ? '6 5' : '' }); for (const q of r.quedas) { add('circle', { cx: X(q.t), cy: Y(q.alt), r: 4, fill: '#ff7a6a' }); } };
  linha(h, '#6b7183', !!a); linha(a, '#f2b630', false);
  add('text', { x: W - 200, y: 14, fill: '#9aa0ad', 'font-size': 11 }, a ? '— hoje (tracejado)   — com mudanças' : '— hoje'); add('text', { x: W - 200, y: 28, fill: '#ff7a6a', 'font-size': 11 }, '● torre caiu');
  $('grafico').replaceChildren(s);
}
const COR = { obra: '#e0a020', forn: '#d0603a', log: '#e8c02a', eng: '#4a90d0', merc: '#6fd08c', def: '#9fd0a8' };
const NOME_G = { ...NOME_RAMO, def: 'Defesas' };
function gasto(h, a) {
  const share = lista => { const tot = {}; let n = 0; for (const r of lista.filter(Boolean)) { const s = Object.values(r.gasto).reduce((x, y) => x + y, 0) || 1; for (const b in r.gasto) tot[b] = (tot[b] || 0) + r.gasto[b] / s; n++; } for (const b in tot) tot[b] /= Math.max(1, n); return tot; };
  const sh = share(h), sa = a ? share(a) : null, base = sa || sh;
  $('gasto').replaceChildren(...Object.keys(COR).map(b => { const v = base[b] || 0, d = sa ? (sa[b] || 0) - (sh[b] || 0) : 0; return el('div', {}, el('span', {}, NOME_G[b]), el('i', { style: `--c:${COR[b]};width:${Math.round(v * 100)}%` }), el('em', {}, `${Math.round(v * 100)}%` + (sa && Math.abs(d) >= 0.01 ? ` (${d > 0 ? '+' : '−'}${Math.round(Math.abs(d) * 100)})` : ''))); }));
}
function compras(h, a) {
  const media = lista => { const o = {}; const n = Math.max(1, lista.filter(Boolean).length); for (const r of lista.filter(Boolean)) for (const k in r.compras) o[k] = (o[k] || 0) + r.compras[k] / n; return o; };
  const ch = media(h), ca = a ? media(a) : null, ref = ca || ch;
  const ks = Object.keys({ ...ch, ...(ca || {}) }).sort((x, y) => (ref[y] || 0) - (ref[x] || 0)).slice(0, 22);
  const tb = $('compras'); tb.innerHTML = '';
  tb.append(el('tr', {}, el('th', {}, 'Melhoria'), el('th', {}, 'Hoje'), el('th', {}, ca ? 'Agora' : '')));
  for (const k of ks) tb.append(el('tr', {}, el('td', {}, el('button', { class: 'nome', onclick: () => abrirDetalhe(k) }, nomeDe(k))), el('td', { class: 'mut' }, dec(Math.round((ch[k] || 0) * 10) / 10)), el('td', {}, ca ? dec(Math.round((ca[k] || 0) * 10) / 10) : '')));
}

// ---------- comparações: só esta mudança, builds, cenários ----------
async function testarSoEsta(k, box) {
  box.textContent = 'rodando…';
  const so = VAZIO();
  if (isNova(k)) so.novas[k] = M.novas[k]; else if (M.up[k]) so.up[k] = M.up[k];
  if (M.remover.includes(k)) so.remover = [k];
  if (vazio(so)) { box.textContent = 'Esta melhoria está igual ao original.'; return; }
  const sems = Array.from({ length: +CFG.sementes }, (_, i) => i + 1), tar = [];
  for (const s of sems) { const c = cfgBase(s); if (!CACHE.has(chaveCache(c))) tar.push({ chave: 'h' + s, cfg: c }); tar.push({ chave: 's' + s, cfg: { ...c, mudancas: so } }); }
  const res = await rodar(tar);
  const hj = sems.map(s => res['h' + s] || CACHE.get(chaveCache(cfgBase(s)))), sj = sems.map(s => res['s' + s]);
  for (const s of sems) if (res['h' + s]) CACHE.set(chaveCache(cfgBase(s)), res['h' + s]);
  const tb = el('table', { class: 'compras' }, el('tr', {}, ...['Marco', 'Antes', 'Só esta mudança'].map(t => el('th', {}, t))));
  for (const m of MARCOS) { const h = marcoInfo(hj, m, {}, ''), a = marcoInfo(sj, m, {}, ''), d = h.med != null && a.med != null ? a.med - h.med : null; tb.append(el('tr', {}, el('td', {}, m === 400000 ? 'Órbita' : fmtM(m)), el('td', { class: 'mut' }, h.n ? hm(h.med) : '—'), el('td', { class: d == null ? '' : d < -30 ? 'up' : d > 30 ? 'dn' : '' }, a.n ? hm(a.med) + (d != null && Math.abs(d) >= 30 ? ` (${difMin(d)})` : '') : '—'))); }
  const cH = mediaDe(hj, r => r.compras[k] || 0), cA = mediaDe(sj, r => r.compras[k] || 0);
  box.replaceChildren(el('h3', { style: 'margin:14px 0 6px' }, 'Impacto só desta mudança'), tb, el('p', { class: 'hint' }, `Comprada pelo robô: ${dec(Math.round(cA * 10) / 10)} vezes (antes ${dec(Math.round(cH * 10) / 10)}) · maior espera ${minSeg(mediaDe(sj, r => r.maiorEspera))} (antes ${minSeg(mediaDe(hj, r => r.maiorEspera))})`));
  status('pronto');
}
function tabelaCmp(titulo, linhas) { // linhas: [{ n, lista }]
  const cols = [...MARCOS.map(m => [m === 400000 ? 'Órbita' : fmtM(m), l => marcoInfo(l, m, {}, '').med, hm, true]), ['Caíram', l => mediaDe(l, r => r.quedas.length), v => dec(Math.round(v * 10) / 10), true], ['Maior espera', l => mediaDe(l, r => r.maiorEspera), minSeg, true], ['Melhor altura', l => mediaDe(l, r => r.melhor), fmtM, false]];
  const vals = linhas.map(L => cols.map(c => c[1](L.lista)));
  const melhor = cols.map((c, j) => { const v = vals.map(x => x[j]).filter(x => x != null); return v.length ? (c[3] ? Math.min(...v) : Math.max(...v)) : null; });
  const tb = el('table', { class: 'cmp' }, el('tr', {}, el('th', {}, ''), ...cols.map(c => el('th', {}, c[0]))));
  linhas.forEach((L, i) => tb.append(el('tr', {}, el('td', { style: 'font-family:Rubik;font-weight:500' }, L.n), ...cols.map((c, j) => el('td', { class: vals[i][j] != null && vals[i][j] === melhor[j] && linhas.length > 1 ? 'best' : '' }, vals[i][j] == null ? '—' : c[2](vals[i][j]))))));
  $('cmpT').textContent = titulo; $('cmp').replaceChildren(tb, el('p', { class: 'hint' }, 'Verde = o melhor de cada coluna. Média das sementes; "—" = nenhuma semente chegou.')); $('cmpBox').hidden = false;
  $('cmpBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function compararBuilds() {
  const sems = Array.from({ length: Math.min(3, +CFG.sementes) }, (_, i) => i + 1), tar = [], m = limpo(M);
  for (const b of BUILDS_PRONTAS) for (const s of sems) tar.push({ chave: b.id + '|' + s, cfg: { ...cfgBase(s), robo: b.robo, build: b.build, mudancas: m } });
  status(`comparando ${BUILDS_PRONTAS.length} builds (${tar.length} partidas)…`, true);
  const t0 = performance.now(), res = await rodar(tar, () => status(`comparando builds… ${Object.keys(RES.prog).length}`, true));
  tabelaCmp(`Builds prontas ${vazio(M) ? '(jogo de hoje)' : '(com suas mudanças)'} · ${CFG.modo === 'risco' ? 'torre única' : 'corrida'} · ${CFG.horas} h`, BUILDS_PRONTAS.map(b => ({ n: b.n, lista: sems.map(s => res[b.id + '|' + s]) })));
  status(`builds prontas em ${((performance.now() - t0) / 1000).toFixed(1)} s`);
}
async function compararCenarios(lista) {
  const sems = Array.from({ length: Math.min(3, +CFG.sementes) }, (_, i) => i + 1), tar = [];
  for (const c of lista) for (const s of sems) tar.push({ chave: c.n + '|' + s, cfg: { ...cfgBase(s), mudancas: c.m } });
  status(`comparando ${lista.length} cenários…`, true);
  const t0 = performance.now(), res = await rodar(tar);
  tabelaCmp(`Cenários · robô ${CFG.robo} · ${BUILDS[CFG.build].split(':')[0]}`, lista.map(c => ({ n: c.n, lista: sems.map(s => res[c.n + '|' + s]) })));
  status(`cenários em ${((performance.now() - t0) / 1000).toFixed(1)} s`);
}

// ---------- cenários (prontos e salvos) ----------
const salvos = () => lsLer('torre-lab-cenarios', {});
function abrirCenarios() {
  const box = $('cenLista'); box.innerHTML = '';
  const item = (n, d, m, apagar) => box.append(el('div', { class: 'cen' }, el('input', { type: 'checkbox', 'data-n': n }), el('div', {}, el('b', {}, n), el('small', {}, d)),
    el('div', {}, el('button', { class: 'btn sm', onclick: () => { marca(); M = Object.assign(VAZIO(), copia(m)); $('dlgCen').close(); mudanca(); } }, 'Abrir'), apagar ? el('button', { class: 'btn sm red', style: 'margin-left:6px', onclick: () => { const s = salvos(); delete s[n]; lsGravar('torre-lab-cenarios', s); abrirCenarios(); } }, 'Apagar') : '')));
  box.append(el('div', { class: 'ramo', style: '--c:#f2b630' }, 'PRONTOS'));
  for (const c of CENARIOS) item(c.n, c.d, c.m);
  const s = salvos();
  if (Object.keys(s).length) { box.append(el('div', { class: 'ramo', style: '--c:#9fd0a8' }, 'SALVOS POR VOCÊ')); for (const n in s) item(n, 'Salvo neste navegador', s[n], true); }
  if (!$('dlgCen').open) $('dlgCen').showModal();
}
function cenarioPorNome(n) { const c = CENARIOS.find(x => x.n === n); if (c) return { n, m: c.m }; const s = salvos(); return s[n] ? { n, m: s[n] } : null; }

// ---------- exportar / importar ----------
function exportar() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ versao: 1, gerado: new Date().toISOString(), config: CFG, mudancas: limpo(M) }, null, 2)], { type: 'application/json' }));
  a.download = 'torre-laboratorio-arvore.json'; a.click();
}
async function importar(arq) { try { const o = JSON.parse(await arq.text()); marca(); M = Object.assign(VAZIO(), o.mudancas || o); mudanca(); } catch (e) { alert('Arquivo inválido: ' + e.message); } }

// ---------- início ----------
function iniciar() {
  for (const [id, t] of Object.entries(BUILDS)) $('cfBuild').append(el('option', { value: id }, t.split(':')[0]));
  for (const [id, campo] of [['cfRobo', 'robo'], ['cfBuild', 'build'], ['cfModo', 'modo'], ['cfHoras', 'horas'], ['cfSem', 'sementes']]) { $(id).value = String(CFG[campo]); $(id).onchange = () => { CFG[campo] = $(id).value; guardar(); simular(); }; }
  $('cfBuild').title = BUILDS[CFG.build];
  $('cfAuto').checked = CFG.auto !== false; $('cfAuto').onchange = () => { CFG.auto = $('cfAuto').checked; guardar(); };
  $('btSim').onclick = simular;
  $('btDesfazer').onclick = () => { if (!desfazer.length) return; M = JSON.parse(desfazer.pop()); guardar(); chips(); montarArvore(); montarRegras(); if (CFG.auto) simular(); };
  $('btCen').onclick = abrirCenarios;
  $('btBuilds').onclick = compararBuilds;
  $('btExport').onclick = exportar;
  $('btImport').onchange = e => { if (e.target.files[0]) importar(e.target.files[0]); e.target.value = ''; };
  $('btNova').onclick = abrirNova; $('novaCriar').onclick = criarNova;
  $('cmpFechar').onclick = () => { $('cmpBox').hidden = true; };
  $('cenSalvar').onclick = () => { const n = $('cenNome').value.trim(); if (!n) return; const s = salvos(); s[n] = limpo(M); lsGravar('torre-lab-cenarios', s); $('cenNome').value = ''; abrirCenarios(); };
  $('cenComparar').onclick = () => { const marcados = [...document.querySelectorAll('#cenLista input:checked')].map(i => cenarioPorNome(i.dataset.n)).filter(Boolean); if (!marcados.length) return; $('dlgCen').close(); compararCenarios(marcados); };
  for (const b of document.querySelectorAll('[data-fecha]')) b.onclick = () => b.closest('dialog').close();
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('detalhe').hidden) { $('detalhe').hidden = true; aberto = null; } });
  chips(); montarArvore(); montarRegras(); desenharResultado(); simular();
}
iniciar();
window.lab = { get M() { return M; }, get RES() { return RES; }, simular, CACHE };
