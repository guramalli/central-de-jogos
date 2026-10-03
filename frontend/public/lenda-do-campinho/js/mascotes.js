/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🐾 MASCOTES QUE EVOLUEM (v370, dono: "cada mascote pode ter atributos a adicionar ao boneco: um dá mais XP, outro mais
   defesa, outro mais fôlego, outro mais foco").
   - O mascote que está com você (Equipamento → ✨ Adornos) ganha pontos a cada adversário vencido (chefão vale 10) e sobe
     do nível 1 ao 30. Só contam adversários do seu nível (até 30 níveis abaixo): nada de evoluir batendo em pombo.
   - FASES com arte própria: FILHOTE (nível 1) → JOVEM (nível 10) → ADULTO (nível 25). O bônus também cresce:
     filhote 1/3, jovem 2/3, adulto o bônus cheio.
   - Cada mascote dá UM bônus ao jogador (só o que está com você):
       🐕 Pipoca +15% tostões · 🐶 Caramelo +8% fôlego · 🤖 Mini-Robô +10% foco · 🦕 Tricerinho +8% defesa
       🐱 Sortudo +12% chance de item (v372) · 🦉 Corujinha +10% XP · 🦜 Arara +6% dano · 🐙 Polvinho +15% recuperação · 🐉 Dragãozinho +6% dano (o mesmo da Arara)
   - PIPOCA, o Vira-latinha: o mascote de começo de jogo (missões da Tia Zuzu, na Vila, a partir do nível 12).
   - Quem já tinha um mascote antes da v370 começa com ele JOVEM (nível 10, a arte de sempre).
   Pontos para passar do nível n: 25·1,18^(n−1) → jovem ~480 vitórias, adulto ~7.200, nível 30 ~16.700.
   Carregar DEPOIS de adornos2.js e museu.js.
   ============================================================ */
const MASC_MAX = 30;
const MASC = {
  pipoca: { bonus: 'ouro', v: 0.15, txt: 'tostões' },
  sortudo: { bonus: 'drop', v: 0.12, txt: 'chance de cair item' }, // v372
  caramelo: { bonus: 'hp', v: 0.08, txt: 'fôlego' },
  robo: { bonus: 'foco', v: 0.10, txt: 'foco' },
  tricerinho: { bonus: 'def', v: 0.08, txt: 'defesa' },
  corujinha: { bonus: 'xp', v: 0.10, txt: 'XP' },
  arara: { bonus: 'dano', v: 0.06, txt: 'dano' },
  dragao: { bonus: 'dano', v: 0.06, txt: 'dano' },
  polvinho: { bonus: 'regen', v: 0.15, txt: 'recuperação de fôlego e foco' },
};
const MASC_FASES = [{ nv: 1, nome: 'Filhote', k: 1 / 3, suf: '_f', esc: 0.78 }, { nv: 10, nome: 'Jovem', k: 2 / 3, suf: '', esc: 1 }, { nv: 25, nome: 'Adulto', k: 1, suf: '_a', esc: 1.18 }];
const mascPontosNivel = n => Math.round(25 * Math.pow(1.18, n - 1));
function mascDados(id) {
  const s = G.save; if (!s) return null;
  if (!s.mascotes) s.mascotes = {};
  // (uma vez) quem já tinha mascotes liberados antes da v370 fica com eles JOVENS — a arte que já conhecia
  if (!s.mascotesV370) { s.mascotesV370 = true; for (const k of Object.keys(MASC)) { try { if (ADORNOS2.liberado('mascote', k) && !s.mascotes[k]) s.mascotes[k] = { nv: 10, pts: 0 }; } catch (e) { } } }
  if (!id) return s.mascotes;
  return s.mascotes[id] || (s.mascotes[id] = { nv: 1, pts: 0 });
}
const mascFase = nv => MASC_FASES.filter(f => nv >= f.nv).pop();
function mascAtual() { try { const id = ADORNOS2.atual('mascote'); return id && MASC[id] ? id : null; } catch (e) { return null; } }
// o bônus que o mascote dá agora (fração: 0.05 = 5%)
function mascBonus(tipo) {
  const id = mascAtual(); if (!id || MASC[id].bonus !== tipo) return 0;
  const d = mascDados(id); return MASC[id].v * mascFase(d.nv).k;
}
const pct = v => `${Math.round(v * 1000) / 10}%`.replace('.', ',');
// arte e tamanho da fase (usados no desenho do mascote em adornos2.js)
const PET_ARTE_BASE = { caramelo: 'pet_caramelo2' };
window.petArte = id => { if (!MASC[id] || !G.save) return null; const f = mascFase(mascDados(id).nv); return f.suf ? `pet_${id}${f.suf}` : (PET_ARTE_BASE[id] || `pet_${id}`); };
window.petEscala = id => { if (!MASC[id] || !G.save) return 1; return mascFase(mascDados(id).nv).esc; };
// (as artes de filhote/adulto NÃO entram na carga inicial — são 3 MB: cada uma carrega quando aparece pela 1ª vez;
// enquanto isso o desenho usa a arte de sempre)

/* ---------- o mascote ganha pontos caçando com você ---------- */
function mascGanha(pts) {
  const id = mascAtual(); if (!id) return;
  const d = mascDados(id); if (d.nv >= MASC_MAX) return;
  d.pts += pts; let subiu = false;
  while (d.nv < MASC_MAX && d.pts >= mascPontosNivel(d.nv)) { d.pts -= mascPontosNivel(d.nv); d.nv++; subiu = true;
    const nome = (ADORNOS2.OPCOES.mascote.find(o => o[0] === id) || [])[1] || id, f = mascFase(d.nv);
    if (f.nv === d.nv && d.nv > 1) {
      banner(`🐾 ${nome} evoluiu!`, `Agora é ${f.nome.toUpperCase()}: +${pct(MASC[id].v * f.k)} de ${MASC[id].txt}`); som('nivel');
      log(`🐾 ${nome} EVOLUIU para ${f.nome}! Visual novo e o bônus subiu para +${pct(MASC[id].v * f.k)} de ${MASC[id].txt}.`, 'l-lvl');
      try { const P = ADORNOS2.PET; if (P && P.x != null) { efeito('area', P.x, P.y, '#ffd23f', 1.4); efeito('puff', P.x, P.y); } } catch (e) { }
    } else log(`🐾 ${nome} subiu para o nível ${d.nv}${d.nv >= MASC_MAX ? ' (o máximo!)' : ''}.`, 'l-xp');
  }
  if (subiu) { G.uiSujo = true; try { salvar(); } catch (e) { } }
}
{
  const _mtM = matar;
  matar = function (m) {
    const r = _mtM.apply(this, arguments);
    try {
      const s = G.save; if (!s || !m || !m.d || m.d.treino || m.d.pedra || !(m.d.xp > 0)) return r;
      const id = mascAtual(); if (!id) return r;
      if (nivelMonstro(m.d) >= s.nivel - 30) mascGanha(m.d.chefe ? 10 : 1);
      // 🐕 tostões a mais
      const b = mascBonus('ouro');
      if (b && m.d.ouro && m.d.ouro[1] > 0) { const extra = Math.max(1, Math.round((m.d.ouro[0] + m.d.ouro[1]) / 2 * b)); s.ouro += extra; G.uiSujo = true; }
    } catch (e) { }
    return r;
  };
}

/* ---------- os bônus ---------- */
{
  const _stM = stats;
  stats = function () {
    const st = _stM.apply(this, arguments);
    try {
      const id = mascAtual(); if (!id) return st;
      const b = mascBonus(MASC[id].bonus); if (!b) return st;
      switch (MASC[id].bonus) {
        case 'hp': st.maxHp = Math.round(st.maxHp * (1 + b)); break;
        case 'foco': st.maxFoco = Math.round(st.maxFoco * (1 + b)); break;
        case 'def': st.def = Math.round(st.def * (1 + b)); break;
        case 'dano': st.danoMult = (st.danoMult || 1) * (1 + b); break;
        case 'regen': st.regenHp = st.regenHp * (1 + b); st.regenFoco = st.regenFoco * (1 + b); break;
      }
    } catch (e) { }
    return st;
  };
  // 🐱 Sortudo: a chance de cada item dos adversários fica maior (proporcional: 1 em 1.000 vira ~1 em 890 no adulto).
  // Não mexe em tostões (Pipoca), figurinhas nem nas contagens garantidas (ovo do Vale, Museu): essas não usam d.loot.
  window.multDrop = () => 1 + mascBonus('drop');
  const _gxM = ganhaXp;
  ganhaXp = function (n) { try { const b = mascBonus('xp'); if (b && n > 0) arguments[0] = Math.round(n * (1 + b)); } catch (e) { } return _gxM.apply(this, arguments); };
}

/* ---------- na janela de Adornos: nível, fase, bônus e barra de cada mascote ---------- */
{
  const _amM = abreModal;
  abreModal = function () {
    const r = _amM.apply(this, arguments);
    try {
      const box = document.querySelector('#modalConteudo .adornos .ad2'); if (!box || box.querySelector('.masc-info') || !G.save) return r;
      const h3 = [...box.querySelectorAll('h3')].find(h => /Mascote/.test(h.textContent)); const grade = h3 && h3.nextElementSibling; if (!grade) return r;
      const ops = ADORNOS2.OPCOES.mascote, bts = [...grade.children];
      ops.forEach((o, i) => {
        const id = o[0], bt = bts[i]; if (!bt || !MASC[id]) return;
        const lib = ADORNOS2.liberado('mascote', id), M = MASC[id];
        if (!lib) { bt.append(el('span', { class: 'masc-info' }, `Bônus: ${M.txt} (até +${pct(M.v)})`)); return; }
        const d = mascDados(id), f = mascFase(d.nv), prox = MASC_FASES.find(x => x.nv > d.nv), need = mascPontosNivel(d.nv);
        bt.append(el('span', { class: 'masc-info' }, el('b', {}, `Nv ${d.nv} · ${f.nome}`), ` · +${pct(M.v * f.k)} de ${M.txt}`,
          d.nv < MASC_MAX ? el('span', { class: 'masc-bar', title: `${d.pts}/${need} pontos para o nível ${d.nv + 1}` }, el('i', { style: `width:${Math.round(d.pts / need * 100)}%` })) : el('span', {}, ' · MÁXIMO!'),
          prox ? el('small', {}, `${prox.nome} no nível ${prox.nv}`) : ''));
      });
      h3.after(el('p', { class: 'dica masc-dica' }, '🐾 O mascote que está com você evolui caçando (cada adversário do seu nível = 1 ponto, chefão = 10) e dá um BÔNUS ao seu jogador. Filhote → Jovem (nível 10) → Adulto (nível 25): visual novo e bônus maior.'));
    } catch (e) { console.warn('mascotes', e); }
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `.masc-info { display: block; font-size: 11.5px; line-height: 1.3; margin-top: 4px; color: #5a3a1a; }
  .masc-info small { display: block; opacity: .75; } .masc-bar { display: block; height: 6px; margin: 3px 0 1px; border-radius: 3px; background: rgba(0,0,0,.15); overflow: hidden; }
  .masc-bar i { display: block; height: 100%; background: linear-gradient(90deg, #3aa84a, #9ae05a); }`;
  document.head.append(css);
}

/* ---------- 🐕 Pipoca: as missões da Tia Zuzu (Vila) ---------- */
{
  const xpNivel = L => Math.max(1, xpPara(L + 1) - xpPara(L));
  if (NPCS.zuzu) MISSOES.push(
    { id: 'pipoca1', npc: 'zuzu', lvl: 12, titulo: '🐕 O filhote da pipoca', texto: 'Tem um filhotinho de vira-lata que aparece aqui TODO DIA pedindo pipoca! Mas os moleques da rua ficam correndo atrás dele e ele morre de medo. Vença 15 Moleques da Vila para ele ficar tranquilo?', req: { kill: 'moleque', n: 15 }, rec: { xp: Math.round(xpNivel(12) * 0.8), ouro: 2500 }, fim: 'Olha só, ele já está abanando o rabo pra você! Acho que ele gostou de você...' },
    { id: 'pipoca2', npc: 'zuzu', lvl: 14, pre: 'pipoca1', titulo: '🐕 Um lar para o Pipoca', texto: 'O Tonhão vive chutando a bola em cima do coitadinho! Dê uma lição nele (vença o Tonhão 3 vezes) e o filhote é SEU. Eu já até dei um nome: Pipoca!', req: { kill: 'tonhao', n: 3 }, rec: { xp: Math.round(xpNivel(14) * 1), ouro: 4000, flag: 'pet_pipoca' }, fim: 'O Pipoca agora é o seu MASCOTE! Coloque ele com você em Equipamento → ✨ Adornos. Caçando juntos, ele cresce e traz tostões a mais. Cuida bem dele, viu?' },
  );
}
// 🐱 Sortudo: as missões da Dona Yuki do Onigiri (Tóquio)
{
  const xpNivel = L => Math.max(1, xpPara(L + 1) - xpPara(L));
  if (NPCS.loja_toquio) MISSOES.push(
    { id: 'sortudo1', npc: 'loja_toquio', lvl: 72, titulo: '🐱 O gatinho que fugiu', texto: 'Ai, ai! O gatinho da sorte da minha loja fugiu! Ele é doido pelos Gatos da Sorte de cerâmica, aqueles que acenam. Se você juntar 8 deles, ele vem atrás, tenho certeza!', req: { item: 'lr_toquio_2', n: 8 }, rec: { xp: Math.round(xpNivel(72) * 0.8), ouro: 72 * 300 }, fim: 'Ouvi um "miau" lá perto da arena... Acho que ele está chegando!' },
    { id: 'sortudo2', npc: 'loja_toquio', lvl: 76, pre: 'sortudo1', titulo: '🐱 Sortudo, o Gatinho da Sorte', texto: 'Ele foi visto perto do Sensei do Drible, mas o Sensei não deixa ninguém chegar perto! Vença o Sensei 3 vezes e traga o gatinho de volta.', req: { kill: 'toquio_chefe', n: 3 }, rec: { xp: Math.round(xpNivel(76) * 1), ouro: 76 * 400, flag: 'pet_sortudo' }, fim: 'Ele não quer sair do seu lado! Fica com ele: o nome dele é SORTUDO. Coloque ele com você em Equipamento → ✨ Adornos — com ele, cai mais item dos adversários!' },
  );
}
window.MASCOTES = { MASC, MASC_FASES, mascDados, mascGanha, mascBonus, mascPontosNivel };
