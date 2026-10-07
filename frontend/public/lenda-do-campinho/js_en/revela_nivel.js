/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🔓 MOSTRAR AS COISAS AOS POUCOS (v407, Raio-X A1 — parte da LÓGICA; o visual do HUD é o hud_v407.js da frente ARTE)
   Pedido aprovado pelo dono ("faça tudo menos I1"): no nível 1 apareciam Carreira, Time, Arenas, Adornos... e no nível 2
   chegavam juntos a faixa NÍVEL 2, a faixa PEDALADA, 4 dicas e avisos verdes.
   - PERSONAGEM NOVO (criado no "Nascer!" a partir da v407: save.rvNovato): os botões do topo e as entradas do ☰ Menu
     aparecem conforme o nível — Tarefas no 8, treino offline no 10, Casas no 15, Carreira e Time no 25, Arenas no nível
     da 1ª arena, Feira e Guilda no 30, Adornos quando ganhar o primeiro, Torre em grupo no 400 (a Agência já tinha a regra
     dela). Antes disso, quem chega pelo NPC/lugar vê um cadeado "Libera no nível X". Quando libera, chega uma dica.
     Personagens que já existiam (e quem já passou do nível) veem tudo: ninguém perde nada.
   - FILA DE DICAS (todos): no máximo 1 dica a cada ~30 s, nunca junto de faixa (nível, drible novo...) e, durante o
     tutorial, só quando o cartão do tutorial está minimizado. A recompensa diária também espera a tela ficar calma.
   Prefixo: rv. Carregar no FIM (depois de opcoes.js, arenas.js, adornos.js, tarefas.js, treino.js, casas.js, mercado.js,
   guilda.js, torre_coop.js e fila_avisos.js).
   ============================================================ */
const RV_DICA_INTERVALO = 30000; // ms entre uma dica e a próxima
const RV_DICA_PRIORIDADE = []; // passam na frente da fila
const RV_DICA_IGNORA = ['atributos']; // repetia o cartão laranja "Você tem N pontos... Distribuir" (alertas.js), que já resolve
// [chave, nome, nível (número ou função), seletor dos botões, texto do botão no menu do celular, onde aparece]
const RV_ITENS = [
  ['tarefas', '🎯 Hunt Tasks', 8, '#btnTarefas', /Tarefas/, 'in the ☰ Menu'],
  ['treino', '🏋️ Training (and offline training)', 10, '#btnTreino', /Treino/, 'in the ☰ Menu'],
  ['casas', '🏠 Houses (Real Estate Agency)', 15, null, null, 'at the Real Estate Agency'],
  ['carreira', '⭐ Career', () => (typeof CARR_NIVEL_MIN !== 'undefined' ? CARR_NIVEL_MIN : 25), '[data-abre="carreira"]', /Carreira/, 'at the top of the screen'],
  ['time', '👥 My Team', () => (typeof NIVEL_TIME !== 'undefined' ? NIVEL_TIME : 25), '[data-abre="time"]', /Meu Time/, 'at the top of the screen'],
  ['arenas', '🏟️ Boss Arenas', () => (typeof ARENAS !== 'undefined' && ARENAS.length ? Math.min(...ARENAS.map(a => a.req || 1)) : 28), '#btnArenas', /Arenas/, 'at the top of the screen'],
  ['feira', '🏪 Players’ Market', 30, '#btnFeira', /Feira/, 'in the ☰ Menu'],
  ['guilda', '🛡️ Guild', 30, '#btnGuilda', /Guilda/, 'in the ☰ Menu'],
  ['adornos', '✨ Cosmetics', 'adorno', '#btnAdornosTopo, .btn-adornos', /Adornos/, 'at the top of the screen'],
  ['torre', '👥 Group Tower', 400, '#btnCoop', /Torre/, 'in the ☰ Menu'],
];
const RV_POR = Object.fromEntries(RV_ITENS.map(i => [i[0], i]));
let RV_NASCENDO = false;
// personagem novo: marcado no clique do "Nascer!" (o novoSave é chamado ali dentro); os de teste e os antigos ficam como eram
{
  const bt = document.getElementById('btnNascer');
  if (bt) bt.addEventListener('click', () => { RV_NASCENDO = true; setTimeout(() => { RV_NASCENDO = false; }, 0); }); // (registrado antes do onclick do ui.js: roda primeiro)
  const _nsRv = novoSave;
  novoSave = function () { const s = _nsRv.apply(this, arguments); if (RV_NASCENDO && s) s.rvNovato = 407; return s; };
}
function rvNivelDe(chave) { const it = RV_POR[chave]; if (!it) return 0; const n = it[2]; return typeof n === 'function' ? n() : typeof n === 'number' ? n : 0; }
function rvTemAdorno(s = G.save) {
  if (!s) return false; if ((s.nivel || 1) >= 60) return true; // asas de anjo (adornos.js)
  if (s.flags && Object.keys(s.flags).some(k => /^pet_/.test(k))) return true; // mascote ganho em missão (adornos2.js)
  try { if (typeof prem === 'function' && prem('lendario')) return true; } catch (e) { }
  return false;
}
// está liberado para este personagem? (personagem antigo: sempre)
function rvLiberado(chave, s = G.save) {
  if (!s || !s.rvNovato) return true;
  const it = RV_POR[chave]; if (!it) return true;
  if (s.rvVisto && s.rvVisto[chave]) return true;
  const ok = it[2] === 'adorno' ? rvTemAdorno(s) : (s.nivel || 1) >= rvNivelDe(chave);
  if (ok) (s.rvVisto = s.rvVisto || {})[chave] = true; // liberou uma vez, fica para sempre
  return ok;
}
function rvTextoTrava(chave) { const it = RV_POR[chave]; return it[2] === 'adorno' ? 'Unlocks when you get your first cosmetic (wings at level 60, or a pet from a mission).' : `Unlocks at level ${rvNivelDe(chave)}.`; }
// a janela do cadeado (NPC/lugar visitado antes da hora)
function rvCadeado(chave) {
  const it = RV_POR[chave], s = G.save;
  abreModal(el('h2', {}, `🔒 ${it[1]}`),
    el('p', { style: 'font-size:17px' }, rvTextoTrava(chave)),
    el('p', {}, `You're at level ${s.nivel}. Keep playing: when the time comes, ${it[1]} will show up ${it[5]} and a tip will let you know!`),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: fechaModal }, 'Deal!')));
}
// esconde/mostra os botões (topo, ☰ Menu e menu do celular) e avisa quando algo libera
let RV_PRIMEIRA = true;
function rvAplica() {
  const s = G.save; if (!s) return;
  for (const [chave, nome, , sel, rxCel, onde] of RV_ITENS) {
    const antes = !!(s.rvVisto && s.rvVisto[chave]);
    const ok = rvLiberado(chave, s);
    if (sel) for (const b of document.querySelectorAll(sel)) {
      if (b.closest('#modal, #opcMenu')) continue;
      b.classList.toggle('rv-oculto', !ok);
      if (b.closest('.tb-lista')) { if (!ok) { b.style.display = 'none'; b.dataset.rv = '1'; } else if (b.dataset.rv) { b.style.display = ''; delete b.dataset.rv; } } // (o ☰ Menu em grade lê o style.display)
    }
    if (rxCel) for (const b of document.querySelectorAll('#celMenu .cm-bt')) if (rxCel.test(b.textContent)) b.classList.toggle('rv-oculto', !ok);
    if (s.rvNovato && ok && !antes && !RV_PRIMEIRA) dica('rv_' + chave, `🔓 New feature unlocked: ${nome}! It now shows up ${onde}.`, sel && sel.startsWith('#btn') && !/Tarefas|Treino|Feira|Guilda|Coop/.test(sel) ? sel : null);
  }
  // 🕴️ Agência: o ☰ Menu em grade mostrava a entrada mesmo escondida (hidden) — agora só quando liberar (todos os saves)
  try { const ok = typeof agLiberada !== 'function' || agLiberada(); for (const b of document.querySelectorAll('#btnAgencia, #tbAgencia')) { b.classList.toggle('rv-oculto', !ok); if (b.closest('.tb-lista')) { if (!ok) { b.style.display = 'none'; b.dataset.rv = '1'; } else if (b.dataset.rv) { b.style.display = ''; delete b.dataset.rv; } } } } catch (e) { }
  RV_PRIMEIRA = false;
}
{
  const _iniRv = iniciarJogo;
  iniciarJogo = async function () { RV_PRIMEIRA = true; const r = await _iniRv.apply(this, arguments); try { rvAplica(); } catch (e) { } return r; };
  setInterval(() => { try { if (G.save) rvAplica(); } catch (e) { } }, 1000);
  if (typeof opcMenu === 'function') { const _omRv = opcMenu; opcMenu = function () { try { rvAplica(); } catch (e) { } return _omRv.apply(this, arguments); }; }
  // cadeados nas janelas (quem chega pelo NPC/lugar ou por um atalho antes da hora)
  const trava = (nome, chave) => { if (typeof window[nome] !== 'function') return; const orig = window[nome]; window[nome] = function () { if (G.save && !rvLiberado(chave)) return rvCadeado(chave); return orig.apply(this, arguments); }; };
  trava('modalTarefas', 'tarefas'); trava('modalTreino', 'treino'); trava('modalCorretora', 'casas'); trava('mktAbre', 'feira'); trava('gldAbre', 'guilda'); trava('abreAdornos', 'adornos');
}

// o cartão laranja "Você tem N pontos para distribuir" (alertas.js) espera a faixa de nível/drible passar
if (typeof alertasAtuais === 'function') { const _alRv = alertasAtuais; alertasAtuais = function () { const l = _alRv.apply(this, arguments); try { if (!rvQuieto()) return l.filter(a => a.id !== 'pontos'); } catch (e) { } return l; }; }
/* ---------- fila de dicas: 1 a cada ~30 s, nunca junto de faixa ---------- */
const RV_DICA = { espera: [], ultSolta: -1e9, bannerAte: 0 };
function rvBannerAtivo() {
  const FA = window.FILA_AVISOS; const on = !!(FA && (FA.ativo || FA.fila.length)) || !!(document.querySelector('#banner.on'));
  if (on) RV_DICA.bannerAte = performance.now();
  return on || performance.now() - RV_DICA.bannerAte < 2500;
}
// tela calma: sem faixa passando (a recompensa diária e o cartão Hoje usam isto antes de abrir sozinhos)
function rvQuieto() { return !rvBannerAtivo(); }
function rvSoltaDica() {
  if (!G.save || !G.rodando || G.dicasFila.length || !RV_DICA.espera.length) return;
  if (performance.now() - RV_DICA.ultSolta < RV_DICA_INTERVALO) return;
  if (rvBannerAtivo()) return;
  const s = G.save; if (typeof TUTORIAL !== 'undefined' && s.tut < TUTORIAL.length && G.tutMin !== s.tut) return; // o cartão do tutorial está na tela: espera
  let i = RV_DICA.espera.findIndex(d => RV_DICA_PRIORIDADE.includes(d.id) || /^rv_/.test(d.id)); if (i < 0) i = 0; // (o aviso de "novidade liberada" passa na frente)
  const d = RV_DICA.espera.splice(i, 1)[0];
  Array.prototype.push.call(G.dicasFila, d); RV_DICA.ultSolta = performance.now(); G.uiSujo = true;
}
if (G && Array.isArray(G.dicasFila)) {
  // dica() empilha em G.dicasFila: agora ela entra numa sala de espera e sai uma de cada vez
  G.dicasFila.push = function (...ds) { for (const d of ds) if (d && !RV_DICA_IGNORA.includes(d.id) && !RV_DICA.espera.some(x => x.id === d.id) && !this.some(x => x.id === d.id)) RV_DICA.espera.push(d); rvSoltaDica(); return this.length; };
  setInterval(() => { try { rvSoltaDica(); document.body.classList.toggle('rv-faixa', rvBannerAtivo()); } catch (e) { } }, 500);
  // faixa passando (nível, drible novo...): a dica que já estava na tela se esconde até a faixa acabar
  const _bnRv = banner; banner = function () { try { document.body.classList.add('rv-faixa'); RV_DICA.bannerAte = performance.now(); } catch (e) { } return _bnRv.apply(this, arguments); };
  const _iniRvD = iniciarJogo;
  iniciarJogo = async function () { RV_DICA.espera.length = 0; RV_DICA.ultSolta = -1e9; return _iniRvD.apply(this, arguments); };
}
{
  const st = document.createElement('style');
  st.textContent = `.rv-oculto { display: none !important; }
  body.rv-faixa #rastreador .cartao-dica { opacity: 0 !important; pointer-events: none !important; transition: opacity .2s; }`;
  document.head.append(st);
}
