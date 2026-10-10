// Jocelino — clima.js — a chuva (como o tempo do Stardew): chance por estação como no litoral paulista (verão chuvoso,
// inverno seco), sorteada e fixa por dia. Na chuva: gotas caindo (a arte fx/gota; o código só move), o céu um pouco
// mais escuro e o som da chuva; dentro de casa e no salão da pensão não chove. As próximas etapas consultam
// Clima.chove: a horta (rega sozinha), a obra (fecha) e a pesca (peixe raro).

const Clima = {
  CHANCE: [0.20, 0.10, 0.20, 0.30],   // Outono, Inverno, Primavera, Verão
  chove(dia) { return mulberry(dia * 7717 + 3)() < Clima.CHANCE[Math.floor((dia - 1) / 28) % 4]; },
  agora() { return !!G.mapa && !G.mapa.dentro && !G.mapa.palco && Clima.chove(G.dia); },
};
const GOTAS = Array.from({ length: 220 }, (_, i) => ({ x: (i * 97 % 1000) / 1000, y: (i * 61 % 1000) / 1000, v: 0.85 + (i % 7) * 0.07 }));
DESENHOS_TELA.push(ctx => {
  if (!Clima.agora()) return;
  const W = G.larg, H = G.alt, t = G.agora || 0;
  ctx.save(); ctx.fillStyle = 'rgba(35,50,75,.3)'; ctx.fillRect(0, 0, W, H); ctx.restore();   // o céu fechado
  const img = spr('fx/gota');
  if (!img) return;
  // Cada gota esticada num risco inclinado (o vento leva a chuva).
  ctx.save(); ctx.globalAlpha = 0.6;
  for (const g of GOTAS) {
    const x = ((g.x + t * 0.06) % 1) * W, y = ((g.y + t * g.v * 0.9) % 1) * H;
    ctx.setTransform(G.dpr, 0, 0, G.dpr, x * G.dpr, y * G.dpr); ctx.rotate(0.22); ctx.drawImage(img, -2, -14, 4, 28);
  }
  ctx.restore();
});
ATUALIZADORES.push(() => sons.ambiente('chuva', Clima.agora() ? 0.5 : 0));
