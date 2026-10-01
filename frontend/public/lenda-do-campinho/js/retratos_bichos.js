/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🐦 RETRATO DOS BICHOS COM A ARTE DE VERDADE (v332). No álbum de figurinhas, o Pombo Folgado, o Caramelo,
   o Beliscão e a Gaivota Ladra saíam com o desenho antigo (só contorno; o Caramelo ainda cortado), porque o
   retrato (pintaAparencia) desenhava os bichos com o vetor de sempre — no mapa eles já usam a arte nova.
   Agora o retrato usa a mesma imagem do mapa (o nome do bicho ou bicho_<nome>); enquanto ela carrega, mostra o
   desenho antigo e troca sozinho quando a arte chega. Vale para todos os retratos de bicho (álbum, wiki, janelas).
   Carregar no fim.
   ============================================================ */
(function () {
  const _pintaRetrato = pintaAparencia;
  pintaAparencia = function (canvas, look, opts = {}) {
    const t = look && look.tipo;
    const nome = t && t !== 'humano' && typeof ASSET_SET !== 'undefined' ? [t, 'bicho_' + t].find(n => ASSET_SET.has(n)) : null;
    if (!nome) return _pintaRetrato.apply(this, arguments);
    const desenha = () => {
      const e = spr(nome); if (!e || !e.ok) return false;
      const x = canvas.getContext('2d'), W = canvas.width, H = canvas.height, im = e.im;
      x.clearRect(0, 0, W, H);
      if (opts.fundo) { x.fillStyle = opts.fundo; x.fillRect(0, 0, W, H); }
      const s = Math.min(W * 0.9 / im.width, H * 0.84 / im.height), w = im.width * s, h = im.height * s;
      x.fillStyle = 'rgba(30,20,40,0.22)'; x.beginPath(); x.ellipse(W / 2, H * 0.95, w * 0.36, H * 0.035, 0, 0, 7); x.fill(); // sombrinha
      x.imageSmoothingQuality = 'high'; x.drawImage(im, (W - w) / 2, H * 0.95 - h, w, h);
      return true;
    };
    if (desenha()) return true;
    const r = _pintaRetrato.apply(this, arguments); // a arte ainda não chegou: o desenho antigo por enquanto
    let n = 0; const iv = setInterval(() => { if (desenha() || ++n > 80) clearInterval(iv); }, 250);
    return r;
  };
})();
