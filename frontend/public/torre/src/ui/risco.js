// Protótipo com risco: barra de integridade embaixo do dia, aviso da próxima ameaça, efeitos na cena e desabamento.
import { S, save } from '../sim/state.js';
import { AMEACAS, riscoState, danoDe, avisando, segExigida } from '../sim/risco.js';
import { towerFx } from '../render/riscoFx.js';
import { dust } from '../render/particles.js';
import { FH, TW, TL } from '../data/constants.js';
import { zoomBy, sy } from '../render/camera.js';
import { showNews } from './intro.js';
import { fmt, fmtM } from './format.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
let onNext = null, fall = null, ultimoLog = 0;
const ICON = { vento: '🌬️', furacao: '🌀', chuva: '🌧️', nevasca: '❄️', areia: '🏜️', sismo: '⚠️', recalque: '🧱', fiscal: '🦺' };

export function initRisco(o) {
  onNext = o.onNext;
  const css = document.createElement('style');
  css.textContent = `
  .rk-bar{margin-top:4px;width:118px}
  .rk-bar>i{background:#6fd08c!important;box-shadow:none!important}
  .rk-bar.mid>i{background:#f2b630!important}.rk-bar.low>i{background:#e8553f!important}
  .rk-bar>span{position:relative;display:block;text-align:center;font:700 10px/18px "Chakra Petch";color:#fff;text-shadow:0 1px 2px #000}
  .rk-warn{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:40;background:rgba(20,18,30,.9);border:1px solid #f2b630;color:#f2b630;
    font:600 14px "Chakra Petch";padding:7px 14px;border-radius:8px;pointer-events:none;white-space:nowrap;max-width:94vw;overflow:hidden;text-overflow:ellipsis}
  .rk-warn.fatal{border-color:#e8553f;background:rgba(150,30,20,.92);color:#fff;animation:rkp .6s infinite alternate}
  .rk-warn.now{border-color:#e8553f;background:rgba(120,20,20,.94);color:#fff}
  @keyframes rkp{to{transform:translateX(-50%) scale(1.04)}}
  .rk-over{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(10,8,16,.62);text-align:center;padding:16px;color:#f4efe6}
  .rk-over h2{margin:0;font:700 40px "Chakra Petch";color:#e8553f;text-shadow:0 3px 0 #000}
  .rk-over p{margin:0;max-width:460px;font-family:Rubik;line-height:1.45;text-shadow:0 1px 2px #000}
  .rk-over button{font:700 18px "Chakra Petch";background:#f2b630;color:#1b1622;border:0;border-radius:10px;padding:12px 26px;cursor:pointer}`;
  document.head.appendChild(css);
  const bar = document.createElement('div');
  bar.className = 'day-bar rk-bar'; bar.id = 'rkBar'; bar.innerHTML = '<i id="rkFill"></i><span id="rkTxt">INTEGRIDADE</span>';
  bar.title = 'Integridade da torre: chegando a zero, ela desaba e a obra é perdida';
  $('hPlateFloor').appendChild(bar);
  const w = document.createElement('div'); w.className = 'rk-warn'; w.id = 'rkWarn'; w.hidden = true; document.body.appendChild(w);
  const ov = document.createElement('div'); ov.className = 'rk-over'; ov.id = 'rkOver'; ov.hidden = true;
  ov.innerHTML = '<span style="font:600 12px Chakra Petch;letter-spacing:2px;color:#b8b0a4">OBRA PERDIDA</span><h2>A TORRE DESABOU</h2><p id="rkOverTxt"></p><button id="rkNext">Começar a próxima obra</button>';
  document.body.appendChild(ov);
  $('rkNext').onclick = () => { ov.hidden = true; fall = null; S.roundOver = true; S.roundPaid = true; if (onNext) onNext(); };
}

// interface (a cada 0,2 s): barra, aviso e o que aconteceu
export function tickRisco(paused) {
  const s = riscoState(), p = s.integ / s.max;
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
  } else w.hidden = true;
  // cada golpe vira aviso (fica até tocar), uma vez
  if (s.log.length > ultimoLog) {
    for (const e of s.log.slice(ultimoLog)) {
      if (e.tipo === 'fiscal') showNews('MINISTÉRIO DO TRABALHO', e.falta > 0 ? `Obra embargada: a fiscalização exigia Segurança do trabalho ${segExigida()}. Obra parada e multa no caixa.` : 'Fiscalização aprovou a obra: equipamentos de segurança em dia.');
      else if (!S.colapso) showNews('DANO NA ESTRUTURA', `${AMEACAS[e.tipo].n}: −${e.dano} de integridade.`);
    }
    ultimoLog = s.log.length;
  }
  if (S.colapso && !fall) { fall = { t: 0, f0: S.colapso.f0, dir: Math.random() < 0.5 ? -1 : 1 }; zoomBy(0.01); sfx('multa'); }
}
export const resetRisco = () => { fall = null; ultimoLog = 0; $('rkOver').hidden = true; };

// efeitos na cena (a cada quadro, depois de render())
export function riscoFx(dt, t) {
  const s = riscoState(), a = s.ativa;
  if (fall) {
    fall.t += dt;
    S.floors = Math.max(0, fall.f0 * (1 - Math.min(1, Math.pow(Math.max(0, fall.t - 0.6) / 2.8, 1.6))));
    if (Math.random() < .6) { const y = Math.floor(S.floors) * FH; for (let i = 0; i < 4; i++) dust(TL + Math.random() * TW, y, i % 2 ? '#8a7f70' : '#d8cdb8', 4, 2); }
    towerFx({ lean: fall.dir * 0.8 * Math.min(1, Math.pow(fall.t / 2, 2)) * leanSpan(fall.f0), shake: 8 * Math.max(0, 1 - fall.t / 3), dano: 1, f0: fall.f0, dt, t });
    if (fall.t > 3.6 && $('rkOver').hidden && !fall.done) {
      fall.done = true;
      const c = S.colapso;
      $('rkOverTxt').textContent = `${AMEACAS[c.tipo].n} derrubou a torre com ${fmtM(c.alt)}. A obra não foi entregue: sem Reputação e sem torre no portfólio. Na próxima, reforce a estrutura antes de subir tanto.`;
      $('rkOver').hidden = false; save();
    }
    return;
  }
  let lean = 0, shake = 0, clima = null;
  const venta = tp => tp === 'vento' || tp === 'furacao';
  if (a && venta(a.tipo)) lean = (6 + 80 * Math.min(1, a.forca)) * Math.sin(t * 2 * Math.PI * 0.9) * Math.min(1, a.left / 1.2);
  else if (avisando() && venta(s.prox.tipo)) lean = 2 * Math.sin(t * 4);
  if (a && (a.tipo === 'sismo' || a.tipo === 'recalque')) shake = (3 + 18 * Math.min(1, a.forca)) * Math.min(1, a.left / 1.2);
  // chuva, neve e areia continuam enquanto a obra está mais lenta
  if (a && ['chuva', 'nevasca', 'areia'].includes(a.tipo)) s.clima = a.tipo;
  if (s.lento > 0) clima = s.clima || null;
  towerFx({ lean, shake, dano: 1 - s.integ / s.max, clima, dt, t });
}
// altura do tombo em pixels de tela (a torre de antes de desmoronar)
const leanSpan = f0 => Math.max(40, sy(0) - sy((f0 + 1) * FH));
