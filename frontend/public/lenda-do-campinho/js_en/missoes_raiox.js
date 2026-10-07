/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧭 MISSÕES DO RAIO-X (v407; dono: "faça tudo menos I1") — prefixo mrx
   - R4: a HISTÓRIA PRINCIPAL vem primeiro. As missões da história ganham principal: true e a lista MISSOES fica em ordem
     (história primeiro, depois as outras pelo nível). Assim o "🎯 Agora", a seta amarela, a conversa com o personagem e a
     janela Missões preferem a história, e entre as outras a de nível mais baixo (antes: ordem do arquivo — Lisboa, nível
     124, aparecia antes do Cairo, 50; a Torre antes da saga).
   - R8: textos com "(a)" ("Bem-vindo(a)", "Filho(a)", "Caçador(a)", "Campeã(o)") saem na forma certa para o boneco
     (menino ou menina, s.corpo). Vale para janelas, conversas, avisos e o registro — menos na Agência, onde o texto
     fala dos jogadores da agência e não do seu boneco.
   - Textos longos: o pedido fica curto e a história vai para "📖 Saiba mais" (campo q.mais; texto acima de ~220 letras
     sem q.mais é cortado numa frase e o resto vai para lá).
   - A3: cada guia de área de caça tem uma fala própria, com uma curiosidade do lugar (antes: um molde igual para todos).
   - R12: o portal selado do Multiverso que ainda não leva a lugar nenhum ("Em breve!") fica escondido até existir.
   Carregar NO FIM (depois de como_chegar.js, missoes_org.js, missoes_colecao.js, cacadas.js, jurassico.js e de todo
   arquivo que acrescenta missões).
   ============================================================ */

/* ---------- R4: a história principal ---------- */
const MRX_PRINCIPAL = /^(q_(bola|pombos|moleques|penaltis|caramelo|zagueiros|tonhao|peneira)|[pcte]_[a-z]+|[lmo]_[a-z]+|(cairo|doha|toquio|miami|buenos|rio|paris|munique|milao|santos)_m\d|santos_rei\d|iara_capacete|atl_m\d|estela_traje|esp_m\d|mv_[ag]\d|sg_[a-z]\d+|jur_k\d+|jur_rei)$/;
function mrxPrincipal(q) { return !!(q && (q.principal || MRX_PRINCIPAL.test(q.id || ''))); }
function mrxOrdena() {
  try {
    for (const q of MISSOES) if (!q.principal && MRX_PRINCIPAL.test(q.id || '')) q.principal = true;
    const pos = new Map(MISSOES.map((q, i) => [q, i]));
    MISSOES.sort((a, b) => (mrxPrincipal(b) - mrxPrincipal(a)) || ((a.lvl || 1) - (b.lvl || 1)) || (pos.get(a) - pos.get(b)));
  } catch (e) { console.warn('mrxOrdena', e); }
}
mrxOrdena();
{ const _ijMrx = iniciarJogo; iniciarJogo = function () { mrxOrdena(); return _ijMrx.apply(this, arguments); }; } // missão acrescentada depois do carregamento entra na ordem

/* ---------- R8: menino ou menina nos textos com "(a)" ---------- */
// "Bem-vindo(a)" → Bem-vindo / Bem-vinda · "Caçador(a)" → Caçador / Caçadora · "Campeã(o)" → Campeão / Campeã · "ETERNO(A)"
const MRX_GEN_RE = /([A-Za-zÀ-ÖØ-öø-ÿ]+)\((a|A|o|O|ã|Ã|as|os)\)/g;
function mrxMenina() { const s = G.save; return !!s && (s.corpo || (s.look && s.look.corpo)) === 'f'; }
function mrxGenero(txt, menina) {
  if (!txt || txt.indexOf('(') < 0) return txt;
  const f = menina == null ? mrxMenina() : menina;
  return txt.replace(MRX_GEN_RE, (m, w, suf) => {
    const up = suf === suf.toUpperCase() && suf !== suf.toLowerCase();
    const s = suf.toLowerCase();
    if (s === 'a' || s === 'as') { // a palavra está no masculino; (a) = feminino
      if (!f) return w;
      if (s === 'as') return /os$/i.test(w) ? w.slice(0, -2) + (up ? 'AS' : 'as') : w + suf;
      if (/[oO]$/.test(w)) return w.slice(0, -1) + (up || /O$/.test(w) ? 'A' : 'a');
      if (/^n?ele$/i.test(w)) return w.slice(0, -1) + (up ? 'A' : 'a'); // ele(a) → ela, nele(a) → nela
      return w + suf; // Caçador(a) → Caçadora, Um(a) → Uma
    }
    if (s === 'os') return f ? w : (/as$/i.test(w) ? w.slice(0, -2) + 'os' : w + 'os');
    if (s === 'o') { // a palavra está no feminino; (o) = masculino
      if (f) return w;
      if (/ã$/i.test(w)) return w + (up ? 'O' : 'o'); // Campeã(o) → Campeão
      if (/a$/i.test(w)) return w.slice(0, -1) + (up ? 'O' : 'o'); // vinda(o) → vindo
      return w + suf;
    }
    if (s === 'ã') return f ? w.replace(/ão$/i, m2 => (m2 === 'ÃO' ? 'Ã' : 'ã')) : w; // campeão(ã)
    return m;
  });
}
{
  const ehAgencia = no => { for (let e = no && (no.nodeType === 1 ? no : no.parentElement), k = 0; e && k < 14; e = e.parentElement, k++) { if (e.id === 'modalConteudo') { const h = e.querySelector('h2'); return !!(h && /AGÊNCIA/i.test(h.textContent)) || !!e.querySelector('[class^="ag"], [class*=" ag"]'); } if (e.classList && [...e.classList].some(c => /^ag/.test(c))) return true; } return false; };
  const trocaTexto = t => { if (!t.nodeValue || t.nodeValue.indexOf('(') < 0) return; const n = mrxGenero(t.nodeValue); if (n !== t.nodeValue) t.nodeValue = n; };
  const varre = no => {
    if (!G.save || !no) return;
    if (no.nodeType === 3) { if (/\([aAoOã]s?\)/.test(no.nodeValue || '') && !ehAgencia(no)) trocaTexto(no); return; }
    if (no.nodeType !== 1 || /^(SCRIPT|STYLE|CANVAS|TEXTAREA|INPUT)$/.test(no.tagName)) return;
    if (!/\([aAoOã]s?\)/.test(no.textContent || '') || ehAgencia(no)) return;
    const w = document.createTreeWalker(no, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) trocaTexto(t);
  };
  const obs = new MutationObserver(lista => { if (!G.save) return; for (const r of lista) { if (r.type === 'characterData') varre(r.target); else for (const n of r.addedNodes) varre(n); } });
  const liga = () => { try { obs.observe(document.body, { childList: true, subtree: true, characterData: true }); } catch (e) { } };
  if (document.body) liga(); else document.addEventListener('DOMContentLoaded', liga);
  window.MRX_GENERO = mrxGenero; // (para os testes)
}

/* ---------- textos longos: "📖 Saiba mais" ---------- */
const MRX_CURTO = 220;
// textos que moram em tabelas (saga, Vale Jurássico): o pedido curto e a história à parte
const MRX_MAIS = {
  sg_p1: ['Ace, my radar found a little old satellite with a star map stitched like a soccer ball! Take the map to Grand Guardian Orbitto, at the Multiverse Stadium.',
    'The strange signal was coming from inside the satellite. Orbitto knows the oldest legends of all: he’ll know what this map means.'],
  jur_rei: ['King Rex wants to swallow every ball in the valley! When he roars, hide behind a rock; when red circles show up on the ground, step out of them. Beat King Rex in King Rex’s Arena!',
    'King Rex doesn’t like soccer and wants to drive the humans out of the Jurassic Valley. Nobody has ever beaten him.'],
  sg_f3: ['All the worlds are watching! Kick the Origin Ball and tell Dr. Estela, at the Space Station: she’s the one who started all of this.',
    'Dr. Estela is at the telescope. Commander Luna, Rubi, Vega, Orion, Professor Coral, the dwarves and the giants are waiting for your kick too!'],
};
for (const [id, [curto, mais]] of Object.entries(MRX_MAIS)) { const q = MISSOES.find(x => x.id === id); if (q && !q.mais) { q.texto = curto; q.mais = mais; } }
function mrxDivide(q) {
  if (q.mais) return [q.texto, q.mais];
  const t = String(q.texto || ''); if (t.length <= MRX_CURTO) return [t, ''];
  const frases = t.replace(/\.\.\./g, '…').match(/[^.!?]+[.!?]+["”»]?\s*|[^.!?]+$/g) || [t]; // (reticências não terminam a frase)
  // o pedido costuma estar na ÚLTIMA frase: ela fica; as primeiras (a história) vão para o "Saiba mais"
  let curto = frases[frases.length - 1].trim(); const resto = [];
  for (let k = frases.length - 2; k >= 0; k--) { const f = frases[k].trim(); if ((f + ' ' + curto).length <= 200) curto = f + ' ' + curto; else { resto.unshift(...frases.slice(0, k + 1).map(x => x.trim())); break; } }
  return resto.length ? [curto, resto.join(' ')] : [t, ''];
}
{
  const _mmMrx = modalMissao;
  modalMissao = function (npc, q) {
    const r = _mmMrx.apply(this, arguments);
    try {
      const [curto, mais] = mrxDivide(q); if (!mais) return r;
      const p = [...document.querySelectorAll('#modalConteudo .fala > p')].find(x => x.textContent === q.texto); if (!p) return r;
      p.textContent = curto;
      p.after(el('details', { class: 'mrx-mais' }, el('summary', {}, '📖 Learn more'), el('p', {}, mais)));
    } catch (e) { console.warn('saiba mais', e); }
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `.mrx-mais { margin: 2px 0 6px; font-size: 14px; } .mrx-mais summary { cursor: pointer; font-weight: 700; color: #6a4a2a; } .mrx-mais p { margin: 4px 0 0; }`;
  document.head.append(css);
}

/* ---------- A3: cada guia de área de caça com a sua fala (uma curiosidade do lugar) ---------- */
const MRX_GUIA = {
  caca_bosque: 'Did you know the caramel mutt is almost a symbol of Brazil? Here in the woods they chase any ball!',
  caca_gruta: 'Did you know crabs walk sideways? That’s why they’re so hard to dribble past here in the grotto!',
  caca_metro: 'This subway stopped running a long time ago, and the skaters turned the tunnels into a track!',
  caca_anexo: 'On the Training Center’s side fields, the teams train every day, rain or shine.',
  caca_tunel: 'This is the tunnel the players take onto the field, hearing the fans sing up above!',
  caca_tumba: 'The pyramids of Egypt were built more than 4,500 years ago! And this tomb still holds many secrets.',
  caca_bambu: 'Did you know some bamboo can grow almost one meter in a single day? Here in the bamboo grove it seems to go on forever!',
  caca_oasis: 'An oasis is a place with water in the middle of the desert, where caravans used to stop and rest.',
  caca_pantano: 'The Everglades are a huge swamp in Florida, full of alligators and colorful birds.',
  caca_cais: 'It was from Lisbon that Portuguese explorers set sail to cross the oceans, more than 500 years ago.',
  caca_fazenda: 'In the fields of Spain you can see bulls grazing. Here, the defenders train as hard as they do!',
  caca_catacumba: 'Under several old cities in Italy there are long, quiet tunnels: the catacombs.',
  caca_gelo: 'The Alps are the highest mountains in Europe, with snow all year round at the top.',
  caca_esgoto: 'London’s sewer tunnels are more than 150 years old and still work!',
  caca_cratera: 'Patagonia, in southern Argentina, has volcanoes, glaciers and super strong winds.',
  caca_metro_paris: 'The Paris subway is one of the oldest in the world: it started running in the year 1900!',
  caca_armazem: 'The port of Santos is the biggest in Brazil. For a long time, Brazilian coffee left from here for the whole world.',
  caca_cristal: 'Tijuca Forest, in Rio, is one of the biggest forests in the world inside a city!',
  caca_bazar: 'Cairo’s great bazaar has been around for more than 600 years, with little shops selling all kinds of things.',
  caca_miragem: 'In the desert, the heat creates mirages: it looks like there’s water on the ground, but it’s just an illusion!',
  caca_dojo: 'Sumo is Japan’s traditional sport, and the wrestlers train at the dojo from early in the morning.',
  caca_academia: 'There’s exercise equipment right on the sand here: you can work out while looking at the ocean!',
  caca_estaleiro: 'In the La Boca neighborhood, the colorful little houses were painted with leftover paint from the boats.',
  caca_barracao: 'In the samba school’s workshop, the Carnival costumes and floats are worked on all year long.',
  caca_caravela: 'Caravels were light, fast ships that Portuguese explorers used on their great voyages.',
  caca_labirinto: 'The gardens of the Palace of Versailles, near Paris, have paths that look like a maze of plants.',
  caca_relogio: 'Munich’s main square has a famous clock: when the bell rings, little figures dance up high!',
  caca_passarela: 'Milan is one of the fashion capitals of the world: designers show off new clothes on the runways here.',
};
for (const [id, frase] of Object.entries(MRX_GUIA)) {
  const n = NPCS['guia_' + id], c = typeof CACA_POR_ID !== 'undefined' && CACA_POR_ID[id]; if (!n || !c) continue;
  const d = MONSTROS[c.m]; if (!d) continue;
  const L = typeof nivelCaca === 'function' ? nivelCaca(c) : (d.nivel || 0);
  n.ola = `${frase} Only ${d.nome} (level ${L}) shows up in this hunting area, and there are lots of them. Want a mission?`;
}

/* ---------- R12: o portal selado do Multiverso que ainda não leva a lugar nenhum fica escondido ---------- */
if (MAPAS_DEF.multiverso) {
  const _mvMrx = MAPAS_DEF.multiverso;
  MAPAS_DEF.multiverso = function () {
    const m = _mvMrx.apply(this, arguments);
    try {
      const pl = (m.placas || []).findIndex(p => /PORTAL SELADO/.test(p.texto) && /Em breve/i.test(p.texto));
      const p = (m.predios || []).find(q => q.spr === 'mv_portal_selado');
      if (pl >= 0 && p && !(m.saidas || []).some(s => p.porta && s.x === p.porta.x && s.y === p.porta.y)) {
        m.placas.splice(pl, 1); m.predios.splice(m.predios.indexOf(p), 1);
        const PRACA = CH.MV_PRACA;
        // o lugar do portal vira praça (ou continua parede, se estava fora da praça) e a passarela até ele volta a ser praça
        for (let j = p.y; j < p.y + p.h; j++) for (let i = p.x; i < p.x + p.w; i++) { const k = j * m.w + i, o = m.obj[k]; if (o && o.predio) m.obj[k] = m.chao[k + m.w * 0] === PRACA ? null : { t: 'x', v: 0 }; }
        if (p.porta) for (let j = p.porta.y + 1; j <= 13; j++) { const k = j * m.w + p.porta.x; if (m.chao[k] === CH.METAL && !m.obj[k] && m.chao[k - 1] === PRACA) m.chao[k] = PRACA; }
      }
    } catch (e) { console.warn('portal selado', e); }
    return m;
  };
}
window.MRX = { mrxPrincipal, mrxOrdena, mrxGenero, mrxDivide, MRX_GUIA };
