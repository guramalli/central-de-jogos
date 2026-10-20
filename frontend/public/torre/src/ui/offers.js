// Contratos de altura (Obra Viva): a proposta da vez aparece em 3 cartões no pé da cena por ~8 s de jogo, sem pausar;
// depois recolhe no botão "Proposta", que pisca até o jogador escolher. Escolher aplica o efeito (sim/contracts.js).
import { S, save } from '../sim/state.js';
import { offerNow, chooseContract } from '../sim/contracts.js';
import { CONTRACTS } from '../data/contracts.js';
import { FLAGS } from '../data/flags.js';
import { V } from '../render/view.js';
import { showNews } from './intro.js';
import { fmtM } from './format.js';
import { closeSkills, skillsOpen } from './skills.js';

const $ = id => document.getElementById(id);
const OPEN_SECS = 8;
let shownM = null, openUntil = -1, shownAt = -1;
const GUARD = 0.6; // s de jogo: um toque duplo não escolhe sem querer o cartão da proposta seguinte

function render(o) {
  $('offerT').textContent = `Proposta · ${fmtM(o.m)}`;
  const row = $('offerRow'); row.innerHTML = '';
  for (const id of o.cards) {
    const c = CONTRACTS[id], b = document.createElement('button');
    b.type = 'button'; b.className = 'of-card'; b.dataset.c = id;
    b.innerHTML = `<b>${c.n}</b><i>${c.d}</i>`;
    b.onclick = () => {
      if (V.t - shownAt < GUARD || !chooseContract(id)) return;
      save(); openUntil = -1; showNews('CONTRATO FECHADO', `${c.n}: ${c.d}`); updateOffers();
    };
    row.appendChild(b);
  }
}

export const resetOffers = () => { shownM = null; openUntil = -1; }; // troca de espaço

export function initOffers() {
  if (!FLAGS.viva) return;
  $('offerBtn').onclick = () => { openUntil = Infinity; updateOffers(); }; // reaberta pelo botão: fica até escolher
  $('skOffer').onclick = () => { closeSkills(); openUntil = Infinity; updateOffers(); }; // com a árvore aberta, o aviso fica no topo dela
  // tocar fora dos cartões recolhe a proposta (ela continua no botão)
  addEventListener('pointerdown', e => { if (!$('offer').hidden && !$('offer').contains(e.target) && e.target !== $('offerBtn') && !e.target.closest('#coach')) { openUntil = -1; updateOffers(); } });
}

export function updateOffers() {
  if (!FLAGS.viva) return;
  const o = S.roundOver ? null : offerNow();
  if (!o) { shownM = null; for (const id of ['offer', 'offerBtn', 'skOffer']) $(id).hidden = true; return; }
  if (o.m !== shownM) { shownM = o.m; render(o); shownAt = V.t; openUntil = skillsOpen() ? -1 : V.t + OPEN_SECS; }
  const open = V.t < openUntil && !skillsOpen();
  $('offer').hidden = !open;
  $('offerBtn').hidden = open;
  $('offerBtn').classList.toggle('pulse', !open);
  $('skOffer').hidden = !skillsOpen(); $('skOffer').classList.add('pulse');
}
