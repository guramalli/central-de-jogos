/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🔒 CAMINHO FECHADO (v186): tentar passar por uma saída trancada só
   mostrava uma linha no chat. Agora aparece uma janela dizendo QUAL missão
   abre o caminho, a próxima que falta fazer (se houver missões antes),
   COM QUEM falar, onde a pessoa está e o seu progresso — e um botão que
   faz a seta amarela levar até ela. Da 2ª vez em diante (no mesmo mapa),
   é um aviso grande na tela, sem abrir janela.
   Carregar DEPOIS de avisos.js.
   ============================================================ */
// a missão que abre o caminho e a próxima que falta fazer na corrente de missões até ela
function passoParaLiberar(flag) {
  const alvo = MISSOES.find(q => q.rec && q.rec.flag === flag); if (!alvo) return null;
  let q = alvo; const vistos = new Set();
  while (q.pre && !vistos.has(q.id)) {
    vistos.add(q.id); const pre = MISSOES.find(m => m.id === q.pre);
    if (!pre || statusMissao(pre) === 'feita') break;
    q = pre;
  }
  return { alvo, q, st: statusMissao(q) };
}
function ondeFica(npcId) {
  const a = typeof alvoNpc === 'function' && alvoNpc(npcId); if (!a || !a.mapa) return '';
  return a.mapa === G.mapa.id ? 'aqui neste mapa' : (typeof getMapa === 'function' ? getMapa(a.mapa).nome.split(' —')[0] : a.mapa);
}
function textoPasso(p) {
  const n = NPCS[p.q.npc] || {}, nome = n.nome || 'someone', onde = ondeFica(p.q.npc), lvl = p.q.lvl || 1;
  const outra = p.q !== p.alvo;
  const [a, b] = progressoMissao(p.q);
  const comQuem = `${nome}${onde ? ` (${onde})` : ''}`;
  switch (p.st) {
    case 'pronta': return `Mission "${p.q.titulo}" done! Go back and talk to ${comQuem}.`;
    case 'ativa': return `Keep going with ${comQuem}'s mission "${p.q.titulo}": ${descMissao(p.q)} (${a}/${b}).`;
    case 'nivel': return `Reach level ${lvl} and talk to ${comQuem} to get the mission "${p.q.titulo}".`;
    default: return `Talk to ${comQuem} and get the mission "${p.q.titulo}"${outra ? ' (that one comes first)' : ''}.`;
  }
}
const SAIDA_AVISADA = {};
function avisaSaidaTrancada(sa) {
  const req = sa.req; const p = passoParaLiberar(req.flag);
  if (!p) { log(req.msg, 'l-sis'); if (typeof avisoTela === 'function') avisoTela(req.msg, 'l-dano'); return; }
  const destino = sa.para && typeof getMapa === 'function' ? getMapa(sa.para).nome.split(' —')[0] : 'there';
  const passo = textoPasso(p);
  log(`🔒 ${req.msg} ${passo}`, 'l-sis');
  const chave = G.mapa.id + '|' + req.flag;
  if (SAIDA_AVISADA[chave]) { if (typeof avisoTela === 'function') avisoTela(`The way to ${destino} is closed. ${passo}`, 'l-dano'); return; }
  SAIDA_AVISADA[chave] = true;
  const n = NPCS[p.q.npc] || {};
  const guia = () => { G.guiaPedido = { npc: p.q.npc, quest: p.q.id }; G.guiaOn = true; fechaModal(); log(`📍 The yellow arrow now points to ${n.nome || 'that person'}.`, 'l-xp'); };
  abreModal(el('h2', {}, `🔒 ${destino}: path closed`),
    el('p', {}, req.msg),
    el('div', { class: 'saida-passo' },
      el('b', {}, '👉 What to do now'), el('p', {}, passo),
      p.q !== p.alvo ? el('small', {}, `After it comes "${p.alvo.titulo}" (from ${(NPCS[p.alvo.npc] || {}).nome || '...'}), which opens the way.`) : el('small', {}, `This is the mission that opens the way to ${destino}.`)),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn amarelo', type: 'button', onclick: guia }, `📍 Take me to ${n.nome || 'there'}`),
      el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Got it')));
}
// a seta amarela segue o pedido até a missão ser aceita/feita
{
  const _objetivoSaida = objetivoAtual;
  objetivoAtual = function () {
    const g = G.guiaPedido, s = G.save;
    if (g && s && s.tut >= TUTORIAL.length) {
      const q = MISSOES.find(m => m.id === g.quest), st = q && statusMissao(q);
      if (!q || st === 'feita' || (st === 'ativa' && !g.entregar)) G.guiaPedido = null; // v238: pedido do rastreador (entregar) vale até a missão acabar
      else { const a = alvoNpc(g.npc); if (a) return a; }
    }
    return _objetivoSaida.apply(this, arguments);
  };
}
{
  const st = document.createElement('style');
  st.textContent = `.saida-passo { background: #fff6d8; border: 2px solid #e0a020; border-radius: 10px; padding: 8px 12px; margin: 8px 0; }
  .saida-passo p { margin: 4px 0; font-weight: 700; font-size: 15px; } .saida-passo small { opacity: .85; }`;
  document.head.append(st);
}
