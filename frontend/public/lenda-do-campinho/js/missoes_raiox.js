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
  sg_p1: ['Craque, meu radar achou um satélite velhinho com um mapa das estrelas costurado como uma bola de futebol! Leve o mapa para o Grão-Guardião Orbitto, no Estádio do Multiverso.',
    'O sinal estranho vinha de dentro do satélite. O Orbitto conhece as lendas mais antigas de todas: ele vai saber o que esse mapa quer dizer.'],
  jur_rei: ['O Rei Rex quer engolir todas as bolas do vale! Quando ele rugir, esconda-se atrás de uma pedra; nos círculos vermelhos do chão, saia de dentro. Vença o Rei Rex na Arena do Rei Rex!',
    'O Rei Rex não gosta de futebol e quer expulsar os humanos do Vale Jurássico. Ninguém nunca conseguiu vencer ele.'],
  sg_f3: ['Todos os mundos estão olhando! Chute a Bola de Origem e conte para a Dra. Estela, na Estação Espacial: foi ela que começou tudo isso.',
    'A Dra. Estela está no telescópio. A Comandante Luna, a Rubi, a Vega, a Órion, o Professor Coral, os anões e os gigantes também esperam o seu chute!'],
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
      p.after(el('details', { class: 'mrx-mais' }, el('summary', {}, '📖 Saiba mais'), el('p', {}, mais)));
    } catch (e) { console.warn('saiba mais', e); }
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `.mrx-mais { margin: 2px 0 6px; font-size: 14px; } .mrx-mais summary { cursor: pointer; font-weight: 700; color: #6a4a2a; } .mrx-mais p { margin: 4px 0 0; }`;
  document.head.append(css);
}

/* ---------- A3: cada guia de área de caça com a sua fala (uma curiosidade do lugar) ---------- */
const MRX_GUIA = {
  caca_bosque: 'Sabia que o vira-lata caramelo é quase um símbolo do Brasil? Aqui no bosque eles correm atrás de qualquer bola!',
  caca_gruta: 'Sabia que o caranguejo anda de lado? Por isso ele é tão difícil de driblar aqui na gruta!',
  caca_metro: 'Este metrô parou de funcionar faz tempo, e os skatistas transformaram os túneis numa pista!',
  caca_anexo: 'Nos campos anexos do CT os times treinam todo dia, faça chuva ou faça sol.',
  caca_tunel: 'É por este túnel que os jogadores entram em campo, ouvindo a torcida cantar lá em cima!',
  caca_tumba: 'As pirâmides do Egito foram construídas há mais de 4.500 anos! E esta tumba ainda guarda muitos segredos.',
  caca_bambu: 'Sabia que alguns bambus crescem quase um metro num dia só? Aqui no bambuzal eles parecem não ter fim!',
  caca_oasis: 'Um oásis é um lugar com água no meio do deserto, onde as caravanas paravam para descansar.',
  caca_pantano: 'Os Everglades são um pântano enorme na Flórida, cheio de jacarés e aves coloridas.',
  caca_cais: 'Foi de Lisboa que os navegadores portugueses partiram para cruzar os oceanos, há mais de 500 anos.',
  caca_fazenda: 'Nos campos da Espanha a gente vê touros pastando. Aqui, os zagueiros treinam com a mesma força deles!',
  caca_catacumba: 'Debaixo de várias cidades antigas da Itália existem túneis compridos e silenciosos: as catacumbas.',
  caca_gelo: 'Os Alpes são as montanhas mais altas da Europa, com neve o ano inteiro lá no topo.',
  caca_esgoto: 'Os túneis de esgoto de Londres têm mais de 150 anos e ainda funcionam!',
  caca_cratera: 'A Patagônia, no sul da Argentina, tem vulcões, geleiras e ventos fortíssimos.',
  caca_metro_paris: 'O metrô de Paris é um dos mais antigos do mundo: começou a funcionar no ano de 1900!',
  caca_armazem: 'O porto de Santos é o maior do Brasil. Por muito tempo, o café brasileiro saía daqui para o mundo inteiro.',
  caca_cristal: 'A Floresta da Tijuca, no Rio, é uma das maiores florestas do mundo dentro de uma cidade!',
  caca_bazar: 'O grande bazar do Cairo existe há mais de 600 anos, com lojinhas de tudo quanto é coisa.',
  caca_miragem: 'No deserto, o calor cria miragens: parece que tem água no chão, mas é só uma ilusão!',
  caca_dojo: 'O sumô é o esporte tradicional do Japão, e os lutadores treinam desde cedinho no dojo.',
  caca_academia: 'Aqui tem aparelhos de ginástica bem na areia: dá para treinar olhando o mar!',
  caca_estaleiro: 'No bairro de La Boca, as casinhas coloridas foram pintadas com as sobras de tinta dos barcos.',
  caca_barracao: 'No barracão da escola de samba, as fantasias e os carros do carnaval ficam prontos o ano inteiro.',
  caca_caravela: 'As caravelas eram barcos leves e rápidos, usados pelos navegadores portugueses nas grandes viagens.',
  caca_labirinto: 'Os jardins do Palácio de Versalhes, perto de Paris, têm caminhos que parecem um labirinto de plantas.',
  caca_relogio: 'Na praça de Munique tem um relógio famoso: quando o sino toca, bonequinhos dançam lá no alto!',
  caca_passarela: 'Milão é uma das capitais da moda do mundo: os estilistas mostram roupas novas nas passarelas daqui.',
};
for (const [id, frase] of Object.entries(MRX_GUIA)) {
  const n = NPCS['guia_' + id], c = typeof CACA_POR_ID !== 'undefined' && CACA_POR_ID[id]; if (!n || !c) continue;
  const d = MONSTROS[c.m]; if (!d) continue;
  const L = typeof nivelCaca === 'function' ? nivelCaca(c) : (d.nivel || 0);
  n.ola = `${frase} Nesta área de caça só aparece ${d.nome} (nível ${L}), e são muitos. Quer uma missão?`;
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
