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
/* v407 (Raio-X A8): UMA regra só para a memória dos chãos (antes esta guardava 1–2 e o chao_novo.js guardava 3 + o
   pré-desenhado — brigavam; medido: 4–5 chãos guardados, 333 MB, o jogo em 1,5 GB). Agora o chão é uma "lousa" que só
   anota os passos do desenho (chao_blocos.js) e a imagem é pintada em blocos perto da câmera, com um teto único de memória.
   Aqui ficam as lousas do mapa atual, dos 2 anteriores e do vizinho pré-desenhado (MEM_MAPAS.pre, avisado pelo
   chao_novo.js); as outras são soltas (lousa, prévia e blocos). */
{
  const GUARDA = (navigator.deviceMemory || 4) >= 4 ? 3 : 2; // o mapa atual + os anteriores (só as lousas: leves)
  const ordem = []; // mapas (objetos), do mais recente para o mais antigo
  function solta(m) {
    if (!m) return;
    for (const k of ['_chao', '_chaoV', '_chaoVelho', '_chaoTemp']) { const c = m[k]; if (c && typeof c.solta === 'function') try { c.solta(); } catch (e) { } }
    delete m._chao; delete m._chaoV; delete m._miniHD16; m._chaoVelho = null; m._chaoTemp = null; m._chao2 = false;
  }
  const _entraMem = entrarMapa;
  entrarMapa = function () {
    const r = _entraMem.apply(this, arguments);
    try {
      const m = G.mapa; const i = ordem.indexOf(m); if (i >= 0) ordem.splice(i, 1); ordem.unshift(m);
      ordem.length = Math.min(ordem.length, GUARDA);
      const fica = new Set(ordem); if (MEM_MAPAS.pre) fica.add(MEM_MAPAS.pre);
      const fazendo = window.CHAO2_FAZENDO;
      for (const mm of Object.values(typeof MAPAS !== 'undefined' ? MAPAS : {})) {
        if (!mm || fica.has(mm) || (fazendo && fazendo.has(mm))) continue;
        if (mm._chao || mm._chaoV || mm._chaoVelho || mm._miniHD16) solta(mm);
      }
    } catch (e) { }
    return r;
  };
  window.MEM_MAPAS = { ordem, GUARDA, pre: null, solta }; // (pre: o vizinho pré-desenhado, avisado pelo chao_novo.js)
}
