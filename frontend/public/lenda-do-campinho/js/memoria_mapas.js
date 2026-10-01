/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧹 MEMÓRIA DOS MAPAS (v319, otimização pedida pelo dono: "diminuir travamentos e lags").
   O chão de cada mapa é pintado uma vez numa imagem do tamanho do mapa inteiro — numa cidade grande
   são 6400×4736 pixels = 116 MB. Essa imagem ficava guardada para SEMPRE: depois de passear por
   5 cidades o jogo já segurava mais de meio giga só de chão, e ia ficando pesado (no celular, fechava).
   Agora ficam guardados só o mapa atual e o anterior (no celular: só o atual). Voltando a um mapa
   antigo, o chão é pintado de novo (uma vez, como na primeira visita).
   Carregar NO FIM.
   ============================================================ */
{
  const GUARDA = (navigator.deviceMemory || 4) >= 8 ? 2 : 1;
  const ordem = []; // mapas (objetos), do mais recente para o mais antigo
  function solta(m) { if (!m) return; delete m._chao; delete m._chaoV; delete m._miniHD16; }
  const _entraMem = entrarMapa;
  entrarMapa = function () {
    const r = _entraMem.apply(this, arguments);
    try {
      const m = G.mapa; const i = ordem.indexOf(m); if (i >= 0) ordem.splice(i, 1); ordem.unshift(m);
      while (ordem.length > GUARDA) { const velho = ordem.pop(); if (velho !== G.mapa) solta(velho); }
    } catch (e) { }
    return r;
  };
  window.MEM_MAPAS = { ordem, GUARDA }; // (para os testes)
}
