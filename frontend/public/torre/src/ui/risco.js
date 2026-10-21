// Modo com risco: barra de integridade embaixo do dia, aviso da próxima ameaça, efeitos na cena, tela de fim de ano
// (3 prêmios, escolher 1) e tela do desabamento (escolher 1 prêmio para guardar e começar uma torre nova).
import { S, save } from '../sim/state.js';
import { AMEACAS, riscoState, danoDe, avisando, segExigida, escolherPremio, premiosDaTentativa } from '../sim/risco.js';
import { PREMIOS } from '../data/premios.js';
import { UP } from '../data/upgrades.js';
import { repPct } from '../sim/prestige.js';
import { towerFx, weatherFx, ARTE_RISCO } from '../render/riscoFx.js';
import { art } from '../render/assets.js';
import { dust } from '../render/particles.js';
import { FH, TW, TL } from '../data/constants.js';
import { zoomBy, sy } from '../render/camera.js';
import { showNews } from './intro.js';
import { fmt, fmtM, fmtPct } from './format.js';
import { sfx, tickClima } from './audio.js';

const $ = id => document.getElementById(id);
let onNext = null, fall = null, ultimoLog = 0, guardar = null, ultimaAtiva = null;
const SOM_CHEGADA = { sismo: 'racha', recalque: 'racha', tsunami: 'onda', gelo: 'gelo' };
// nome da defesa que protege de cada ameaça (aparece no aviso e no dano)
const defesa = t => AMEACAS[t] && UP[AMEACAS[t].def] ? UP[AMEACAS[t].def].n : '';
const ICON = { vento: '🌬️', furacao: '🌀', chuva: '🌧️', nevasca: '❄️', sismo: '⚠️', recalque: '🧱', fiscal: '🦺', tsunami: '🌊', raios: '⚡', granizo: '🧊', gelo: '🧊', ventoAlt: '🌬️', meteoros: '☄️', solar: '☀️' };
const cartao = (id, cls) => { const p = PREMIOS[id]; return `<button type="button" class="${cls}" data-premio="${id}"><img src="assets/icones/${p.icon}.png" alt=""><b>${p.n}</b><small>${p.d}</small></button>`; };

export function initRisco(o) {
  onNext = o.onNext;
  // arte das intempéries e das fachadas avariadas: baixa logo ao abrir este modo
  ARTE_RISCO.forEach(art); for (let e = 0; e < 7; e++) { art('fachadas/' + e + '-trincada'); art('fachadas/' + e + '-quebrada'); }
  const css = document.createElement('style');
  css.textContent = `
  .rk-bar{margin-top:4px;width:118px}
  .rk-bar>i{background:#6fd08c!important;box-shadow:none!important}
  .rk-bar.mid>i{background:#f2b630!important}.rk-bar.low>i{background:#e8553f!important}
  .rk-bar>span{position:relative;display:block;text-align:center;font:700 10px/18px "Chakra Petch";color:#fff;text-shadow:0 1px 2px #000}
  .rk-warn{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:40;background:rgba(20,18,30,.9);border:1px solid #f2b630;color:#f2b630;
    font:600 14px "Chakra Petch";padding:7px 14px;border-radius:8px;pointer-events:none;max-width:92vw;text-align:center;line-height:1.3}
  .rk-warn small{display:block;font:500 12px Rubik;opacity:.9}
  @media (max-width:640px){.rk-warn{top:200px;font-size:13px}}
  .rk-warn.fatal{border-color:#e8553f;background:rgba(150,30,20,.92);color:#fff;animation:rkp .6s infinite alternate}
  .rk-warn.now{border-color:#e8553f;background:rgba(120,20,20,.94);color:#fff}
  @keyframes rkp{to{transform:translateX(-50%) scale(1.04)}}
  .rk-over{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(10,8,16,.62);text-align:center;padding:16px;color:#f4efe6}
  .rk-over h2{margin:0;font:700 40px "Chakra Petch";color:#e8553f;text-shadow:0 3px 0 #000}
  .rk-over p{margin:0;max-width:460px;font-family:Rubik;line-height:1.45;text-shadow:0 1px 2px #000}
  .rk-over>button{font:700 18px "Chakra Petch";background:#f2b630;color:#1b1622;border:0;border-radius:10px;padding:12px 26px;cursor:pointer}
  .rk-over h2.ok{color:#6fd08c}
  .rk-cards{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;max-width:700px}
  .rk-premio,.rk-guardar{width:200px;min-height:150px;background:#221f2e;color:#f4efe6;border:2px solid #4b4560;border-radius:12px;padding:12px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:5px;transition:transform .12s,border-color .12s}
  .rk-premio:hover,.rk-premio:focus-visible,.rk-guardar.sel{transform:translateY(-4px);border-color:#f2b630;outline:none}
  .rk-premio img,.rk-guardar img{width:36px;height:36px;image-rendering:pixelated}
  .rk-premio b,.rk-guardar b{font:700 15px "Chakra Petch"}
  .rk-premio small,.rk-guardar small{font:13px/1.35 Rubik;color:#c9e9c9}
  .rk-guardar{min-height:0;position:relative}.rk-guardar.sel::after{content:'✓ Guardar este';position:absolute;top:-11px;right:8px;background:#f2b630;color:#1b1622;font:700 11px "Chakra Petch";padding:2px 8px;border-radius:8px}.rk-guardar.sel{background:#2d2a1c}
  @media (max-width:640px){.rk-premio,.rk-guardar{width:calc(33% - 8px);padding:8px}.rk-premio{min-height:140px}.rk-premio b,.rk-guardar b{font-size:12px}.rk-premio small,.rk-guardar small{font-size:11px}.rk-over h2{font-size:30px}}`;
  document.head.appendChild(css);
  ultimoLog = riscoState().log.length; // golpes de antes de recarregar não voltam como aviso
  const bar = document.createElement('div');
  bar.className = 'day-bar rk-bar'; bar.id = 'rkBar'; bar.innerHTML = '<i id="rkFill"></i><span id="rkTxt">INTEGRIDADE</span>';
  bar.title = 'Integridade da torre: chegando a zero, ela desaba e a obra é perdida';
  $('hPlateFloor').appendChild(bar);
  const w = document.createElement('div'); w.className = 'rk-warn'; w.id = 'rkWarn'; w.hidden = true; document.body.appendChild(w);
  const ov = document.createElement('div'); ov.className = 'rk-over'; ov.id = 'rkOver'; ov.hidden = true;
  ov.innerHTML = '<h2>A TORRE DESABOU</h2><p id="rkOverTxt"></p><p id="rkGuardaTxt"></p><div class="rk-cards" id="rkGuarda"></div><button id="rkNext">Começar uma nova torre</button>';
  document.body.appendChild(ov);
  $('rkNext').onclick = () => { ov.hidden = true; fall = null; if (onNext) onNext(guardar); };
  $('rkGuarda').onclick = e => { const b = e.target.closest('.rk-guardar'); if (!b) return; guardar = b.dataset.premio; for (const c of $('rkGuarda').children) c.classList.toggle('sel', c === b); };
  // fim do ano sobrevivido: 3 prêmios, tocar escolhe
  const an = document.createElement('div'); an.className = 'rk-over'; an.id = 'rkAno'; an.hidden = true;
  an.innerHTML = '<h2 class="ok" id="rkAnoT">ANO 1 CONCLUÍDO</h2><p id="rkAnoTxt"></p><div class="rk-cards" id="rkPremios"></div>';
  document.body.appendChild(an);
  $('rkPremios').onclick = e => { const b = e.target.closest('.rk-premio'); if (!b || !escolherPremio(b.dataset.premio)) return; an.hidden = true; save(); sfx('buy'); };
}

// interface (a cada 0,2 s): barra, aviso e o que aconteceu
export function tickRisco(paused, bloqueado) {
  const s = riscoState(), p = s.integ / s.max;
  if (bloqueado) { $('rkAno').hidden = true; $('rkOver').hidden = true; } // Início ou abertura na frente
  else if (fall && fall.done && $('rkOver').hidden) $('rkOver').hidden = false;
  $('rkFill').style.width = `${p * 100}%`;
  $('rkBar').className = 'day-bar rk-bar' + (p <= 0.25 ? ' low' : p <= 0.5 ? ' mid' : '');
  $('rkTxt').textContent = `INTEGRIDADE ${Math.ceil(s.integ)}`;
  const w = $('rkWarn');
  if (S.colapso || paused || S.roundOver) w.hidden = true;
  else if (s.ativa) {
    const a = s.ativa; w.hidden = false; w.className = 'rk-warn now';
    w.textContent = a.tipo === 'fiscal' ? (a.ok ? '🦺 Fiscalização: obra aprovada' : `🦺 OBRA EMBARGADA · multa R$ ${fmt(a.multa)}`) : `${ICON[a.tipo]} ${AMEACAS[a.tipo].n.toUpperCase()} −${a.dano}`;
  } else if (s.embargo > 0) { w.hidden = false; w.className = 'rk-warn now'; w.textContent = `🦺 Obra embargada: ${Math.ceil(s.embargo)} s`; }
  else if (avisando()) {
    const t = s.prox.tipo, d = danoDe(t), fatal = t !== 'fiscal' && d >= s.integ;
    w.hidden = false; w.className = 'rk-warn' + (fatal ? ' fatal' : '');
    w.textContent = t === 'fiscal'
      ? `🦺 Fiscalização do Ministério do Trabalho em ${Math.ceil(s.prox.em)} s · exige Segurança ${segExigida()} (você tem ${S.lv.seguranca || 0})`
      : `${ICON[t]} ${AMEACAS[t].n} em ${Math.ceil(s.prox.em)} s · dano ~${d}${fatal ? ' · DERRUBA A TORRE' : ''}`;
    if (t !== 'fiscal') w.insertAdjacentHTML('beforeend', `<small>Protege: ${defesa(t)}</small>`);
  } else w.hidden = true;
  // cada golpe vira aviso (fica até tocar), uma vez
  if (s.log.length > ultimoLog) {
    for (const e of s.log.slice(ultimoLog)) {
      if (e.tipo === 'fiscal' && e.falta > 0) sfx('apito');
      if (e.tipo === 'seguro') showNews('SEGURO DE OBRA', 'O seguro segurou a torre de pé com 1 de integridade. Ele não vale de novo nesta torre.');
      else if (!AMEACAS[e.tipo]) continue;
      else if (e.tipo === 'fiscal') showNews('MINISTÉRIO DO TRABALHO', e.falta > 0 ? `Obra embargada: a fiscalização exigia Segurança do trabalho ${segExigida()}. Obra parada e multa no caixa.` : 'Fiscalização aprovou a obra: equipamentos de segurança em dia.');
      else if (!S.colapso) showNews('DANO NA ESTRUTURA', `${AMEACAS[e.tipo].n}: −${e.dano} de integridade. Quem protege: ${defesa(e.tipo)}.`);
    }
    ultimoLog = s.log.length;
  }
  // fim do ano: a tela dos prêmios (também depois de recarregar a página)
  const an = $('rkAno');
  if (s.fimAno && an.hidden && !S.colapso && !bloqueado) {
    const g = s.ganhoAno || 0;
    $('rkAnoT').textContent = `ANO ${s.ano} CONCLUÍDO`;
    $('rkAnoTxt').textContent = `A torre aguentou mais um ano com ${fmtM(S.maxAlt)}. Reputação ${fmtPct(repPct(g))} (total ${fmtPct(repPct(S.pontosTotal || 0))}). A integridade que sobrou (${Math.ceil(s.integ)}) vira reforço: integridade máxima +${s.reforco || 0} no próximo ano. Escolha um prêmio: ele vale até a torre cair.`;
    $('rkPremios').innerHTML = (s.oferta || []).map(id => cartao(id, 'rk-premio')).join('');
    an.hidden = false; sfx('entrega');
  } else if (!s.fimAno && !an.hidden) an.hidden = true;
  if (S.colapso && !fall) { fall = { t: 0, f0: S.colapso.f0, dir: Math.random() < 0.5 ? -1 : 1 }; zoomBy(0.01); sfx('desabamento'); sfx('desabamento2', 0.4); sfx('multa', 3); }
}
export const resetRisco = () => { fall = null; ultimoLog = riscoState().log.length; guardar = null; $('rkOver').hidden = true; $('rkAno').hidden = true; };

// efeitos na cena (a cada quadro, depois de render())
const VENTO = ['vento', 'furacao', 'ventoAlt'], TREME = ['sismo', 'recalque', 'tsunami'], CLIMA = ['chuva', 'nevasca', 'granizo', 'raios', 'gelo', 'meteoros', 'solar'];
export function riscoFx(dt, t, mudo = false) {
  const s = riscoState(), a = s.ativa;
  if (fall && !S.colapso) { fall = null; $('rkOver').hidden = true; } // Recomeçar ou outro espaço no meio da queda
  if (fall && fall.done) return; // a torre já caiu: a tela do desabamento está aberta e a cena fica parada (sem efeitos)
  if (fall) {
    fall.t += dt;
    S.floors = Math.max(0, fall.f0 * (1 - Math.min(1, Math.pow(Math.max(0, fall.t - 0.6) / 2.8, 1.6))));
    if (fall.t < 3.2 && Math.random() < .6) { const y = Math.floor(S.floors) * FH; for (let i = 0; i < 4; i++) dust(TL + Math.random() * TW, y, i % 2 ? '#8a7f70' : '#d8cdb8', 4, 2); }
    towerFx({ lean: fall.dir * 0.8 * Math.min(1, Math.pow(fall.t / 2, 2)) * leanSpan(fall.f0), shake: 8 * Math.max(0, 1 - fall.t / 3), f0: fall.f0 });
    weatherFx({ tipo: 'sismo', forca: 1, t, dt }); // entulho e poeira despencando
    if (fall.t > 3.6 && !fall.done) {
      fall.done = true;
      const c = S.colapso;
      const anos = c.anos || 0, lista = premiosDaTentativa();
      $('rkOverTxt').textContent = `${AMEACAS[c.tipo] ? AMEACAS[c.tipo].n : 'A obra'} derrubou a torre com ${fmtM(c.alt)}. Ela aguentou ${anos} ano${anos === 1 ? '' : 's'}. A Reputação fica (${fmtPct(repPct(S.pontosTotal || 0))}).`;
      guardar = lista[0] || null;
      $('rkGuardaTxt').textContent = lista.length ? 'Toque no prêmio que vai com você para a próxima torre (o marcado com ✓):' : '';
      $('rkGuarda').innerHTML = lista.map(id => cartao(id, 'rk-guardar' + (id === guardar ? ' sel' : ''))).join('');
      $('rkOver').hidden = false; save();
    }
    return;
  }
  if (a && a !== ultimaAtiva) { ultimaAtiva = a; if (SOM_CHEGADA[a.tipo]) sfx(SOM_CHEGADA[a.tipo]); } // som de chegada de cada ameaça
  let lean = 0, shake = 0;
  const forca = a ? Math.min(1, a.forca || 0.4) : 0, fade = a ? Math.min(1, a.left / 1.2) : 0;
  if (a && VENTO.includes(a.tipo)) lean = (6 + 80 * forca) * Math.sin(t * 2 * Math.PI * 0.9) * fade;
  else if (avisando() && VENTO.includes(s.prox.tipo)) lean = 2 * Math.sin(t * 4);
  if (a && TREME.includes(a.tipo)) shake = (3 + 18 * forca) * fade * (a.tipo === 'tsunami' ? Math.max(0, 1 - a.left / 2) : 1);
  towerFx({ lean, shake, dano: 1 - s.integ / s.max });
  // o clima da ameaça continua enquanto a obra está mais lenta (chuva, nevasca)
  if (a && CLIMA.includes(a.tipo)) s.clima = a.tipo;
  const tipo = a && a.tipo !== 'fiscal' ? a.tipo : (s.lento > 0 ? s.clima : null);
  weatherFx({ tipo, forca, prog: a ? 1 - a.left / 4 : 1, aviso: !tipo && avisando() ? s.prox.tipo : null, t, dt });
  tickClima({ tipo: dt > 0 && !mudo ? tipo : null, forca, aviso: !tipo && avisando() ? s.prox.tipo : null, dt }); // som das intempéries (pausado = mudo)
}
// altura do tombo em pixels de tela (a torre de antes de desmoronar)
const leanSpan = f0 => Math.max(40, sy(0) - sy((f0 + 1) * FH));
