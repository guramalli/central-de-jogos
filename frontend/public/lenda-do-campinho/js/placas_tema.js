/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🪧 PLACAS COM A CARA DO LUGAR (v407, Raio-X): a placa de madeira com grama aparecia na Lua, em Marte, em Atlântida e
   no Multiverso. Agora cada região tem a sua (arte Higgsfield, a/placa_<tema>_v407.webp):
     metal espacial (Lua, Estação) · pedra (Marte, Pedraforte, Jurássico, vulcões) · neon (Saturno, Nebulosa, Copa Intergaláctica)
     · coral (Atlântida, Recife) · cristal (Multiverso, Vale Celeste, Torre) · gelo (Picos Nublados, cavernas de gelo).
   Enquanto a placa nova não carregou, fica a de madeira (nada some). Prefixo: plt. Carregar DEPOIS de game.js e assets.js.
   ============================================================ */
const PLT_MAPA = {
  estacao: 'metal', lua: 'metal', caca_et_coelho: 'metal', caca_et_rocha: 'metal', caca_et_selenita: 'metal',
  marte: 'pedra', caca_et_marciano: 'pedra', caca_et_robo: 'pedra', caca_et_rover: 'pedra', pedraforte: 'pedra', jur_acampamento: 'pedra', jur_labirinto: 'pedra', jur_trex: 'pedra',
  caca_mv_minas: 'pedra', caca_mv_grutas: 'pedra', caca_mv_lava: 'pedra', caca_mv_trono: 'pedra', caca_cratera: 'pedra', caca_vulcao: 'pedra', caca_covil: 'pedra',
  saturno: 'neon', nebulosa: 'neon', copa_intergalactica: 'neon', arena_neon: 'neon', caca_et_anel: 'neon', caca_et_cristal: 'neon', caca_et_medusa: 'neon', caca_et_nuvem: 'neon', caca_et_cometa: 'neon', caca_et_cavaleiro: 'neon',
  atlantida: 'coral', caca_recife: 'coral', arena_ondas: 'coral',
  multiverso: 'cristal', vale_celeste: 'cristal', torre_infinita: 'cristal', arena_ecos: 'cristal', caca_cristal: 'cristal', caca_morcegos: 'cristal', caca_mv_nuvens: 'cristal', caca_mv_pico: 'cristal',
  picos_nublados: 'gelo', caca_gelo: 'gelo', caca_yeti: 'gelo', arena_nevasca: 'gelo',
};
function temaPlaca(m) {
  if (!m || !m.id) return null;
  if (PLT_MAPA[m.id]) return PLT_MAPA[m.id];
  if (/^vale_z/.test(m.id)) return 'cristal';
  return null;
}
{
  const _aSpritePlt = aSprite;
  aSprite = function (nome) {
    if (nome === 'placa' && typeof G !== 'undefined' && G.mapa) {
      const t = temaPlaca(G.mapa);
      if (t) { const im = _aSpritePlt('placa_' + t + '_v407'); if (im) return im; }
    }
    return _aSpritePlt.apply(this, arguments);
  };
}
