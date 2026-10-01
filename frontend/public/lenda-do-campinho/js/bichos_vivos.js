/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧟 BICHOS VIVOS MESMO PARADOS (v308): o dono viu as múmias da Pirâmide "estáticas". Os bichos com
   quadros de corrida (corrida.js) só mexiam andando; parados — esperando ou colados em você brigando —
   ficavam congelados num quadro só.
   - MÚMIA parada: balança de um lado para o outro (o andar arrastado de múmia) e respira;
     brigando colada em você: arrasta os pés no lugar (os quadros de caminhada, devagar).
   - Os outros bichos com quadros de corrida, parados: respiração leve (nada fica congelado).
   Carregar DEPOIS de corrida.js.
   ============================================================ */
{
  // v313: pedaços soltos de arte vizinha apagados (o dono viu um pedaço sobrando do lado da Aranha Goleira)
  if (typeof ASSET_VER !== 'undefined') for (const n of ['bicho_aranha', 'bicho_dragao', 'bicho_escorpiao', 'bicho_gargula', 'bicho_polvo', 'bicho_rato2', 'et_cristal', 'pombo2']) ASSET_VER[n] = 313;
  const ARRASTA = new Set(['bicho_mumia']); // brigando parado: passos no lugar
  const _quadroVivo = quadroBicho;
  quadroBicho = function (e, nome, look) {
    const r = _quadroVivo.apply(this, arguments);
    try {
      if (!e.mov && e.bravo && ARRASTA.has(nome)) { const q = Math.floor(G.agora / 280 + (e.uid || 0)) % 4, s = nome + '_c' + (q + 1); if (spr(s).ok) return s; }
    } catch (err) { }
    return r;
  };
  const _deformaVivo = deformaBicho;
  deformaBicho = function (e, nome) {
    const r = _deformaVivo.apply(this, arguments); if (r || e.mov) return r;
    if (typeof CORRE_ESC === 'undefined' || !(nome in CORRE_ESC)) return r;
    const t = G.agora / 420 + (e.uid || 0) * 1.7, o = Math.sin(t);
    if (nome === 'bicho_mumia') return { rot: Math.sin(t * 0.7) * 0.07, sx: 1 - o * 0.015, sy: 1 + o * 0.025, dy: Math.max(0, Math.sin(t * 1.4)) * 1.2 };
    return { sx: 1 - o * 0.012, sy: 1 + o * 0.02 };
  };
}
