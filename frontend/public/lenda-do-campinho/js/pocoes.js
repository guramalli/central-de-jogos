/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧃 GARRAFAS DE FÔLEGO E ISOTÔNICOS DE FOCO (v196), como as poções do Tibia:
   o MESMO item em tamanhos maiores conforme o nível (antes: água, açaí,
   vitamina, energético... cada um com um nome). Os ids, valores, níveis e
   preços continuam os mesmos (saves e lojas seguem funcionando); mudam o
   nome, a descrição e o desenho (a mesma garrafa, maior e mais caprichada).
   Carregar DEPOIS de todos os arquivos que criam itens (cidades, atlântida, espaço).
   ============================================================ */
const TAMANHOS_F = ['Mini', '', 'Média', 'Grande', 'Forte', 'Suprema', 'Lendária'];
const TAMANHOS_M = ['Mini', '', 'Médio', 'Grande', 'Forte', 'Supremo', 'Lendário'];
const LINHAS_RECUP = [
  { base: 'Garrafa de Fôlego', tam: TAMANHOS_F, stat: 'hp', txt: 'fôlego', spr: 'pc_f', ids: ['agua', 'acai', 'vitamina', 'energetico', 'kit_massagista', 'elixir_mar', 'soro_estelar'] },
  { base: 'Isotônico de Foco', tam: TAMANHOS_M, stat: 'foco', txt: 'foco', spr: 'pc_c', ids: ['isotonico', 'suco_verde', 'agua_coco', 'guarana', 'isotonico_pro', 'perola_azul', 'cristal_foco'] },
];
for (const L of LINHAS_RECUP) L.ids.forEach((id, k) => {
  const it = ITENS[id]; if (!it) return;
  const v = it.efeito && it.efeito[L.stat];
  it.nome = L.tam[k] ? `${L.base} ${L.tam[k]}` : L.base;
  it.desc = `Recupera ${fmt(v || 0)} de ${L.txt}. Tamanho ${k + 1} de 7: quanto maior, mais recupera.`;
  const spr = L.spr + (k + 1);
  if (typeof ASSET_SET !== 'undefined' && !ASSET_SET.has(spr)) { ASSETS.push(spr); ASSET_SET.add(spr); }
  if (typeof ICON_ALIAS !== 'undefined') ICON_ALIAS[id] = spr;
});
