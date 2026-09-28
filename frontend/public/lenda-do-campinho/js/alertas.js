/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🔔 AVISOS IMPORTANTES (v193): coisas que pedem atenção ficavam só num
   botãozinho piscando ou no chat. Agora aparecem em cartões laranja no canto
   da tela (onde ficam as dicas), cada um com o botão que resolve:
   - pontos de atributo para distribuir → Ficha;
   - carreira: reunião marcada com a diretoria, propostas de clubes → Carreira;
   - seu time: titulares cansados, caixa negativo, escalação incompleta → Meu Time.
   Clicou "depois": o aviso some por 5 minutos (volta se ainda valer).
   Carregar DEPOIS de rastreador.js, team.js e carreira.js.
   ============================================================ */
const ALERTA_ADIA = {};
function alertasAtuais() {
  const s = G.save, lista = []; if (!s) return lista;
  if ((s.pontos || 0) > 0) lista.push({ id: 'pontos', ic: '⭐', txt: `Você tem ${s.pontos} ponto${s.pontos > 1 ? 's' : ''} de atributo para distribuir!`, bt: 'Distribuir', fn: () => abreFicha() });
  try {
    const c = typeof carrDados === 'function' && s.carreira ? carrDados() : null;
    if (c && c.clube && c.reuniaoPendente) lista.push({ id: 'reuniao', ic: '📅', txt: 'Reunião marcada com a diretoria do seu clube!', bt: 'Ir à reunião', fn: () => abrirCarreira() });
    if (c && !c.clube && c.ofertas && c.ofertas.length) lista.push({ id: 'ofertas', ic: '📨', txt: `${c.ofertas.length} clube${c.ofertas.length > 1 ? 's querem' : ' quer'} contratar você!`, bt: 'Ver propostas', fn: () => abrirCarreira() });
  } catch (e) { }
  try {
    const t = s.time;
    if (t && t.elenco && typeof escalacaoAtual === 'function') {
      const esc = escalacaoAtual(); const vazios = esc.filter(x => !x.j).length;
      const cansados = esc.filter(x => x.j && !x.j.eu && x.j.energia < 45).length;
      if (vazios) lista.push({ id: 'escalacao', ic: '⚠️', txt: `Seu time está com ${vazios} posição${vazios > 1 ? 'ões' : ''} sem titular!`, bt: 'Escalar', fn: () => abrirTime('elenco') });
      else if (cansados >= 2) lista.push({ id: 'cansados', ic: '😓', txt: `${cansados} titulares do ${t.nome} estão cansados: troque por reservas antes do jogo.`, bt: 'Ver time', fn: () => abrirTime('elenco') });
      if (t.caixa < 0) lista.push({ id: 'caixa', ic: '💸', txt: `O caixa do ${t.nome} está negativo! Os salários atrasam e o moral cai.`, bt: 'Ver finanças', fn: () => abrirTime('clube') });
    }
  } catch (e) { }
  return lista.filter(a => !(ALERTA_ADIA[a.id] > Date.now()));
}
{
  const _rastAl = atualizaRastreador;
  atualizaRastreador = function () {
    const r = _rastAl.apply(this, arguments);
    const R = document.getElementById('rastreador'); if (!R || !G.save) return r;
    const box = el('div', { class: 'alertas-box' });
    for (const a of alertasAtuais()) {
      box.append(el('div', { class: 'cartao-alerta', style: `animation-delay:-${Date.now() % 1600}ms` }, // o brilho continua de onde estava (o cartão é refeito a cada atualização)
        el('span', { class: 'ca-ic' }, a.ic), el('span', { class: 'ca-txt' }, a.txt),
        el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => { ALERTA_ADIA[a.id] = Date.now() + 60000; G.uiSujo = true; a.fn(); } }, a.bt),
        el('button', { class: 'ca-x', type: 'button', title: 'Depois (some por 5 minutos)', onclick: () => { ALERTA_ADIA[a.id] = Date.now() + 300000; G.uiSujo = true; } }, '✕')));
    }
    if (box.children.length) R.prepend(box);
    return r;
  };
  // os avisos também mudam com o tempo (energia, reuniões): confere de vez em quando
  let assin = '';
  setInterval(() => { if (!G.rodando || !G.save) return; const a = alertasAtuais().map(x => x.id + x.txt).join('|'); if (a !== assin) { assin = a; G.uiSujo = true; } }, 3000);
}
{
  const st = document.createElement('style');
  st.textContent = `.alertas-box { display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px; pointer-events: auto; }
  .cartao-alerta { display: flex; align-items: center; gap: 8px; background: linear-gradient(#ffb347, #ff8a1f); color: #3b1a00; border: 3px solid #7a3a00; border-radius: 10px;
    padding: 6px 8px 6px 10px; box-shadow: 0 4px 0 rgba(0,0,0,.35); font: 800 14px Nunito, sans-serif; animation: alertaPulsa 1.6s ease-in-out infinite; max-width: 380px; }
  .cartao-alerta .ca-ic { font-size: 22px; } .cartao-alerta .ca-txt { flex: 1; line-height: 1.25; }
  .cartao-alerta .ca-x { background: none; border: 0; color: #5a2a00; font-weight: 900; cursor: pointer; font-size: 14px; padding: 2px 4px; }
  @keyframes alertaPulsa { 50% { box-shadow: 0 4px 0 rgba(0,0,0,.35), 0 0 16px 4px rgba(255,170,40,.85); } }
  @media (max-width: 600px) { .cartao-alerta { font-size: 12.5px; max-width: 92vw; } }`;
  document.head.append(st);
}
