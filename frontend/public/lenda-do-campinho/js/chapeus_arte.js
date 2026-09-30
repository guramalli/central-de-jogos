/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎩 CHAPÉUS DE VERDADE (v307): os 33 itens de cabeça eram 9 desenhos simples repetidos (as 9 coroas
   eram iguais, o Elmo do Cavaleiro Negro virava um gorro...). Agora cada um tem a sua arte do Higgsfield
   em 3 vistas — de frente, de lado e de costas (a/ch_<item>_f|l|c.webp) — encaixada na cabeça pelo tipo
   (boné, faixa, fone, coroa, chapéu de aba, gorro, cartola, capacete, máscara...).
   Carregar DEPOIS de pescoco_arte.js.
   ============================================================ */
{
  // tipo: [largura (unidades do boneco; a cabeça tem 48), onde fica a base do desenho]
  const CAB = { cx: 50, cy: 52, ry: 22.5 }, TOPO = CAB.cy - CAB.ry;
  const TIPO = {
    bone: [53, TOPO + 21], faixa: [50, TOPO + 24], fone: [60, CAB.cy + 13], louros: [54, TOPO + 27], coroa: [40, TOPO + 8], tiara: [50, TOPO + 17],
    aba: [62, TOPO + 22], gorro: [52, TOPO + 20], cartola: [58, TOPO + 15], tricorne: [58, TOPO + 20], nemes: [64, CAB.cy + 26], mascara: [62, CAB.cy + 30], elmo: [57, CAB.cy + CAB.ry + 6],
  };
  const CHAPEU = {
    bone: 'bone', bone_maraca: 'bone', bone_cacador: 'bone', bone_maquinista: 'bone',
    faixa_suor: 'faixa', faixa_capitao: 'faixa', faixa_saibro: 'faixa', faixa_trovao: 'faixa', faixa_ronin: 'faixa',
    headset: 'fone', headset_neon: 'fone', headset_classico: 'fone',
    louros: 'louros', louros_rei: 'louros', coroa: 'coroa', coroa_imortal: 'coroa', coroa_dragao: 'coroa', coroa_galactica: 'coroa', coroa_estelar: 'tiara',
    chapeu_dunas: 'aba', panama_miami: 'aba', chapeu_tejo: 'aba', panama_milao: 'aba', gorro_tango: 'gorro', gorro_alpes: 'gorro',
    cartola_londres: 'cartola', chapeu_capitao: 'tricorne', nemes_dourado: 'nemes', faixa_farao: 'nemes', mascara_farao: 'mascara',
    elmo_negro: 'elmo', capacete_dragao: 'elmo', capacete_estelar: 'elmo',
  };
  const ALTO = new Set(['faixa', 'tricorne', 'elmo', 'mascara', 'nemes', 'fone', 'aba', 'louros']);
  let faltou = false;
  setInterval(() => { if (faltou) { faltou = false; try { SPR_CACHE.clear(); } catch (e) { } } }, 800);

  const _lookCh = lookJogador;
  lookJogador = function () {
    const L = _lookCh.apply(this, arguments);
    try {
      const id = G.save && G.save.equip && G.save.equip.cabeca;
      if (L && !L.folha && id && CHAPEU[id] && L.chapeu) {
        L.chapeuVar = id; if (ALTO.has(CHAPEU[id])) L.chapeu = 'chapeu-cartola'; // o recorte do boneco reserva o espaço de um chapéu alto (senão cortava a pluma/as pontas)
        delete L._kb;
      }
    } catch (e) { }
    return L;
  };
  const _specCh = specDe;
  specDe = function (look) { const sp = _specCh.apply(this, arguments); if (look && look.chapeuVar) sp.chapeuVar = look.chapeuVar; return sp; };

  const _chapeuVetor = chapeu;
  chapeu = function (x, sp, v) {
    const id = sp && sp.chapeuVar, tipo = id && CHAPEU[id];
    if (!tipo) return _chapeuVetor.apply(this, arguments);
    const vis = v === 'l' ? 'l' : v === 'c' ? 'c' : 'f';
    const fr = aSprite('ch_' + id + '_f'), im = vis === 'f' ? fr : aSprite('ch_' + id + '_' + vis);
    if (!fr || !im) { faltou = true; return _chapeuVetor.apply(this, arguments); } // enquanto a arte chega: o desenho de antes
    const [larg, base] = TIPO[tipo], s = larg / fr.width; // mesma escala nas 3 vistas (a arte foi feita junto)
    const w = im.width * s, cx = CAB.cx + (vis === 'l' ? 1.5 : 0);
    const corte = tipo !== 'faixa' ? 0 : id === 'faixa_trovao' ? 0.18 : 0.48; // faixa: a arte é o anel inteiro; na cabeça só aparece a frente dele
    const sy = im.height * corte, sh = im.height - sy, h = sh * s;
    x.save(); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, sy, im.width, sh, cx - w / 2, base - h, w, h); x.restore();
  };
  window.CHAPEUS_ARTE = CHAPEU; // (para os testes)
}
