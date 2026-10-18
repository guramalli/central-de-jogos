// Jocelino — receitas.js — as receitas a descobrir no caderno da Rosa (a "Research" do Bancho no Dave the Diver):
// aparecem em silhueta com a dica do ingrediente principal; depois que o ingrediente passa pela mão do Jocelino, dá para
// pesquisar gastando pitadas de tempero (ganhas pelas estrelas da noite). Os pratos de partida estão em pratos.js
// (gerado do Godot); estes se juntam a eles. icone: a arte do prato (a/itens/...).

// Os 7 caminhos de uma receita entrar no caderno (como no Dave, onde receita vem da pesquisa, do chef, dos funcionários,
// dos VIPs e dos eventos): 'ingrediente' (pesquisa com pitadas depois que o ingrediente principal passa pela mão do
// Jocelino), 'degrau' (a Rosa aprende quando a pensão sobe), 'chef' (ela inventa nos níveis 3, 6 e 9), 'ajudante' (o
// ajudante de cozinha ensina nos níveis 5 e 10), 'vip' (o cliente especial ensina a receita com o nome dele), 'festa'
// (aprendida na festa da Vila) e 'viajante' (comprada do Viajante da Capital, às quintas). (T9 das conversas e histórias) O 8º
// caminho, 'amizade': a RECEITA COM NOME, que uma pessoa ensina numa cena do arco dela (historias/<pessoa>.js, o fim.receita; a
// seção 6.3 da spec das conversas): o Bolo de Macaxeira da Vó Ia (a Rosa, R1), o Caldo Verde da Dona Zélia e o Azul-Marinho do
// Lourival (os arcos deles). Não se pesquisa; o caderno mostra a silhueta com a `dica` (Pensao.comoLiberar), sem prazo.
// raridade 1 ★ mercearia e horta, 2 ★★ praia e rio, 3 ★★★ alto-mar e raros, 4 ★★★★ VIP e Capital.
const _rec = (nome, preco, raridade, caminho, porcao, icone, desc, extra = {}) => Object.assign({ nome, preco, fase: raridade, raridade, caminho,
  principal: Object.keys(porcao)[0], porcao, reacao: 'coracao', pitadas: [0, 2, 4, 7, 10][raridade], icone, desc }, extra);
// (15/10, aprovado pelo dono; o crivo do Stardew e do Dave: o prato vale mais do que os ingredientes crus vendidos) No nível 1, a
// panela servida (preço × porções, sem gorjeta) rende pelo menos ~1,3 × o que a caixa de venda pagaria pelos ingredientes dela (o que
// a caixa não compra conta pelo preço da Mercearia ou da encomenda). Subiram só os que ficavam abaixo: salada 8 → 13, couve à
// mineira 7 → 8, mandioca frita 9 → 11, sopa de legumes 10 → 12, purê de abóbora 11 → 14, canjica 12 → 13, escondidinho 22 → 25
// (e a panela rende mais: a mandioca frita 8 porções, a sopa e o purê 6; ECO.porcoes). A s1 confere a regra em todas as receitas.
// (16/10, decisão do dono: o gasto por prato e o "prato valioso pede ingrediente difícil") A panela agora gasta porção × porções × 0,5
// (Pensao.gasto), então a regra de cima ficou pesada para a horta, e o preço passou a seguir a dificuldade do ingrediente: o básico
// da Mercearia dá o prato barato (até Cr$ 14); a horta rápida (alface 4 dias, couve 5), a coleta e o peixe comum, o do meio; a horta de
// 8 a 9 dias (tomate, milho) e o ★★ pedem Cr$ 16 ou mais; Cr$ 25 ou mais pede a horta demorada (abóbora 12, mandioca 14) ou o ★★★
// (peixe de fundo, camarão, dendê); o ★★★★ (lagosta, polvo), Cr$ 45 ou mais. A s1 confere (prato_caro_pede_ingrediente_dificil).
// Mudou: salada 13 → 19 (1 alface), couve à mineira 8 → 9 (1 couve), mandioca frita 11 → 23 (1 mandioca), sopa de legumes 12 → 18
// (macarrão no lugar da mandioca), mingau 9 → 13, purê 14 → 22 (1 abóbora), virado 16 → 14, cuscuz 15 → 18, canjica 13 → 14 (1
// milho), marmita do peão 18 → 14 (só Mercearia), pamonha com 1 milho (o preço fica 14), goiabada com 2 goiabas, bolo de milho 13 → 14,
// casquinha de siri 26 → 24, escondidinho 25 → 32 (1 mandioca), caldo de peixe com farinha no lugar da mandioca (o preço fica 18),
// doce de leite do Calixto 30 → 33 com abóbora (rodada 1; o coco é ★, fácil demais para um prato de Cr$ 30) e o picadinho do Seu Moreira com mandioca no lugar do feijão (a sopa de pedra, em
// pratos.js, leva feijão no lugar da mandioca). A tabela inteira: .superpowers/sdd/2026-10-16-despensa-report.md.
const RECEITAS_NOVAS = {
  // ★ — da mercearia e da horta
  rabanada: _rec('Rabanada da Vó', 10, 1, 'ingrediente', { ovo: 2, farinha: 1 }, 'itens/rabanada', 'Doce de domingo que a Rosa faz em qualquer dia da semana.'),
  arroz_doce: _rec('Arroz-Doce da Rosa', 9, 1, 'ingrediente', { leite: 1, arroz: 1, acucar: 1 }, 'itens/prato_arroz_doce', 'Com canela por cima, do jeito que a Ritinha gosta.'),
  salada_rosa: _rec('Salada da Rosa', 19, 1, 'ingrediente', { alface: 1, tomate: 1 }, 'itens/prato_salada_rosa', 'Fresquinha da horta do quintal. O Zé jura que é remédio.'),
  farofa_ovo: _rec('Farofa de Ovo', 8, 1, 'ingrediente', { farinha: 1, ovo: 1 }, 'itens/prato_farofa_ovo', 'Acompanha tudo e não briga com ninguém.', { pitadas: 1 }),
  couve_mineira: _rec('Couve à Mineira', 9, 1, 'ingrediente', { couve: 1, farinha: 1 }, 'itens/prato_couve_mineira', 'Fininha, no alho. O Bira come de garfo e colher.'),
  mandioca_frita: _rec('Mandioca Frita', 23, 1, 'ingrediente', { mandioca: 1 }, 'itens/prato_mandioca_frita', 'Casquinha crocante por fora, macia por dentro.'),
  sopa_legumes: _rec('Sopa de Legumes', 18, 1, 'ingrediente', { tomate: 1, couve: 1, macarrao: 1 }, 'itens/prato_sopa_legumes', 'Para as noites de garoa em Praia Grande.'),
  mingau_milho: _rec('Mingau de Milho', 13, 1, 'ingrediente', { milho: 1, leite: 1 }, 'itens/prato_mingau_milho', 'Quentinho, com cravo. Lembra Aracaju.'),
  pure_abobora: _rec('Purê de Abóbora', 22, 1, 'ingrediente', { abobora: 1, leite: 1 }, 'itens/prato_pure_abobora', 'Laranjinha e cremoso. Até o Zezinho come.'),
  virado: _rec('Virado à Paulista', 14, 1, 'degrau', { arroz: 1, feijao: 1, couve: 1, ovo: 1 }, 'itens/prato_virado', 'O prato de segunda-feira de São Paulo inteiro.', { grau: 2 }),
  cuscuz: _rec('Cuscuz Paulista', 18, 1, 'chef', { farinha: 2, sardinha: 1, tomate: 1 }, 'itens/prato_cuscuz', 'A Rosa inventou de juntar o cuscuz de lá com a sardinha daqui.'),
  bolinho_chuva: _rec('Bolinho de Chuva', 9, 1, 'ajudante', { farinha: 1, ovo: 1, acucar: 1 }, 'itens/prato_bolinho_chuva', 'Com açúcar e canela. Some do prato antes de esfriar.'),
  canjica: _rec('Canjica de Junho', 14, 1, 'festa', { milho: 1, leite: 1, acucar: 1 }, 'itens/prato_canjica', 'Aprendida no Arraiá: canjica branca com amendoim e cravo.'),
  // ★★ — da praia e do rio
  marmita_peao: _rec('Marmita do Peão', 14, 2, 'ingrediente', { linguica: 1, arroz: 1, feijao: 1 }, 'itens/marmita', 'Linguiça frita por cima do arroz e feijão. O Bira come duas.', { pitadas: 3 }),
  pamonha: _rec('Pamonha Quentinha', 14, 2, 'ingrediente', { milho: 1 }, 'itens/pamonha', 'Pamonha, pamonha, pamonha! Feita na palha, do jeitinho de Aracaju.', { pitadas: 3 }),
  goiabada: _rec('Goiabada Cascão', 12, 2, 'ingrediente', { goiaba: 2 }, 'itens/goiabada', 'Mexida no tacho até a colher ficar em pé.', { pitadas: 3 }),
  bolo_milho: _rec('Bolo de Milho', 14, 2, 'ingrediente', { milho: 1, ovo: 1, farinha: 1 }, 'itens/bolo', 'Com cafezinho, vira o melhor fim de janta da Vila.'),
  sardinha_frita: _rec('Sardinha Frita na Brasa', 13, 2, 'ingrediente', { sardinha: 2, farinha: 1 }, 'itens/prato_sardinha_frita', 'Do mar para a frigideira em uma hora.', { pitadas: 2 }),
  lambari_crocante: _rec('Lambari Crocante', 14, 2, 'ingrediente', { lambari: 3, farinha: 1 }, 'itens/prato_lambari_crocante', 'Come com espinha e tudo, que nem pipoca.', { pitadas: 3 }),
  peixe_ensopado: _rec('Peixe Ensopado', 20, 2, 'ingrediente', { tainha: 1, tomate: 1, leite_coco: 1 }, 'itens/prato_peixe_ensopado', 'Tainha de inverno, no molho, com arroz branquinho.', { pitadas: 5 }),
  casquinha_siri: _rec('Casquinha de Siri', 24, 2, 'ingrediente', { siri: 2, farinha: 1, leite_coco: 1 }, 'itens/prato_casquinha_siri', 'Servida na própria casca, gratinada com farinha.', { pitadas: 6 }),
  caldo_caranguejo: _rec('Caldinho de Caranguejo', 24, 2, 'ingrediente', { caranguejo: 2, farinha: 1 }, 'itens/caldo_caranguejo', 'Caranguejo da praia à noite, com pirão. Quem prova volta.', { reacao: 'suor', pitadas: 6 }),
  escondidinho: _rec('Escondidinho de Peixe', 32, 2, 'degrau', { pescada: 1, mandioca: 1, queijo_coalho: 1 }, 'itens/prato_escondidinho', 'O peixe se esconde debaixo do purê de mandioca e do queijo.', { grau: 3 }),
  caldo_peixe: _rec('Caldo de Peixe', 18, 2, 'chef', { pescada: 1, tomate: 1, farinha: 1 }, 'itens/prato_caldo_peixe', 'A Rosa inventou numa noite fria. Levanta defunto.'),
  pirao: _rec('Pirão de Peixe', 12, 2, 'ajudante', { peixe: 1, farinha: 2 }, 'itens/prato_pirao', 'O segredo é o caldo da cabeça do peixe, ensinou o ajudante.'),
  // ★★★ — do alto-mar e dos raros
  moqueca: _rec('Moqueca da Rosa', 32, 3, 'ingrediente', { pescada: 1, leite_coco: 1, dende: 1 }, 'itens/moqueca', 'O orgulho de Sergipe numa panela de barro. A Vila para para cheirar.', { pitadas: 8 }),
  moqueca_capixaba: _rec('Moqueca Capixaba', 34, 3, 'ingrediente', { robalo: 1, tomate: 1, coco: 1 }, 'itens/prato_moqueca_capixaba', 'Sem dendê, na panela de barro preta. Briga boa com a baiana.', { pitadas: 8 }),
  lagosta_manteiga: _rec('Lagosta na Manteiga', 60, 3, 'ingrediente', { lagosta: 1, leite: 1 }, 'itens/prato_lagosta_manteiga', 'Prato de rico na pensão de pobre. A Vila inteira vem ver.', { pitadas: 12 }),
  bobo_camarao: _rec('Bobó de Camarão', 40, 3, 'ingrediente', { camarao: 2, mandioca: 1, dende: 1 }, 'itens/prato_bobo_camarao', 'Creme de mandioca com camarão e dendê. Cheiro de Bahia.', { pitadas: 9 }),
  peixada: _rec('Peixada Cearense', 30, 3, 'ingrediente', { traira: 1, tomate: 1, ovo: 1 }, 'itens/prato_peixada', 'Com ovo cozido e pirão do caldo. Receita de um peão do Ceará.', { pitadas: 8 }),
  robalo_assado: _rec('Robalo Assado', 36, 3, 'degrau', { robalo: 1, mandioca: 1 }, 'itens/prato_robalo_assado', 'Inteiro, no forno, com mandioca e alecrim.', { grau: 4 }),
  caldeirada: _rec('Caldeirada do Porto', 45, 3, 'degrau', { pescada: 1, camarao: 1, polvo: 1 }, 'itens/prato_caldeirada', 'Tudo que o mar dá numa panela só.', { grau: 5 }),
  // ★★★★ — dos VIPs e da Capital
  moqueca_prefeito: _rec('Moqueca do Prefeito', 55, 4, 'vip', { robalo: 1, camarao: 1, dende: 1 }, 'itens/prato_moqueca_prefeito', 'O Seu Orlando ensinou a receita da família dele. Vem com bandeirinha.', { vip: 'orlando' }),
  caldeirada_critico: _rec('Caldeirada do Crítico', 70, 4, 'vip', { lagosta: 1, polvo: 1, tomate: 1 }, 'itens/prato_caldeirada_critico', 'O Seu Aurélio só escreveu bem depois que a Rosa acertou esta.', { vip: 'aurelio' }),
  doce_leite_calixto: _rec('Doce de Leite do Calixto', 33, 4, 'vip', { leite: 3, abobora: 1, acucar: 1 }, 'itens/prato_doce_leite_calixto', 'Do tacho da mãe do Calixto, lá de Aracaju: com abóbora, como o doce de lá.', { vip: 'calixto' }),
  picadinho_santos: _rec('Picadinho do Seu Moreira', 40, 4, 'vip', { carne_seca: 2, mandioca: 1, arroz: 1 }, 'itens/prato_picadinho_santos', 'O prato que o patrão come toda sexta. Com farofa e banana.', { vip: 'santos' }),
  // (T6 da mata) A receita do Nhô Quim, achada na loca atrás da Cachoeira Grande (serra_jogo.js): ★★★ como o pitu (a spec 5: os pratos
  // novos do sítio e da serra são raridade 2–3). O crivo da s1: o pitu é ★★★ (dificuldade 3), então Cr$ 25 ou mais e abaixo de 45; a
  // panela (36 × 0,7 × 1,8 = 45 por porção × 4 = 180) passa de 1,3 × os crus que ela gasta (4 pitus, 2 abóboras, 2 leites e 2 queijos
  // coalho = 130 na caixa e na Mercearia).
  pitu_moranga: _rec('Pitu na Moranga do Nhô Quim', 36, 3, 'vip', { pitu: 2, abobora: 1, leite: 1, queijo_coalho: 1 }, 'itens/prato_pitu_moranga', 'Pitu da serra cozido dentro da abóbora, com leite e queijo coalho. A receita da mãe do Nhô Quim, guardada numa lata na loca da cachoeira.', { vip: 'mateiro' }),
  arroz_polvo: _rec('Arroz de Polvo da Capital', 65, 4, 'viajante', { polvo: 1, arroz: 1, tomate: 1 }, 'itens/prato_arroz_polvo', 'Receita de restaurante chique da Capital, comprada do Viajante.'),
  vatapa: _rec('Vatapá da Rosa', 48, 4, 'chef', { camarao: 1, leite_coco: 1, dende: 1, farinha: 1 }, 'itens/prato_vatapa', 'A obra-prima da Rosa. Ela só inventou depois de muito fogão.'),
  // ♥ — as receitas com nome (o caminho 'amizade': a cena da pessoa ensina). O crivo da s1 vale: a macaxeira é a horta demorada (14
  // dias), então Cr$ 25 ou mais; a panela (26 × 1,05 = 27 × 4 = 108) passa de 1,3 × os crus que gasta (2 mandiocas, 2 cocos e 2 de
  // açúcar = 60). Tudo da fase 1 (a horta, a praia e a Mercearia): a Rosa faz o bolo logo que o caderno chega.
  bolo_macaxeira_via: _rec('Bolo de Macaxeira da Vó Ia', 26, 2, 'amizade', { mandioca: 1, coco: 1, acucar: 1 }, 'itens/prato_bolo_macaxeira_via',
    'Da Vó Ia, de Itabaiana: macaxeira ralada, coco e açúcar, com canela por cima. Para a rua inteira.', { historia: 'rosa_1', dica: 'Uma receita de família, de longe: chega quando for a hora.' }),
};
// Os ingredientes novos das receitas (raridade, fase em que a pensão aceita, de onde vêm).
Object.assign(Pratos.INGREDIENTES, {
  leite: { raridade: 1, fase: 1, origem: 'Mercearia do Ananias' },
  acucar: { raridade: 1, fase: 1, origem: 'Mercearia do Ananias' },
  siri: { raridade: 2, fase: 2, origem: 'Praia à noite' },
  camarao: { raridade: 3, fase: 3, origem: 'Mascate' },
  polvo: { raridade: 4, fase: 3, origem: 'Viajante da Capital (às quintas)' },
});
Object.assign(Pratos.MERCEARIA, { leite: 2, acucar: 1 });
for (const id in RECEITAS_NOVAS) Pratos.PRATOS[id] = Object.assign({ montar: Object.keys(RECEITAS_NOVAS[id].porcao) }, RECEITAS_NOVAS[id]);
// (14/10, Tarefa D1, a cozinha de verdade) A categoria de cada receita (no Dave, o cardápio separa o sushi simples, os pratos
// compostos, os de chefão e os de festa; aqui, o jeito da cozinha da Rosa). O caderno e o quadro mostram; o quadro filtra; a festa
// e o concurso podem pedir uma categoria. O nome curto vai no filtro do quadro.
const CATEGORIAS = { peixe: 'Peixe', caldo: 'Caldo e cozido', pf: 'Prato feito', doce: 'Doce', horta: 'Da horta', salgado: 'Salgado' };
const CATEGORIA_PRATO = {
  peixe: ['peixe_frito', 'sardinha_frita', 'lambari_crocante', 'casquinha_siri', 'escondidinho', 'lagosta_manteiga', 'robalo_assado', 'arroz_polvo'],
  caldo: ['sopa_pedra', 'sopa_legumes', 'peixe_ensopado', 'caldo_caranguejo', 'caldo_peixe', 'pirao', 'moqueca', 'moqueca_capixaba', 'bobo_camarao',
    'peixada', 'caldeirada', 'moqueca_prefeito', 'caldeirada_critico', 'vatapa', 'pitu_moranga'],
  pf: ['pf_peao', 'virado', 'marmita_peao', 'picadinho_santos'],
  doce: ['cocada_tijolinho', 'rabanada', 'arroz_doce', 'mingau_milho', 'bolinho_chuva', 'canjica', 'pamonha', 'goiabada', 'bolo_milho', 'doce_leite_calixto', 'bolo_macaxeira_via'],
  horta: ['salada_rosa', 'couve_mineira', 'pure_abobora'],
  salgado: ['farofa_ovo', 'mandioca_frita', 'cuscuz'],
};
for (const [cat, ids] of Object.entries(CATEGORIA_PRATO)) for (const id of ids) if (Pratos.PRATOS[id]) Pratos.PRATOS[id].categoria = cat;
for (const id in Pratos.PRATOS) if (!Pratos.PRATOS[id].categoria) throw new Error('receita sem categoria: ' + id);
// A categoria do prato ('casa': o prato da casa é um prato feito) e o nome dela.
const categoriaDe = id => id === 'casa' ? 'pf' : (Pratos.PRATOS[id] || {}).categoria || '';
const nomeCategoria = id => CATEGORIAS[categoriaDe(id)] || '';
// Nomes dos ingredientes que o banco de itens ainda não tinha.
if (typeof ITENS !== 'undefined') for (const [id, nome] of Object.entries({ linguica: 'Linguiça', carne_seca: 'Carne-seca', macarrao: 'Macarrão', dende: 'Azeite de dendê',
  leite_coco: 'Leite de coco', queijo_coalho: 'Queijo coalho', pimenta_cheiro: 'Pimenta-de-cheiro', leite: 'Leite', acucar: 'Açúcar', siri: 'Siri',
  camarao: 'Camarão', polvo: 'Polvo' })) if (!ITENS[id]) ITENS[id] = { nome, tipo: 'ingrediente' };
// A arte de cada prato: a dos pratos de partida é itens/prato_<id>; as novas têm a própria (o prato da casa usa a do PF).
function iconePrato(id) { const p = typeof Pensao !== 'undefined' && Pensao.prato ? Pensao.prato(id) : Pratos.PRATOS[id]; return (p && p.icone) || 'itens/prato_' + id; }
// A arte grande do prato (a/pratos/, 128 px) para o palco e o caderno; o ícone de 48 px fica para o inventário.
const _PRATOS_GRANDES = new Set(ARTE_LISTA.filter(n => n.startsWith('pratos/')));
function iconePratoGrande(id) { const n = 'pratos/' + iconePrato(id).split('/').pop(); return _PRATOS_GRANDES.has(n) ? n : iconePrato(id); }
// Desenha o prato com o pé em (x, y); `escala` como a do ícone de 48 px (a arte grande é reduzida na mesma medida).
function desenhaPrato(ctx, id, x, y, alfa = 1, escala = 1) { const g = iconePratoGrande(id); desenhaPe(ctx, g, x, y, alfa, g.startsWith('pratos/') ? escala * 48 / 128 : escala); }
