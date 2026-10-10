// Jocelino — receitas.js — as receitas a descobrir no caderno da Rosa (a "Research" do Bancho no Dave the Diver):
// aparecem em silhueta com a dica do ingrediente principal; depois que o ingrediente passa pela mão do Jocelino, dá para
// pesquisar gastando pitadas de tempero (ganhas pelas estrelas da noite). Os pratos de partida estão em pratos.js
// (gerado do Godot); estes se juntam a eles. icone: a arte do prato (a/itens/...).

const RECEITAS_NOVAS = {
  rabanada: { nome: 'Rabanada da Vó', preco: 10, fase: 1, principal: 'ovo', porcao: { ovo: 2, farinha: 1 }, reacao: 'coracao', pitadas: 2,
    icone: 'itens/rabanada', desc: 'Doce de domingo que a Rosa faz em qualquer dia da semana.' },
  marmita_peao: { nome: 'Marmita do Peão', preco: 18, fase: 2, principal: 'linguica', porcao: { arroz: 1, feijao: 1, linguica: 1 }, reacao: 'coracao', pitadas: 3,
    icone: 'itens/marmita', desc: 'Linguiça frita por cima do arroz e feijão. O Bira come duas.' },
  pamonha: { nome: 'Pamonha Quentinha', preco: 14, fase: 2, principal: 'milho', porcao: { milho: 2 }, reacao: 'coracao', pitadas: 3,
    icone: 'itens/pamonha', desc: 'Pamonha, pamonha, pamonha! Feita na palha, do jeitinho de Aracaju.' },
  goiabada: { nome: 'Goiabada Cascão', preco: 12, fase: 2, principal: 'goiaba', porcao: { goiaba: 3 }, reacao: 'coracao', pitadas: 3,
    icone: 'itens/goiabada', desc: 'Mexida no tacho até a colher ficar em pé.' },
  bolo_milho: { nome: 'Bolo de Milho', preco: 13, fase: 2, principal: 'milho', porcao: { milho: 1, ovo: 1, farinha: 1 }, reacao: 'coracao', pitadas: 4,
    icone: 'itens/bolo', desc: 'Com cafezinho, vira o melhor fim de janta da Vila.' },
  caldo_caranguejo: { nome: 'Caldinho de Caranguejo', preco: 24, fase: 3, principal: 'caranguejo', porcao: { caranguejo: 2, farinha: 1 }, reacao: 'suor', pitadas: 6,
    icone: 'itens/caldo_caranguejo', desc: 'Caranguejo da praia à noite, com pirão. Quem prova volta.' },
  moqueca: { nome: 'Moqueca da Rosa', preco: 32, fase: 3, principal: 'pescada', porcao: { pescada: 1, leite_coco: 1, dende: 1 }, reacao: 'coracao', pitadas: 8,
    icone: 'itens/moqueca', desc: 'O orgulho de Sergipe numa panela de barro. A Vila para para cheirar.' },
};
for (const id in RECEITAS_NOVAS) Pratos.PRATOS[id] = Object.assign({ montar: Object.keys(RECEITAS_NOVAS[id].porcao) }, RECEITAS_NOVAS[id]);
// Nomes dos ingredientes que o banco de itens ainda não tinha.
if (typeof ITENS !== 'undefined') for (const [id, nome] of Object.entries({ linguica: 'Linguiça', carne_seca: 'Carne-seca', macarrao: 'Macarrão', dende: 'Azeite de dendê',
  leite_coco: 'Leite de coco', queijo_coalho: 'Queijo coalho', pimenta_cheiro: 'Pimenta-de-cheiro' })) if (!ITENS[id]) ITENS[id] = { nome, tipo: 'ingrediente' };
// A arte de cada prato: a dos pratos de partida é itens/prato_<id>; as novas têm a própria.
function iconePrato(id) { const p = Pratos.PRATOS[id]; return (p && p.icone) || 'itens/prato_' + id; }
// A arte grande do prato (a/pratos/, 128 px) para o palco e o caderno; o ícone de 48 px fica para o inventário.
const _PRATOS_GRANDES = new Set(ARTE_LISTA.filter(n => n.startsWith('pratos/')));
function iconePratoGrande(id) { const n = 'pratos/' + iconePrato(id).split('/').pop(); return _PRATOS_GRANDES.has(n) ? n : iconePrato(id); }
// Desenha o prato com o pé em (x, y); `escala` como a do ícone de 48 px (a arte grande é reduzida na mesma medida).
function desenhaPrato(ctx, id, x, y, alfa = 1, escala = 1) { const g = iconePratoGrande(id); desenhaPe(ctx, g, x, y, alfa, g.startsWith('pratos/') ? escala * 48 / 128 : escala); }
