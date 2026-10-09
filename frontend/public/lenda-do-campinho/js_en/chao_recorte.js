/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ✂️ CHÃO RECORTADO POR BLOCO (v412.4, dono: "travadinhas andando nas cidades, principalmente com nível alto que anda
   muito rápido... não desista até otimizarmos"). Medido (_teste/viagem_perf, save do dono, 14 quadradinhos/s): nas cidades
   de chão antigo (Vila, Praia, Cidade, CT, Estádio, Tóquio, Milão, Madri, Munique, Buenos Aires...) cada tipo de chão é UMA
   forma (Path2D) com os quadradinhos do MAPA INTEIRO (caminhoTiles/caminhoSuave, arte.js; assets.js monta). Cada bloco de
   1024 px mandava a forma toda para a placa de vídeo: 20–30 ms só para ela "desembrulhar" (Deserializing) enquanto a página
   esperava (WaitForGetOffset) — a maior parte das travadinhas andando e na troca de cidade (Brasil: 76 → 25 por volta).
   Aqui: enquanto um bloco é pintado, a forma é trocada por outra só com os quadradinhos perto do bloco (2 de margem) — o
   mesmo desenho dentro do bloco (diferença ≤0,002% dos pixels, só suavização de borda). A lousa não muda (a assinatura do
   chão pronto continua a mesma). Desligar: window.CRT_DESLIGA = true.
   Carregar DEPOIS de chao_pronto.js (ele guarda a conta do código antes de pinta ser embrulhada).
   ============================================================ */
{
  try { if (window.CP && CP.codigoBase) CP.codigoBase(); } catch (e) { } // (fixa a conta do código antes de embrulhar pinta)
  const MG = 2 * T, MIN = 64;
  const est = window.CRT_EST = { trocas: 0, montadas: 0, msMontar: 0, quadradinhosAntes: 0, quadradinhosDepois: 0 };
  const marca = (p, f, tiles) => { if (tiles && tiles.length >= MIN) try { Object.defineProperty(p, '__sub', { value: { f, tiles, cache: new Map() } }); } catch (e) { } return p; };
  const _ct = caminhoTiles; caminhoTiles = function (tiles, e, rad) { const p = _ct.apply(this, arguments); return marca(p, ts => _ct(ts, e, rad), tiles); };
  const _cs = caminhoSuave; caminhoSuave = function (m, t, tiles) { const p = _cs.apply(this, arguments); return marca(p, ts => _cs(m, t, ts), tiles); };
  let REG = null;
  const P = CHAO_BLOCOS.ChaoBlocos.prototype, oP = P.pinta;
  P.pinta = function* (alvo, info, orc) {
    const it = oP.call(this, alvo, info, orc), S = this;
    const reg = info && info.w * info.h < 0.5 * S.width * S.height ? info : null; // (a prévia é o mapa inteiro: fica a forma inteira)
    try { for (;;) { const ant = REG; REG = reg; let r; try { r = it.next(); } finally { REG = ant; } if (r.done) return r.value; yield r.value; } }
    finally { try { it.return(); } catch (e) { } }
  };
  function sub(p, R) {
    const S = p.__sub, k = R.x0 + ',' + R.y0 + ',' + R.w + ',' + R.h; let q = S.cache.get(k);
    if (!q) {
      const a = performance.now(), x0 = R.x0 - MG, y0 = R.y0 - MG, x1 = R.x0 + R.w + MG, y1 = R.y0 + R.h + MG;
      const ts = S.tiles.filter(([i, j]) => (i + 1) * T > x0 && i * T < x1 && (j + 1) * T > y0 && j * T < y1);
      q = ts.length ? S.f(ts) : new Path2D(); S.cache.set(k, q);
      est.montadas++; est.msMontar += performance.now() - a; est.quadradinhosAntes += S.tiles.length; est.quadradinhosDepois += ts.length;
    }
    est.trocas++; return q;
  }
  const C2 = CanvasRenderingContext2D.prototype;
  for (const n of ['fill', 'stroke', 'clip']) { const o = C2[n]; C2[n] = function (...a) { if (REG && !window.CRT_DESLIGA && a[0] && a[0].__sub) a[0] = sub(a[0], REG); return o.apply(this, a); }; }
}
