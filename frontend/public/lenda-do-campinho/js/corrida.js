/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   BICHOS CORRENDO (v148)
   Os bichos (arte única, olhando p/ a esquerda) ganharam 4 quadros de
   corrida: a/<sprite>_c1..c4.webp (Higgsfield; o caramelo é da v147 e fica
   no game.js). Andando, o quadro sai de e.fase (como os bonecos); os que
   voam batem as asas sempre. Quem não tem patas (minhocão, fantasma, robô
   de esteira, anel, nuvem, cometa) mexe por código: estica/encolhe/balança.
   Os quadros só carregam quando o bicho aparece no mapa (preCarregaMapa).
   game.js chama quadroBicho() e deformaBicho() ao desenhar os bichos.
   ============================================================ */
// escala: o quadro é um pouco maior que o bicho (asas, pulo) → desenha maior para o bicho ficar do mesmo tamanho
const CORRE_ESC = {
  pombo: 1, gaivota: 0.75, caranguejo: 1.016, // gaivota: com as asas abertas ficava maior que o jogador (v150)
  bicho_rato2: 1.003, bicho_tanuki: 1.013, bicho_morcego: 1.194, bicho_aranha: 1, bicho_toupeira: 1.006, bicho_mumia: 1,
  bicho_escorpiao: 1, bicho_jacare: 1.009, bicho_polvo: 1.006, bicho_touro: 1.002, bicho_gargula: 1.011, bicho_yeti: 1.007,
  bicho_dragao: 1, bicho_dragao_anciao: 1,
  et_coelho: 1.036, et_rocha: 1, et_selenita: 1.004, et_marciano: 1, et_rover: 1, et_cristal: 1.006, et_medusa: 1.019, et_cavaleiro: 1.002,
  ch_capitao_lunar: 1, ch_general_marciano: 1, ch_rainha_aneis: 1.002, ch_imperador_nebular: 1.008, ch_supremo: 1.003,
};
const CORRE_VOA = new Set(['gaivota', 'bicho_morcego', 'et_medusa']);

function quadroBicho(e, nome, look) {
  if (!(nome in CORRE_ESC)) return nome;
  const voa = CORRE_VOA.has(nome);
  if (!e.mov && !voa) return nome;
  const q = e.mov ? Math.floor((e.fase || 0) / (Math.PI / 2)) % 4 : Math.floor(G.agora / 140 + (e.uid || 0)) % 4;
  const s = nome + '_c' + (q + 1);
  return spr(s).ok ? s : nome; // ainda carregando: fica a arte antiga
}

// sem patas: movimento por código (sx/sy = esticar, rot = inclinar, dy = sobe/desce)
function deformaBicho(e, nome) {
  const t = G.agora / 260 + (e.uid || 0), f = e.mov ? (e.fase || 0) * 1.6 : t;
  switch (nome) {
    case 'bicho_minhocao': { const o = Math.sin(f * 1.4); return { sx: 1 + o * 0.07, sy: 1 - o * 0.07, rot: Math.sin(f * 0.7) * 0.05 }; }
    case 'bicho_fantasma': case 'et_nuvem': { const o = Math.sin(t); return { sx: 1 - o * 0.04, sy: 1 + o * 0.05, rot: Math.sin(t * 0.5) * 0.07 }; }
    case 'et_anel': return { rot: Math.sin(t * 0.8) * 0.14 };
    case 'et_cometa': { const o = Math.sin(t * 2.2); return { sx: 1 + o * 0.08, sy: 1 - o * 0.04, rot: Math.sin(t) * 0.05 }; }
    case 'et_robo': return e.mov ? { rot: Math.sin(f * 3) * 0.025, dy: Math.abs(Math.sin(f * 3)) * 1.5 } : null;
    case 'caranguejo': return e.mov ? { rot: Math.sin(f * 1.5) * 0.06 } : null; // anda de lado: gingado
  }
  return null;
}

// carrega os quadros dos bichos deste mapa (e só deles)
if (typeof preCarregaMapa === 'function') {
  const _preCarregaMapaCorre = preCarregaMapa;
  preCarregaMapa = function () {
    const r = _preCarregaMapaCorre.apply(this, arguments);
    try {
      for (const sp of (G.mapa && G.mapa.spawns) || []) {
        const l = MONSTROS[sp.m] && MONSTROS[sp.m].look; if (!l || l.tipo === 'humano') continue;
        const base = { pombo: 'pombo', caranguejo: 'caranguejo', gaivota: 'gaivota' }[l.tipo] || l.spr;
        if (base in CORRE_ESC) for (let i = 1; i <= 4; i++) spr(base + '_c' + i);
      }
    } catch (err) { }
    return r;
  };
}
