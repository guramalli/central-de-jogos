/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* 😈 v353 (dono: "os monstros da Atlântida para frente estão muito 'felizes'"): pose parada refeita com cara de VILÃO
   de desenho (sobrancelha brava, sorriso maldoso) — mesma criatura, mesmas cores, sem sustos. As Pedras Celestiais
   ficaram como estavam (pedra é pedra). Só troca o ?v= para o navegador não usar a arte antiga guardada. Carregar DEPOIS de bichos_vivos.js. */
if (typeof ASSET_VER !== 'undefined') for (const n of ['bicho_aranha','bicho_dragao','bicho_dragao_anciao','bicho_escorpiao','bicho_fantasma','bicho_gargula','bicho_jacare','bicho_minhocao','bicho_morcego','bicho_mumia','bicho_polvo','bicho_rato2','bicho_tanuki','bicho_toupeira','bicho_touro','bicho_yeti','ch_capitao_lunar','ch_general_marciano','ch_imperador_nebular','ch_rainha_aneis','ch_supremo','et_anel','et_cavaleiro','et_coelho','et_cometa','et_cristal','et_marciano','et_medusa','et_nuvem','et_robo','et_rocha','et_rover','et_selenita','mv_aguia_trovao','mv_anao_ferreira','mv_anao_mineiro','mv_besouro_bigorna','mv_carneiro_nuvem','mv_chefe_golem_rei','mv_chefe_tita','mv_ciclope','mv_cogumelo','mv_gigante_gelo','mv_gigante_lenhador','mv_golem_brasa','mv_morcego_lampiao','mv_troll_ponte']) ASSET_VER[n] = 353;
// quadros de corrida (a/<nome>_c1..c4) também refeitos com a mesma cara de vilão; escala nova de cada quadro
if (typeof CORRE_ESC !== 'undefined') Object.assign(CORRE_ESC, { bicho_aranha: 1.006, bicho_dragao: 1.013, bicho_dragao_anciao: 1.005, bicho_escorpiao: 1.004, bicho_gargula: 1.012, bicho_jacare: 1.008, bicho_morcego: 1.201, bicho_mumia: 1.009, bicho_polvo: 1.006, bicho_rato2: 1.005, bicho_tanuki: 1.002, bicho_toupeira: 1.009, bicho_touro: 1.019, bicho_yeti: 1.002, ch_capitao_lunar: 1.002, ch_general_marciano: 1.002, ch_imperador_nebular: 1.016, ch_rainha_aneis: 1.006, ch_supremo: 1.014, et_cavaleiro: 1.0, et_coelho: 1.101, et_cristal: 1.012, et_marciano: 1.013, et_medusa: 1.093, et_rocha: 1.009, et_rover: 1.0, et_selenita: 1.003, mv_aguia_trovao: 1.201, mv_anao_ferreira: 1.003, mv_anao_mineiro: 1.005, mv_besouro_bigorna: 1.001, mv_carneiro_nuvem: 1.002, mv_chefe_golem_rei: 1.005, mv_chefe_tita: 1.01, mv_ciclope: 1.0, mv_cogumelo: 1.176, mv_gigante_gelo: 1.001, mv_gigante_lenhador: 1.005, mv_golem_brasa: 1.026, mv_morcego_lampiao: 1.207, mv_troll_ponte: 1.004 });
if (typeof ASSET_VER !== 'undefined') for (const n of ['bicho_aranha', 'bicho_dragao', 'bicho_dragao_anciao', 'bicho_escorpiao', 'bicho_gargula', 'bicho_jacare', 'bicho_morcego', 'bicho_mumia', 'bicho_polvo', 'bicho_rato2', 'bicho_tanuki', 'bicho_toupeira', 'bicho_touro', 'bicho_yeti', 'ch_capitao_lunar', 'ch_general_marciano', 'ch_imperador_nebular', 'ch_rainha_aneis', 'ch_supremo', 'et_cavaleiro', 'et_coelho', 'et_cristal', 'et_marciano', 'et_medusa', 'et_rocha', 'et_rover', 'et_selenita', 'mv_aguia_trovao', 'mv_anao_ferreira', 'mv_anao_mineiro', 'mv_besouro_bigorna', 'mv_carneiro_nuvem', 'mv_chefe_golem_rei', 'mv_chefe_tita', 'mv_ciclope', 'mv_cogumelo', 'mv_gigante_gelo', 'mv_gigante_lenhador', 'mv_golem_brasa', 'mv_morcego_lampiao', 'mv_troll_ponte']) for (let i = 1; i <= 4; i++) ASSET_VER[n + '_c' + i] = 353;
// v359 (dono: "o texto ficou em cima do boneco" — Morcego Lampião): a plaquinha do nome usa a altura do bicho, mas
// quem VOA é desenhado meio quadradinho acima do chão e o quadro de corrida pode ser maior que o desenho parado
{
  const _altMal = alturaEnt;
  alturaEnt = function (e) {
    const h = _altMal.apply(this, arguments);
    try {
      const l = e && e !== G.p && e.d && e.d.look; if (!l || l.tipo === 'humano') return h;
      const esc = typeof CORRE_ESC !== 'undefined' && l.spr && CORRE_ESC[l.spr] > 1 ? CORRE_ESC[l.spr] : 1;
      return h * esc + (l.voa || l.tipo === 'gaivota' ? 0.5 : 0);
    } catch (err) { return h; }
  };
}
