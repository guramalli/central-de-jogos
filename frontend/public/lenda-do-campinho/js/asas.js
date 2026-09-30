/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🪽 ASAS GRANDES (v228), como os addons de asa do Tibia: passam do quadrado.
   As asas eram pintadas DENTRO do desenho do boneco (não podiam passar da borda). No jogo, agora
   saem do desenho e são pintadas à parte: maiores (≈1,7 quadrado), translúcidas (50%) e batendo
   de leve quando anda. De frente e de lado ficam atrás do corpo; de costas, na frente (como antes).
   Retrato, ficha e cartão continuam com as asas de antes. Montado: continua como era.
   Carregar DEPOIS de luxo.js e montarias.js.
   ============================================================ */
const ASAS_ALFA = 0.5, ASAS_LARG = 1.7; // v230: mais translúcidas (na box, com adversários em volta, elas não "quebram" a imagem)
let ASAS_FORA = false; // true só enquanto o jogo desenha o jogador (a pé)
{
  const _lookAsas = lookJogador;
  lookJogador = function (retrato) {
    const L = _lookAsas.apply(this, arguments);
    if (!ASAS_FORA || retrato || !L || L.costas !== 'costas-anjo') return L;
    const s = Object.assign({}, L); delete s.costas; return s; // o desenho do corpo sai sem as asas
  };
  const temAsas = () => { try { const L = _lookAsas(); return !!(L && L.costas === 'costas-anjo'); } catch (e) { return false; } };
  function desenhaAsas(ctx, e, vista) {
    const lado = vista === 'lado', pad = lado ? 'ac_asa_lado' : 'ac_asas';
    const nome = typeof asaEscolhida === 'function' ? asaEscolhida(lado) : pad; if (!nome) return false; // v302: adornos.js escolhe o tipo (ou nenhuma)
    const im = aSprite(nome) || aSprite(pad); if (!im) return false;
    const alt = alturaEnt(e) * T, x = e.x * T, pe = e.y * T;
    const bate = e.mov ? Math.sin(G.agora / 110) * 0.06 : Math.sin(G.agora / 600) * 0.02; // bater de asas
    let w = (lado ? ASAS_LARG * 0.42 : ASAS_LARG) * T, h = w * im.height / im.width;
    const ombro = pe - alt * 0.6; // altura dos ombros
    ctx.save(); ctx.globalAlpha *= (typeof asaAlfa === "function" ? asaAlfa() : ASAS_ALFA);
    ctx.translate(x, ombro); if (e.flip) ctx.scale(-1, 1);
    ctx.scale(1 + bate, 1 - bate * 0.4);
    if (lado) ctx.drawImage(im, -w * 0.95, -h * 0.42, w, h); // atrás das costas (para a esquerda quando olha à direita)
    else ctx.drawImage(im, -w / 2, -h * 0.34, w, h);
    ctx.restore(); return true;
  }
  const _desenhaEntAsas = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    if (e !== G.p || !G.save || (typeof montadoAgora === 'function' && montadoAgora()) || !temAsas()) return _desenhaEntAsas.apply(this, arguments);
    let vista = !e.mov && G.agora - (e.tVista || 0) > 2500 ? 'frente' : (e.vista || 'frente');
    // v302: durante uma jogada (Fôlego de Campeão, pedalada...) as asas grandes saíam e voltavam as antigas, cortadas
    // dentro do desenho ("asa quebrada"). Agora as asas grandes continuam, seguindo o pulo/giro da jogada.
    const j = G.jogada; let pose = null;
    if (j && typeof poseDaJogada === 'function') {
      try { pose = poseDaJogada(j, Math.min(1, (G.agora - j.t0) / j.dur)); } catch (err) { pose = null; }
      if (j.id === 'chute_colocado' || (typeof PERNAS_JOGADA !== 'undefined' && PERNAS_JOGADA[j.id])) vista = 'lado';
    }
    const asas = () => {
      if (!pose) return desenhaAsas(ctx, e, vista);
      ctx.save(); ctx.translate((e.x + (pose.ox || 0)) * T, e.y * T - (pose.sobe || 0) * T);
      if (pose.rot) { const meio = alturaEnt(e) * T * 0.5; ctx.translate(0, -meio); ctx.rotate(pose.rot); ctx.translate(0, meio); }
      ctx.translate(-e.x * T, -e.y * T); desenhaAsas(ctx, e, vista); ctx.restore();
    };
    const atras = vista !== 'costas';
    if (atras) asas();
    ASAS_FORA = true; let r; try { r = _desenhaEntAsas.apply(this, arguments); } finally { ASAS_FORA = false; }
    if (!atras) asas();
    return r;
  };
}
