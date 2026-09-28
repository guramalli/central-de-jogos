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
// v213: como no Tibia ("Using one of 263 mana potions..."): ao usar uma garrafa ou isotônico, uma linha branca
// no pé da tela mostra quantos você tinha. Some sozinha; não vai para o chat (não enche).
{
  LINHAS_RECUP[0].plural = 'Garrafas de Fôlego'; LINHAS_RECUP[0].fem = true;
  LINHAS_RECUP[1].plural = 'Isotônicos de Foco'; LINHAS_RECUP[1].fem = false;
  const linhaDe = id => LINHAS_RECUP.find(L => L.ids.includes(id));
  const plTam = t => (!t || t === 'Mini') ? t : t + 's'; // Média→Médias, Grande→Grandes, Supremo→Supremos
  function textoUso(id, n) {
    const L = linhaDe(id), k = L.ids.indexOf(id), tam = L.tam[k];
    if (n <= 1) return `Usando ${L.fem ? 'a última' : 'o último'} ${ITENS[id].nome}.`;
    return `Usando 1 ${L.fem ? 'das' : 'dos'} ${fmt(n)} ${L.plural}${tam ? ' ' + plTam(tam) : ''}...`;
  }
  let timer = 0;
  function statusTela(txt) {
    const tela = document.getElementById('tela'); if (!tela) return;
    let e = document.getElementById('statusTela');
    if (!e) { e = el('div', { id: 'statusTela', 'aria-live': 'polite' }); tela.append(e); }
    e.textContent = txt; e.classList.add('on'); clearTimeout(timer); timer = setTimeout(() => e.classList.remove('on'), 2500);
  }
  const _usarItemPoc = usarItem;
  usarItem = function (id) {
    const L = G.save && linhaDe(id); const antes = L ? contaItem(id) : 0;
    const r = _usarItemPoc.apply(this, arguments);
    if (L && contaItem(id) < antes) statusTela(textoUso(id, antes));
    return r;
  };
  const st = document.createElement('style');
  st.textContent = `#statusTela { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); z-index: 4; pointer-events: none; max-width: 90%; text-align: center;
    color: #fff; font: 700 14px/1.2 Nunito, sans-serif; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000; opacity: 0; transition: opacity .35s; }
  #statusTela.on { opacity: 1; transition: none; }`;
  document.head.append(st);
}
