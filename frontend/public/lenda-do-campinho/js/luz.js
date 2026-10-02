/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   💡 HOLOFOTE (v245; nome trocado na v247 — antes era 'Utevo Lux', igual ao Tibia) — as luzes do estádio em você
   Todo mundo aprende no nível 8 (vai sozinho para a barra de atalhos).
   Por 6 minutos, abre um círculo claro em volta de você: a escuridão da noite,
   das cavernas/áreas fechadas e o tom escuro da chuva/tempestade ficam de fora.
   Quem escurece a tela chama corEscuro(ctx, 'r,g,b', alfa, emTela) no lugar do rgba().
   Carregar DEPOIS de game.js (usa usarDrible, DRIBLES, EMOJI_DRIBLE).
   ============================================================ */
const LUZ_DUR = 6 * 60 * 1000, LUZ_RAIO = 5.5; // em quadradinhos
DRIBLES.utevo_lux = { nome: 'Holofote', tipo: 'buff', lvl: 8, foco: 20, cd: 2000, dur: LUZ_DUR, fx: 'estrelas', cor: '#fff2a0', desc: 'As luzes do estádio acompanham você por 6 minutos: clareia a noite, as cavernas e a chuva.' };
if (typeof EMOJI_DRIBLE !== 'undefined') EMOJI_DRIBLE.utevo_lux = '💡';

function luzAtiva() { return typeof G !== 'undefined' && G.buffs && (G.buffs.luz || 0) > G.agora; }
// a cor da escuridão com um "buraco" suave em volta do jogador quando a luz está acesa
function corEscuro(ctx, rgb, a, emTela) {
  if (!luzAtiva() || !G.p) return `rgba(${rgb},${a})`;
  const z = emTela ? (G.zoom || 1) : 1, cam = G.cam || { x: 0, y: 0 };
  const cx = emTela ? (G.p.x * T - cam.x) * z : G.p.x * T, cy = emTela ? ((G.p.y - 0.5) * T - cam.y) * z : (G.p.y - 0.5) * T;
  const R = LUZ_RAIO * T * z, fim = Math.max(0, G.buffs.luz - G.agora), piscar = fim < 8000 && Math.floor(fim / 400) % 2 ? 0.8 : 1; // pisca no fim
  const g = ctx.createRadialGradient(cx, cy, R * 0.3 * piscar, cx, cy, R * piscar);
  g.addColorStop(0, `rgba(${rgb},${a * 0.05})`); g.addColorStop(0.55, `rgba(${rgb},${a * 0.3})`); g.addColorStop(1, `rgba(${rgb},${a})`);
  return g;
}
{
  const _usarDribleLuz = usarDrible;
  usarDrible = function (id) {
    if (id !== 'utevo_lux') return _usarDribleLuz.apply(this, arguments);
    const dr = DRIBLES[id], s = G.save, st = stats(), p = G.p;
    if (!s.dribles.includes(id) || s.hp <= 0) return;
    if (s.nivel < dr.lvl) { log(`Você precisa do nível ${dr.lvl} para usar ${dr.nome}.`, 'l-sis'); return; }
    if (G.agora < (G.cds[id] || 0)) return;
    const custo = Math.ceil(dr.foco * st.custoFoco);
    if (s.foco < custo) { log(`Foco insuficiente para ${dr.nome} (precisa de ${custo}).`, 'l-sis'); som('erro'); return; }
    s.foco -= custo; G.cds[id] = G.agora + dr.cd; G.buffs.luz = G.agora + dr.dur; G.luzAvisou = false;
    efeito('estrelas', p.x, p.y, dr.cor); tituloSkill(p, dr.nome, dr.cor); som('dr_utevo_lux'); // v350: som próprio (antes era o da moeda)
    log('💡 Holofote! As luzes do estádio acompanham você por 6 minutos.', 'l-info'); G.uiSujo = true;
  };
  // avisa quando a luz apaga
  const _atualizaLuz = atualiza;
  atualiza = function () {
    const r = _atualizaLuz.apply(this, arguments);
    if (G.buffs && G.buffs.luz && G.agora >= G.buffs.luz && !G.luzAvisou) { G.luzAvisou = true; G.buffs.luz = 0; if (G.rodando) log('💡 O seu Holofote apagou. Acenda de novo quando quiser.', 'l-sis'); }
    return r;
  };
  // um brilho quentinho em volta de você enquanto a luz está acesa
  const _desenhaNoiteLuz = desenhaNoite;
  desenhaNoite = function (ctx) {
    const r = _desenhaNoiteLuz.apply(this, arguments);
    if (luzAtiva() && G.p && G.mapa && !G.mapa.interior) {
      const x = G.p.x * T, y = (G.p.y - 0.5) * T, R = LUZ_RAIO * T * 0.9;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 4, x, y, R); g.addColorStop(0, 'rgba(255,236,170,0.14)'); g.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2);
      // a "bolinha de luz" flutuando em cima da cabeça
      const oy = y - 0.75 * T + Math.sin(G.agora / 380) * 4, bx = x + 0.62 * T + Math.cos(G.agora / 900) * 4; /* do lado da cabeça (em cima ficava atrás do nome) */
      const b = ctx.createRadialGradient(bx, oy, 1, bx, oy, 18); b.addColorStop(0, 'rgba(255,250,215,0.95)'); b.addColorStop(0.4, 'rgba(255,230,140,0.5)'); b.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = b; ctx.fillRect(bx - 18, oy - 18, 36, 36);
      ctx.restore();
    }
    return r;
  };
}
