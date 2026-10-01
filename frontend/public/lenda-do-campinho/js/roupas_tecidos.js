/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧵 CADA ROUPA COM O SEU TECIDO (v306), a pedido do dono ("refaça com cuidado todas as vestimentas").
   Antes: 17 camisas saíam lisas, as outras dividiam 8 tecidos (a Armadura Negra usava o da Negra e Ouro),
   os 22 calções saíam todos na cor padrão e as 21 caneleiras nem apareciam.
   Agora cada peça tem um tecido desenhado no Higgsfield a partir do ícone dela (a/tx_<item>.webp, 256 px):
   - CAMISA: o tecido cobre a camisa (qualquer tipo: futebol, regata, terno, moletom...) — visual_itens.js;
   - CALÇÃO: o tecido cobre o calção/calça (pixels da cor-chave azul da folha), com a sombra de sempre;
   - CANELEIRA: aparece por cima da meia, entre o calção e a chuteira.
   Carregar DEPOIS de visual_itens.js e pescoco_arte.js.
   ============================================================ */
{
  const CAMISAS = ['camiseta', 'camisa_listrada', 'camisa_futsal', 'camisa_ct', 'camisa_pro', 'regata_dunas', 'moletom_sakura', 'camiseta_flamingo', 'terno_tango',
    'regata_copacabana', 'xadrez_bonde', 'jaqueta_paris', 'moletom_alpes', 'terno_milao', 'regata_madri', 'terno_londres', 'camiseta_vila', 'camisa_elite', 'camisa_mundo',
    'camisa_tita', 'camisa_mare', 'camisa_imortal', 'camisa_campea', 'camisa_coral', 'camisa_abissal', 'camisa_draconica', 'camisa_lunar', 'camisa_marciana',
    'camisa_estelar', 'camisa_galactica', 'camisa_chama', 'camisa_armadura', 'camisa_pocos', 'camisa_aniquilador'];
  const CALCOES = ['shorts_rasgado', 'calcao_tactel', 'calcao_praia', 'calcao_pro', 'calcao_camuflado', 'bermuda_oasis', 'calca_neon', 'bermuda_surf', 'calca_tango',
    'bermuda_ipanema', 'jeans_alfama', 'short_saibro', 'calca_alpes', 'short_grife', 'short_classico', 'calca_bigben', 'bermuda_gonzaga', 'calcao_tsunami', 'calcao_neon',
    'calcao_marujo', 'calcao_linho', 'calcao_dragao'];
  const CANELEIRAS = ['caneleira_abissal', 'caneleira_areia', 'caneleira_brasa', 'caneleira_carbono', 'caneleira_coral', 'caneleira_draconica', 'caneleira_elite',
    'caneleira_escamas', 'caneleira_escaravelho', 'caneleira_estelar', 'caneleira_galactica', 'caneleira_galaxia', 'caneleira_glacial', 'caneleira_lunar',
    'caneleira_marciana', 'caneleira_mundo', 'caneleira_negra', 'caneleira_papelao', 'caneleira_plastico', 'caneleira_salva', 'caneleira_samurai'];
  // camisas: o tecido próprio vira a "estampa" (visual_itens.js aceita tx_<id>)
  for (const id of CAMISAS) if (ITENS[id]) ITENS[id].estampa = 'tx_' + id;
  const TEM_CAL = new Set(CALCOES), TEM_CAN = new Set(CANELEIRAS);

  /* ---------- pixels de um tecido (256×256), quando a imagem chegar ---------- */
  const PX = {}; let faltou = false;
  function pixels(nome) {
    if (PX[nome]) return PX[nome];
    const im = typeof aSprite === 'function' ? aSprite(nome) : null; if (!im) { faltou = true; return null; }
    const c = mkCanvas(256, 256), x = c.getContext('2d'); x.drawImage(im, 0, 0, 256, 256);
    return PX[nome] = x.getImageData(0, 0, 256, 256).data;
  }
  setInterval(() => { if (faltou) { faltou = false; try { SPR_CACHE.clear(); } catch (e) { } } }, 800); // chegou um tecido: redesenha

  const _lookTx = lookJogador;
  lookJogador = function () {
    const L = _lookTx.apply(this, arguments);
    try {
      const eq = G.save && G.save.equip; if (!L || !eq || L.folha) return L;
      if (eq.calcao && TEM_CAL.has(eq.calcao)) { L.txCalcao = 'tx_' + eq.calcao; delete L._kb; }
      if (eq.perna && TEM_CAN.has(eq.perna)) { L.txCanel = 'tx_' + eq.perna; delete L._kb; }
    } catch (e) { }
    return L;
  };
  let TX = null;
  const _sprTx = spriteBoneco;
  spriteBoneco = function (look) {
    if (!look || (!look.txCalcao && !look.txCanel)) return _sprTx.apply(this, arguments);
    TX = { cal: look.txCalcao, can: look.txCanel }; try { return _sprTx.apply(this, arguments); } finally { TX = null; }
  };
  const _tingeTx = tingeCelula;
  tingeCelula = function (base, cores) {
    const out = _tingeTx.apply(this, arguments);
    if (!TX || (typeof MODO_AGORA !== 'undefined' && MODO_AGORA === 'skin') || !cores || !base || !base.d) return out;
    try { pintaTecidos(out, base, TX); } catch (e) { }
    return out;
  };
  // pinta os pixels escolhidos com o tecido, esticado na caixa deles, mantendo a luz e a sombra do desenho
  function aplica(o, idx, lumDe, ref, tex, W) {
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (const i of idx) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
    for (const i of idx) {
      const u = ((i % W) - x0) / w, v = (((i / W) | 0) - y0) / h;
      const su = u * 0.8 + 0.1, sv = v * 0.8 + 0.1, k = ((sv * 255) | 0) * 256 + ((su * 255) | 0);
      const f = lumDe(i) / (ref || 0.5);
      for (let j = 0; j < 3; j++) { const c = tex[k * 4 + j]; o[i * 4 + j] = f <= 1 ? c * (0.25 + 0.75 * f) : Math.min(255, c + (255 - c) * (f - 1) * 0.8); }
    }
  }
  function pintaTecidos(out, base, T) {
    const { d, rot, lum, ref } = base, W = FOLHA_CW, H = FOLHA_CH;
    const texCal = T.cal ? pixels(T.cal) : null, texCan = T.can ? pixels(T.can) : null;
    if (!texCal && !texCan) return;
    const x = out.getContext('2d'), img = x.getImageData(0, 0, W, H), o = img.data;
    const lumDe = i => lum[i] || Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) / 255;
    if (texCal) { // calção: os pixels da cor-chave azul
      const idx = []; for (let i = 0; i < rot.length; i++) if (rot[i] === 3) idx.push(i);
      if (idx.length > 20) aplica(o, idx, lumDe, ref[3], texCal, W);
    }
    if (texCan) { // caneleira: a meia (branca) entre o calção e a chuteira
      let y0 = -1, y1 = -1;
      for (let y = 0; y < H; y++) { let tem = false; for (let xx = 0; xx < W; xx += 2) if (d[(y * W + xx) * 4 + 3] > 20) { tem = true; break; } if (tem) { if (y0 < 0) y0 = y; y1 = y; } }
      if (y0 >= 0) {
        const lim = y1 - (y1 - y0) * 0.3, idx = [];
        for (let y = Math.floor(lim); y <= y1; y++) for (let xx = 0; xx < W; xx++) {
          const i = y * W + xx; if (d[i * 4 + 3] < 40 || rot[i]) continue;
          const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          if (mx > 158 && (mx - mn) < 0.22 * mx) idx.push(i); // branco/cinza claro = meia
        }
        if (idx.length > 12) { const v = idx.map(lumDe).sort((a, b) => a - b); aplica(o, idx, lumDe, v[v.length >> 1], texCan, W); }
      }
    }
    x.putImageData(img, 0, 0);
  }
  window.ROUPAS_TECIDO = { CAMISAS, CALCOES, CANELEIRAS }; // (para os testes)
}
