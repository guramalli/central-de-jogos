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
const TAMANHOS_F = ['Mini', '', 'Medium', 'Big', 'Strong', 'Supreme', 'Legendary'];
const TAMANHOS_M = ['Mini', '', 'Medium', 'Big', 'Strong', 'Supreme', 'Legendary'];
const LINHAS_RECUP = [
  { base: 'Stamina Bottle', tam: TAMANHOS_F, stat: 'hp', txt: 'stamina', spr: 'pc_f', ids: ['agua', 'acai', 'vitamina', 'energetico', 'kit_massagista', 'elixir_mar', 'soro_estelar'] },
  { base: 'Focus Drink', tam: TAMANHOS_M, stat: 'foco', txt: 'foco', spr: 'pc_c', ids: ['isotonico', 'suco_verde', 'agua_coco', 'guarana', 'isotonico_pro', 'perola_azul', 'cristal_foco'] },
];
for (const L of LINHAS_RECUP) L.ids.forEach((id, k) => {
  const it = ITENS[id]; if (!it) return;
  const v = it.efeito && it.efeito[L.stat];
  it.nome = L.tam[k] ? `${L.base} ${L.tam[k]}` : L.base;
  it.desc = `Restores ${fmt(v || 0)} ${L.txt}. Size ${k + 1} of 7: the bigger it is, the more it restores.`;
  const spr = L.spr + (k + 1);
  if (typeof ASSET_SET !== 'undefined' && !ASSET_SET.has(spr)) { ASSETS.push(spr); ASSET_SET.add(spr); }
  if (typeof ICON_ALIAS !== 'undefined') ICON_ALIAS[id] = spr;
});
// v213: como no Tibia ("Using one of 263 mana potions..."): ao usar uma garrafa ou isotônico, uma linha
// logo abaixo do boneco mostra quantos você tinha. Some sozinha; não vai para o chat (não enche).
{
  LINHAS_RECUP[0].plural = 'Stamina Bottles'; LINHAS_RECUP[0].fem = true;
  LINHAS_RECUP[1].plural = 'Focus Drinks'; LINHAS_RECUP[1].fem = false;
  const linhaDe = id => LINHAS_RECUP.find(L => L.ids.includes(id));
  const plTam = t => (!t || t === 'Mini') ? t : t + 's'; // Média→Médias, Grande→Grandes, Supremo→Supremos
  function textoUso(id, n) {
    const L = linhaDe(id), k = L.ids.indexOf(id), tam = L.tam[k];
    if (n <= 1) return `Using ${L.fem ? 'the last' : 'the last'} ${ITENS[id].nome}.`;
    return `Using 1 ${L.fem ? 'das' : 'dos'} ${fmt(n)} ${L.plural}${tam ? ' ' + plTam(tam) : ''}...`;
  }
  // v215: o aviso aparece em letras pequenas logo abaixo do boneco (desenhado em arcos.js), como no Tibia
  const statusTela = txt => { G.msgUso = { txt, t0: performance.now() }; };
  const _usarItemPoc = usarItem;
  usarItem = function (id) {
    const L = G.save && linhaDe(id); const antes = L ? contaItem(id) : 0;
    const r = _usarItemPoc.apply(this, arguments);
    if (L && contaItem(id) < antes) statusTela(textoUso(id, antes));
    return r;
  };
}

