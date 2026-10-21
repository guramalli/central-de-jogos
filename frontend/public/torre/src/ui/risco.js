// Modo com risco: barra de integridade embaixo do dia, aviso da próxima ameaça, efeitos na cena, tela de fim de ano
// (3 prêmios, escolher 1) e tela do desabamento (escolher 1 prêmio para guardar e começar uma torre nova).
import { S, save } from '../sim/state.js';
import { AMEACAS, riscoState, danoDe, avisando, segExigida, escolherPremio, premiosDaTentativa, cumprirReforco, nomeDef, RISCO, retencao, nomeAmeaca } from '../sim/risco.js';
import { PREMIOS } from '../data/premios.js';
import { UP } from '../data/upgrades.js';
import { repPct } from '../sim/prestige.js';
import { towerFx, weatherFx, interdFx, ARTE_RISCO, iniciarQueda, quedaFx, quedaCam, pararQueda } from '../render/riscoFx.js';
import { art } from '../render/assets.js';
import { FH, TW, TL } from '../data/constants.js';
import { cam, setIntroCam } from '../render/camera.js';
import { showNews } from './intro.js';
import { cfg } from './config.js';
import { fmt, fmtM, fmtPct } from './format.js';
import { sfx, tickClima } from './audio.js';

const $ = id => document.getElementById(id);
let onNext = null, onExit = null, fall = null, ultimoLog = 0, guardar = null, ultimaAtiva = null, interdVista = null;
const SOM_CHEGADA = { sismo: 'racha', recalque: 'racha', tsunami: 'onda', gelo: 'gelo' };
// nome da defesa que protege de cada ameaça (aparece no aviso e no dano)
// recalque: vem de a torre estar perto do limite da fundação (o dano cresce até 5× no limite); o que resolve é a Fundação
// (dobra o limite), a Sondagem só ajuda um pouco (pedido do usuário, 21/10/2026: comprou Sondagem e o dano não caiu)
const defesa = t => t === 'recalque' ? 'Fundação reforçada (afasta do limite; a Sondagem ajuda pouco)' : AMEACAS[t] && UP[AMEACAS[t].def] ? UP[AMEACAS[t].def].n : '';
const ICON = { vento: '🌬️', furacao: '🌀', chuva: '🌧️', nevasca: '❄️', sismo: '⚠️', recalque: '🧱', fiscal: '🦺', tsunami: '🌊', raios: '⚡', granizo: '🧊', gelo: '🧊', ventoAlt: '🌬️', meteoros: '☄️', solar: '☀️' };
const cartao = (id, cls) => { const p = PREMIOS[id]; return `<button type="button" class="${cls}" data-premio="${id}"><img src="assets/icones/${p.icon}.png" alt=""><b>${p.n}</b><small>${p.d}</small></button>`; };

export function initRisco(o) {
  onNext = o.onNext; onExit = o.onExit;
  // arte das intempéries e das fachadas avariadas: baixa logo ao abrir este modo
  ARTE_RISCO.forEach(art); for (let e = 0; e < 7; e++) { art('fachadas/' + e + '-trincada'); art('fachadas/' + e + '-quebrada'); }
  for (const f of ['andar', 'carregar', 'furar', 'martelar', 'parado', 'sentado']) art('boneco-capa/' + f); // capa de chuva
  for (const f of ['andar', 'carregar', 'parado']) art('servente-capa/' + f); art('mestre-capa/andar'); art('mestre-capa/prancheta');
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
  .rk-warn.now.ok{border-color:#6fd08c;background:rgba(24,96,48,.94);color:#fff}
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
  .rk-over h2.int{color:#ff6b4a}.rk-nota{font-size:13px!important;color:#d8d0c4}
  .rk-reforco{width:220px;min-height:170px;background:#221f2e;color:#f4efe6;border:2px solid #4b4560;border-radius:12px;padding:12px;text-align:left;display:flex;flex-direction:column;gap:5px}
  .rk-reforco b{font:700 15px "Chakra Petch"}.rk-reforco small{font:13px/1.35 Rubik;color:#c9e9c9}
  .rk-reforco button{font:700 13px "Chakra Petch";border:0;border-radius:8px;padding:7px 8px;cursor:pointer;background:#f2b630;color:#1b1622}.rk-reforco button.parc{background:#3a3550;color:#f4efe6}
  .rk-reforco button.principal{background:#f2b630;color:#1b1622;animation:rkPulso .7s infinite alternate}@keyframes rkPulso{to{box-shadow:0 0 0 3px rgba(242,182,48,.45);filter:brightness(1.12)}}
  .rk-sem{max-width:640px;margin:0;padding:8px 12px;border:2px solid #f2b630;border-radius:10px;background:rgba(60,45,10,.85);color:#ffe7a6;font:600 14px/1.4 Rubik}.rk-sem[hidden]{display:none}
  .rk-reforco button:disabled{opacity:.45;cursor:default}.rk-reforco .rk-btns{margin-top:auto;display:flex;flex-direction:column;gap:5px}.rk-reforco i{font:12px Rubik;color:#ff8a78;font-style:normal}
  .rk-div{display:block;margin-top:2px;font:700 13px "Chakra Petch";color:#ff5a4a;text-align:right;text-shadow:0 1px 2px #000;font-variant-numeric:tabular-nums}
  .rk-acoes{display:flex;gap:10px;justify-content:center;margin-top:4px}
  .rk-acoes button{font:700 15px "Chakra Petch";border:0;border-radius:8px;padding:9px 22px;background:#3a3550;color:#f4efe6;cursor:pointer;min-width:120px}
  .rk-acoes button:hover{background:#4a4466}
  .sk-div{display:inline-block;margin-left:10px;font-size:14px;text-align:left;white-space:nowrap}.rk-div[hidden]{display:none}
  .rk-div small{display:block;font:600 10px "Chakra Petch";color:#ff9a8a}
  @media (max-width:640px){.rk-reforco{width:calc(33% - 8px);padding:8px;min-height:150px}.rk-reforco b{font-size:12px}.rk-reforco small{font-size:11px}.rk-reforco button{font-size:11px;padding:6px 4px}}
  .rk-guardar{min-height:0;position:relative}.rk-guardar.sel::after{content:'✓ Guardar este';position:absolute;top:-11px;right:8px;background:#f2b630;color:#1b1622;font:700 11px "Chakra Petch";padding:2px 8px;border-radius:8px}.rk-guardar.sel{background:#2d2a1c}
  @media (max-width:640px){.rk-premio,.rk-guardar{width:calc(33% - 8px);padding:8px}.rk-premio{min-height:140px}.rk-premio b,.rk-guardar b{font-size:12px}.rk-premio small,.rk-guardar small{font-size:11px}.rk-over h2{font-size:30px}}`;
  document.head.appendChild(css);
  ultimoLog = riscoState().log.length; // golpes de antes de recarregar não voltam como aviso
  const bar = document.createElement('div');
  bar.className = 'day-bar rk-bar'; bar.id = 'rkBar'; bar.innerHTML = '<i id="rkFill"></i><span id="rkTxt">INTEGRIDADE</span>';
  bar.title = 'Integridade da torre: chegando a zero, a obra é interditada';
  $('hPlateFloor').appendChild(bar);
  const dv = document.createElement('span'); dv.className = 'rk-div'; dv.id = 'rkDiv'; dv.hidden = true; $('hPlateMoney').appendChild(dv); // dívida em vermelho embaixo do dinheiro, caindo
  // e no cabeçalho da árvore de Melhorias, ao lado do dinheiro (no computador, com a árvore aberta a placa do dinheiro some)
  const dv2 = document.createElement('span'); dv2.className = 'rk-div sk-div'; dv2.id = 'skDiv'; dv2.hidden = true; $('skMoney').after(dv2);
  const w = document.createElement('div'); w.className = 'rk-warn'; w.id = 'rkWarn'; w.hidden = true; document.body.appendChild(w);
  const ov = document.createElement('div'); ov.className = 'rk-over'; ov.id = 'rkOver'; ov.hidden = true;
  ov.innerHTML = '<h2>A TORRE DESABOU</h2><p id="rkOverTxt"></p><p id="rkGuardaTxt"></p><div class="rk-cards" id="rkGuarda"></div><button id="rkNext">Começar uma nova torre</button>';
  document.body.appendChild(ov);
  $('rkNext').onclick = () => { ov.hidden = true; fimQueda(); if (onNext) onNext(guardar); };
  $('rkGuarda').onclick = e => { const b = e.target.closest('.rk-guardar'); if (!b) return; guardar = b.dataset.premio; for (const c of $('rkGuarda').children) c.classList.toggle('sel', c === b); };
  // obra interditada: laudo da Defesa Civil com 3 jeitos de reforçar (pagos com dinheiro)
  const it = document.createElement('div'); it.className = 'rk-over'; it.id = 'rkInterd'; it.hidden = true;
  it.innerHTML = '<h2 class="int">OBRA INTERDITADA</h2><p id="rkInterdTxt"></p><p class="rk-sem" id="rkSemDinheiro" hidden></p><div class="rk-cards" id="rkReforcos"></div><p class="rk-nota">Sem dinheiro? Parcele: a obra volta na hora e uma parte do aluguel (de 15% a 35%, conforme a dívida) vai pagando até quitar. Parcelado custa 20% a mais.</p>';
  document.body.appendChild(it);
  $('rkReforcos').onclick = e => { const b = e.target.closest('button[data-id]'); if (!b || b.disabled || !cumprirReforco(b.dataset.id, b.dataset.modo === 'parcelar')) return; it.hidden = true; interdVista = null; save(); sfx('buy'); showNews('DEFESA CIVIL', 'Reforço feito: a obra foi liberada e volta a subir.'); };
  // fim do ano sobrevivido: 3 prêmios, tocar escolhe
  const an = document.createElement('div'); an.className = 'rk-over'; an.id = 'rkAno'; an.hidden = true;
  an.innerHTML = '<h2 class="ok" id="rkAnoT">ANO 1 CONCLUÍDO</h2><p id="rkAnoTxt"></p><div class="rk-cards" id="rkPremios"></div>'
    + '<div class="rk-acoes"><button type="button" id="rkSalvar">Salvar</button><button type="button" id="rkSair">Sair</button></div>';
  document.body.appendChild(an);
  // entre os anos (pedido do usuário): Salvar grava e confirma; Sair grava e vai para o Início (a escolha do prêmio espera)
  $('rkSalvar').onclick = () => { save(); $('rkSalvar').textContent = 'Jogo salvo ✓'; };
  $('rkSair').onclick = () => { save(); an.hidden = true; if (onExit) onExit(); };
  $('rkPremios').onclick = e => { const b = e.target.closest('.rk-premio'); if (!b || !escolherPremio(b.dataset.premio)) return; an.hidden = true; save(); sfx('buy'); };
}

// interface (a cada 0,2 s): barra, aviso e o que aconteceu
export function tickRisco(paused, bloqueado) {
  const s = riscoState(), p = s.integ / s.max;
  if (bloqueado) { $('rkAno').hidden = true; $('rkOver').hidden = true; $('rkInterd').hidden = true; } // Início ou abertura na frente
  else if (fall && fall.done && $('rkOver').hidden) $('rkOver').hidden = false;
  $('rkFill').style.width = `${p * 100}%`;
  $('rkBar').className = 'day-bar rk-bar' + (p <= 0.25 ? ' low' : p <= 0.5 ? ' mid' : '');
  $('rkTxt').textContent = s.interd ? 'INTERDITADA' : `INTEGRIDADE ${Math.ceil(s.integ)}`;
  $('rkDiv').hidden = $('skDiv').hidden = !(s.divida > 0);
  if (s.divida > 0) { $('rkDiv').innerHTML = `−R$ ${fmt(s.divida)}<small>dívida · ${Math.round(100 * retencao())}% do aluguel</small>`; $('skDiv').textContent = `−R$ ${fmt(s.divida)} de dívida`; }
  const w = $('rkWarn');
  if (S.colapso || paused || S.roundOver) w.hidden = true;
  else if (s.interd) { w.hidden = false; w.className = 'rk-warn now'; w.textContent = '🚧 OBRA INTERDITADA · escolha um reforço para liberar'; }
  else if (s.ativa) {
    const a = s.ativa; w.hidden = false; w.className = 'rk-warn now' + (a.tipo === 'fiscal' && a.ok ? ' ok' : ''); // fiscalização aprovada: verde
    w.textContent = a.tipo === 'fiscal' ? (a.ok ? '🦺 Fiscalização: obra aprovada' : `🦺 OBRA EMBARGADA · multa R$ ${fmt(a.multa)}`) : `${ICON[a.tipo]} ${nomeAmeaca(a.tipo).toUpperCase()} −${a.dano}`;
  } else if (s.embargo > 0) { w.hidden = false; w.className = 'rk-warn now'; w.textContent = `🦺 Obra embargada: ${Math.ceil(s.embargo)} s`; }
  else if (avisando()) {
    const t = s.prox.tipo, d = danoDe(t), fatal = t !== 'fiscal' && d >= s.integ;
    w.hidden = false; w.className = 'rk-warn' + (fatal ? ' fatal' : '');
    w.textContent = t === 'fiscal'
      ? `🦺 Fiscalização do Ministério do Trabalho em ${Math.ceil(s.prox.em)} s · exige Segurança ${segExigida()} (você tem ${S.lv.seguranca || 0})`
      : `${ICON[t]} ${nomeAmeaca(t)} em ${Math.ceil(s.prox.em)} s · dano ~${d}${fatal ? (s.interdAno >= RISCO.interdMax - 1 ? ' · DERRUBA A TORRE' : ' · COMPROMETE A ESTRUTURA') : ''}`; // só antes da 3ª interdição do ano a torre cai
    if (t !== 'fiscal') w.insertAdjacentHTML('beforeend', `<small>Protege: ${defesa(t)}</small>`);
  } else w.hidden = true;
  // cada golpe vira aviso (fica até tocar), uma vez
  if (s.log.length > ultimoLog) {
    for (const e of s.log.slice(ultimoLog)) {
      if (e.tipo === 'fiscal' && e.falta > 0) sfx('apito');
      if (e.tipo === 'seguro') showNews('SEGURO DE OBRA', 'O seguro segurou a torre de pé com 1 de integridade. Ele não vale de novo nesta torre.');
      else if (!AMEACAS[e.tipo]) continue;
      else if (e.tipo === 'fiscal' && e.falta > 0) showNews('MINISTÉRIO DO TRABALHO', `Obra embargada: a fiscalização exigia Segurança do trabalho ${segExigida()}. Obra parada e multa no caixa.`);
      else if (e.tipo === 'fiscal') ensina('fiscal:ok', 'MINISTÉRIO DO TRABALHO', 'Fiscalização aprovou a obra: equipamentos de segurança em dia.');
      else if (!S.colapso) ensina('dano:' + e.tipo, 'DANO NA ESTRUTURA', `${nomeAmeaca(e.tipo)}: −${e.dano} de integridade. Quem protege: ${defesa(e.tipo)}.`);
    }
    ultimoLog = s.log.length;
  }
  // obra interditada: a tela do laudo (preço e o que falta atualizam com o dinheiro)
  const ti = $('rkInterd');
  if (s.interd && !S.colapso && !bloqueado) {
    if (interdVista !== s.interd) {
      interdVista = s.interd; sfx('multa');
      $('rkInterdTxt').textContent = `Laudo da Defesa Civil: ${AMEACAS[s.interd.tipo] ? AMEACAS[s.interd.tipo].n.toLowerCase() : 'a obra'} comprometeu a estrutura a ${fmtM(S.maxAlt)}. ${nomeDef(s.interd.def)} insuficiente. Interdição ${s.interdAno} neste ano: na ${RISCO.interdMax}ª, a torre é condenada e desaba. Escolha um reforço para liberar a obra:`;
      $('rkReforcos').innerHTML = s.interd.opcoes.map(o => `<div class="rk-reforco" data-id="${o.id}"><b>${o.n}</b><small>${o.d}</small><div class="rk-btns"><button type="button" data-id="${o.id}" data-modo="vista"></button><button type="button" class="parc" data-id="${o.id}" data-modo="parcelar">Parcelar: R$ ${fmt(Math.round(o.custo * (1 + RISCO.parcelaJuros)))}</button><i></i></div></div>`).join('');
    }
    // sem dinheiro para pagar à vista (o aluguel está parado): o Parcelar vira o botão principal e o aviso explica o caminho
    // (pedido do usuário, 21/10/2026: ficou preso no dia 365 sem perceber que dava para parcelar)
    let algumVista = false;
    for (const c of $('rkReforcos').children) {
      const o = s.interd.opcoes.find(x => x.id === c.dataset.id), falta = o.custo - S.money, bv = c.querySelector('[data-modo="vista"]'), bp = c.querySelector('[data-modo="parcelar"]');
      bv.textContent = `À vista: R$ ${fmt(o.custo)}`; bv.disabled = falta > 0; c.querySelector('i').textContent = falta > 0 ? `Faltam R$ ${fmt(falta)} para pagar à vista` : '';
      if (falta <= 0) algumVista = true;
    }
    for (const bp of $('rkReforcos').querySelectorAll('[data-modo="parcelar"]')) { bp.classList.toggle('principal', !algumVista); bp.classList.toggle('parc', algumVista); }
    const fimAno = S.roundLeft <= 0.06;
    $('rkSemDinheiro').hidden = algumVista;
    if (!algumVista) $('rkSemDinheiro').textContent = `Sem dinheiro para pagar à vista, e o aluguel está parado enquanto a obra estiver interditada. Toque em Parcelar: a obra volta na hora e uma parte do aluguel vai pagando a dívida.${fimAno ? ' O ano só termina depois do reforço.' : ''}`;
    ti.hidden = false;
  } else if (!ti.hidden) ti.hidden = true;
  // fim do ano: a tela dos prêmios (também depois de recarregar a página)
  const an = $('rkAno');
  if (s.fimAno && an.hidden && !S.colapso && !bloqueado) {
    const g = s.ganhoAno || 0;
    $('rkAnoT').textContent = `ANO ${s.ano} CONCLUÍDO`;
    $('rkAnoTxt').textContent = `A torre aguentou mais um ano com ${fmtM(S.maxAlt)}. Reputação ${fmtPct(repPct(g))} (total ${fmtPct(repPct(S.pontosTotal || 0))}). A integridade que sobrou (${Math.ceil(s.integ)}) vira reforço: integridade máxima +${s.reforco || 0} no próximo ano. Escolha um prêmio: ele vale até a torre cair.`;
    $('rkPremios').innerHTML = (s.oferta || []).map(id => cartao(id, 'rk-premio')).join('');
    $('rkSalvar').textContent = 'Salvar'; an.hidden = false; sfx('entrega');
  } else if (!s.fimAno && !an.hidden) an.hidden = true;
  if (S.colapso && !fall) { // começa a queda: física de blocos em render/riscoFx.js, câmera enquadrando a torre inteira
    fall = { t: 0, f0: S.colapso.f0, dir: Math.random() < 0.5 ? -1 : 1 }; iniciarQueda(fall.f0, fall.dir);
    const c0 = { cx: cam.cx, cy: cam.cy, z: cam.z }; setIntroCam(() => quedaCam(c0));
    sfx('desabamento'); sfx('multa', 3);
  }
}
const fimQueda = () => { fall = null; pararQueda(); setIntroCam(null); }; // a câmera volta a seguir a obra
export const resetRisco = () => { fimQueda(); ultimoLog = riscoState().log.length; guardar = null; interdVista = null; $('rkOver').hidden = true; $('rkAno').hidden = true; $('rkInterd').hidden = true; };

// avisos que ensinam (dano de cada intempérie, fiscalização aprovada): só na 1ª vez de cada tipo e só com as dicas ligadas
// (pedido do usuário, 21/10/2026: o aviso de dano aparecia a cada golpe e só fechava com um toque). O dano continua no aviso do topo.
function ensina(chave, titulo, txt) {
  if (cfg().dicas === false || (S.dicas && S.dicas[chave])) return;
  S.dicas = { ...(S.dicas || {}), [chave]: true }; showNews(titulo, txt);
}
// efeitos na cena (a cada quadro, depois de render())
const VENTO = ['vento', 'furacao', 'ventoAlt'], TREME = ['sismo', 'recalque', 'tsunami'], CLIMA = ['chuva', 'nevasca', 'granizo', 'raios', 'gelo', 'meteoros', 'solar'];
export function riscoFx(dt, t, mudo = false) {
  const s = riscoState(), a = s.ativa;
  if (fall && !S.colapso) { fimQueda(); $('rkOver').hidden = true; } // Recomeçar ou outro espaço no meio da queda
  if (fall && fall.done) return; // a torre já caiu: a tela do desabamento está aberta e a cena fica parada (sem efeitos)
  if (fall) {
    fall.t += dt;
    const q = quedaFx(dt); // toco desmoronando, parte de cima tombando e se partindo, escombros
    weatherFx({ tipo: null, t, dt }); // poeira e entulho dos impactos
    if (q.tremor > 0.3) towerFx({ shake: q.tremor });
    if (q.fim && !fall.done) {
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
  if (s.interd) interdFx();
  // o clima da ameaça continua enquanto a obra está mais lenta (chuva, nevasca)
  if (a && CLIMA.includes(a.tipo)) s.clima = a.tipo;
  const tipo = a && a.tipo !== 'fiscal' ? a.tipo : (s.lento > 0 ? s.clima : null);
  weatherFx({ tipo, forca, prog: a ? 1 - a.left / 4 : 1, aviso: !tipo && avisando() ? s.prox.tipo : null, t, dt });
  tickClima({ tipo: dt > 0 && !mudo ? tipo : null, forca, aviso: !tipo && avisando() ? s.prox.tipo : null, dt }); // som das intempéries (pausado = mudo)
}
