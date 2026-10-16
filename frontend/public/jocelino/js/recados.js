// Jocelino — recados.js — os recados do povo da Vila (o Help Wanted do Stardew; plano de 15/10, "Quadro de pedidos da Vila"),
// as regras (a tela, o mundo e o guia vêm depois, em recados_jogo.js e empreitas_jogo.js):
// - 1 recado por dia a partir do dia ECO.recados.diaMin (no Stardew, nada no dia 1), só com o quadro liberado pelo guia;
// - quem pede é um morador com boneco andando no mapa (decisão do dono, 15/10): Zélia, Ananias, Zé, Bira, Tonico, Juca e o
//   Lourival depois que a praia abre. A Rosa e as crianças não pedem (no Stardew, a esposa e os filhos também não);
// - só o que dá para fazer agora: a estação certa, o mapa de onde vem o item aberto, a horta plantada (ou o item na mochila) e,
//   para madeira, pedra e fibra, o bastante no mundo aberto (os detritos que soltam o item);
// - o cliente é diferente dos clientes dos serviços do dia; o tipo alterna no ritmo de 2 entregas para 1 coleta (as entregas são a
//   maioria, como no Stardew): depois de uma coleta vem entrega, e depois de 2 entregas seguidas vem coleta, quando houver
//   (ECO.recados.entregasPorColeta; com 1, alterna dia sim, dia não); sem histórico, a entrega pesa 2 e a coleta 1; nada se
//   repete em ECO.recados.janela dias (C11: 14; eram 7), e o que está há mais tempo sem aparecer pesa mais;
// - (C2, 16/10) não sai recado do material que a reforma da pensão ainda vai pedir, nem de pedra com a obra do dia pedindo pedra;
// - prazo de 2 dias (o dia em que aceitou e o seguinte); vencido, some sem multa; até 2 recados aceitos de uma vez;
// - a entrega é direto da mochila (decisão do dono, 15/10: botão direito no morador, "Entregar 3 couves?"): paga na hora o
//   valor do ECO e dá +50 de amizade (amizade.js; a Lábia vale); a coleta só conta o que entrar na mochila depois de aceitar;
// - o recado NÃO conta para a Fala da Vila nem para a carreira (decisão do dono, 15/10): só dinheiro e amizade.
// Campos: tipo ('entrega' | 'coleta'), cliente, item, qtd, fala (o pedido, na voz da pessoa), obrigado, deixa (o recado vencido, sem
// bronca, para o resumo da noite), estacoes (0 Outono, 1 Inverno, 2 Primavera, 3 Verão), mapas (de onde vem o item), diaMin e,
// quando precisa, `precisa` (a ferramenta: a vara) e `falaPedreira` (a fala depois que a pedreira abre). O pagamento mora no ECO.
// (C11, 16/10; o teste crítico: "Zé quer 10 fibras" voltava no dia ~48 com o mesmo texto do dia 2, e o recado de tomate saía no inverno)
// Cada recado tem 2 ou 3 VEZES (as listas fala, obrigado e deixa andam juntas: a fala da 2ª vez tem o obrigado e o "deixa" da 2ª vez).
// A vez é a conta de quantas vezes o recado já saiu (Recados.vez), e não o dia % n do plano: com a janela de 14 dias, o dia % 2
// daria a mesma frase duas vezes seguidas (14 é par). Como o Help Wanted do Stardew: cada morador pede com a voz dele, e a colheita
// só se pede na estação da cultura (lá, nem se pede colheita no inverno). Os recados de primavera e verão (caju, jabuticaba,
// pitanga, milho, concha, abóbora) e os da mata no outono (cambuci, araçá) entram aqui também: com a janela de 14 dias, os 16 da
// primeira lista não enchiam o quadro.

const TODO_ANO = [0, 1, 2, 3];
const PEDIDOS_VILA = {
  // ---- Entregas dos primeiros dias
  ent_couve_zelia: { tipo: 'entrega', cliente: 'zelia', item: 'couve', qtd: 3, estacoes: [0, 1], mapas: ['quintal'], diaMin: 8,
    fala: ['Meu filho, me deu uma saudade de caldo verde... Três pés de couve bem verdinhos e eu faço um panelão.',
      'Minha irmã vem de Santos no domingo e ela só almoça se tiver couve refogada. Três pés dos bonitos, meu filho?',
      'O doutor do posto mandou comer verdura, meu filho. A couve da feira chega murcha: três pés da sua horta?'],
    obrigado: ['Ai, que beleza de couve! Passa aqui de noite pra provar o caldo.',
      'Couve de quintal, cheirosa! A minha irmã vai querer levar muda.',
      'Verdinha que dá gosto. O doutor vai ficar orgulhoso de mim, meu filho!'],
    deixa: ['Deixa, meu filho, a vizinha arrumou umas couves.',
      'A minha irmã trouxe couve de Santos mesmo, meu filho. Fica pra próxima.',
      'Comprei da feira mesmo, meu filho. Murchinha, mas serve.'] },
  // (T3, 15/10) O 2º recado da Dona Zélia, possível desde o dia 2 (o da couve só vem com a horta): a flor nasce no chão do quintal e da Vila.
  ent_flor_zelia: { tipo: 'entrega', cliente: 'zelia', item: 'flor', qtd: 3, estacoes: [0, 1, 2], mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: ['Meu filho, hoje tem terço lá em casa e o altarzinho da sala tá sem flor. Arruma três flores do mato pra mim?',
      'É aniversário da minha comadre e eu não quero chegar de mão abanando. Três flores do mato fazem um raminho, meu filho.',
      'A procissão passa aqui na porta no sábado e a minha janela tá sem enfeite. Três flores do mato, meu filho?'],
    obrigado: ['Que lindeza! O altar vai ficar todo prosa. Deus te pague, meu filho.',
      'Que raminho bonito! A comadre vai chorar, você vai ver.',
      'A janela mais enfeitada da rua! Deus te pague, meu filho.'],
    deixa: ['A comadre trouxe flor de plástico, meu filho. Serve, serve.',
      'Levei um bolo de fubá pra comadre no lugar das flores, meu filho. Ela gostou.',
      'Pendurei uma toalha de crochê na janela, meu filho. Ficou bonito também.'] },
  ent_goiaba_tonico: { tipo: 'entrega', cliente: 'tonico', item: 'goiaba', qtd: 3, estacoes: [0, 1], mapas: ['quintal', 'vila'], diaMin: 2,
    fala: ['Goiaba no tacho de cobre fica outra coisa, Jocelino. Me arruma três, que a forja tá quente.',
      'A patroa quer fazer goiabada cascão e a goiabeira lá de casa não deu nada este ano. Três goiabas, rapaz?',
      'Goiaba com queijo depois da forja é o meu almoço, rapaz. Me arruma três do chão?'],
    obrigado: ['Cheiro de doce na ferraria! Valeu, rapaz.',
      'Goiabada garantida! Passa na ferraria que eu guardo um pedaço.',
      'Almoço de ferreiro! Valeu, rapaz.'],
    deixa: ['Deixa estar, rapaz: o doce fica pra outra fornada.',
      'A patroa fez doce de banana no lugar. Ficou bom também, rapaz.',
      'Almocei pão com queijo mesmo, rapaz. Tranquilo.'] },
  ent_flor_bira: { tipo: 'entrega', cliente: 'bira', item: 'flor', qtd: 3, estacoes: [0, 1, 2], mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: ['Rapaz, hoje é aniversário da patroa e eu esqueci. Arruma umas flores do mato antes das cinco?',
      'Briguei com a patroa por causa do futebol, rapaz. Três flores do mato acalmam a fera?',
      'As irmãs da patroa vêm jantar lá em casa e a mesa tá sem enfeite. Três flores do mato, rapaz?'],
    obrigado: ['Salvou minha pele! Ela nem vai desconfiar.',
      'Paz em casa de novo! Te devo essa, rapaz.',
      'Mesa enfeitada, cunhada calada! Valeu, rapaz.'],
    deixa: ['Comprei umas flores na feira mesmo. Fica pra próxima, rapaz.',
      'Fiz as pazes com um pastel da feira. Fica pra próxima, rapaz.',
      'A patroa pôs um vaso de plástico na mesa. Ninguém reparou, rapaz.'] },
  ent_coco_ze: { tipo: 'entrega', cliente: 'ze', item: 'coco', qtd: 2, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'praia'], diaMin: 2,
    fala: ['Sol de rachar na laje, Jocelino! Me arruma dois cocos que eu divido com a peãozada.',
      'A peãozada vai virar a laje hoje e a água da bica não dá conta. Dois cocos, parceiro?',
      'Tem ensaio do samba hoje à noite e eu fico sem voz se não tomar uma água de coco. Me arruma dois?'],
    obrigado: ['Ê, água de coco! Lá lá laiá!',
      'Coco gelado, laje no lugar! Valeu, parceiro.',
      'Voz afinada pro samba! Lá lá laiá, parceiro!'],
    deixa: ['A peãozada tomou água da bica mesmo. Tranquilo, parceiro!',
      'Virou a laje na água da bica mesmo. Tranquilo, parceiro!',
      'Cantei rouco mesmo, parceiro. O samba perdoa!'] },
  ent_fibra_ze: { tipo: 'entrega', cliente: 'ze', item: 'fibra', qtd: 10, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: ['A amarração do andaime tá podre. Me traz dez de fibra que eu tranço uma corda nova.',
      'A corda do balde da obra arrebentou, parceiro: sem corda, a massa sobe no braço. Dez de fibra?',
      'Quero trançar uma esteira pra tirar o cochilo do almoço na sombra da obra. Dez de fibra, parceiro?'],
    obrigado: ['Corda nova, andaime firme. Obrigado, parceiro.',
      'Balde subindo sozinho! Te devo uma, parceiro.',
      'Esteira nova, cochilo garantido! Valeu, parceiro.'],
    deixa: ['Arrumei uma corda emprestada. Fica pra próxima, parceiro.',
      'Subi a massa no braço mesmo. Fica pra próxima, parceiro.',
      'Cochilei no saco de cimento mesmo. Fica pra próxima, parceiro!'] },
  ent_madeira_juca: { tipo: 'entrega', cliente: 'juca', item: 'madeira', qtd: 10, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: ['Sobrinho, a lenha acabou e a água do banho das crianças é no fogão. Dez de madeira resolve.',
      'O pé da mesa da cozinha quebrou e a sua tia tá comendo com o prato na mão, sobrinho. Dez de madeira resolve.',
      'O fogão de lenha tá com fome, sobrinho. Dez de madeira pro feijão de amanhã?'],
    obrigado: ['Lenha boa, seca. Ê, Aracaju ensinou direito.',
      'Mesa firme de novo! A sua tia mandou um beijo, sobrinho.',
      'Feijão garantido! Lá em Aracaju lenha dessas custava caro.'],
    deixa: ['Esquentei a água com o que tinha, sobrinho. Sem problema.',
      'Calcei a mesa com um tijolo, sobrinho. Sem problema.',
      'O feijão foi no fogareiro mesmo, sobrinho. Sem problema.'] },
  ent_pedra_ananias: { tipo: 'entrega', cliente: 'ananias', item: 'pedra', qtd: 15, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata', 'pedreira'], diaMin: 2,
    fala: ['O caminhão da Serra não desce enquanto a estrada tá fechada, e o freguês quer pedra pro alicerce. Quinze pedras?',
      'Um freguês quer fazer um muro de arrimo e o meu estoque de pedra zerou. Quinze pedras, Jocelino?',
      'O caminhão atola na frente do depósito toda vez que chove. Quinze pedras pra calçar a entrada, freguês?'],
    falaPedreira: ['Freguês apressado, pedra pouca. Quinze pedras, Jocelino?',
      'A pedreira abriu, mas o freguês quer a pedra hoje e eu não tenho braço. Quinze pedras, freguês?',
      'Com a pedreira aberta, o povo só quer pedra. Quinze pra prateleira, Jocelino?'],
    obrigado: ['Pedra boa. Material bem pago, freguês.',
      'Pois não, pedra bem escolhida. Volte sempre.',
      'Entrada calçada, caminhão feliz. Obrigado, freguês.'],
    deixa: ['O freguês achou pedra em outro canto. Fica pra próxima.',
      'O freguês desistiu do muro. Fica pra próxima.',
      'Joguei entulho na entrada mesmo. Fica pra próxima, freguês.'] },
  ent_alface_ananias: { tipo: 'entrega', cliente: 'ananias', item: 'alface', qtd: 5, estacoes: [0, 1, 2], mapas: ['quintal'], diaMin: 6,
    fala: ['O caminhão da Ceasa não veio e a freguesia da Mercearia quer verdura. Cinco pés de alface?',
      'As freguesas querem salada pro almoço de domingo e a minha banca de verdura tá vazia. Cinco pés de alface, freguês?',
      'O verdureiro da Ceasa aumentou o preço e eu não pago. Cinco pés de alface, com preço de vizinho?'],
    obrigado: ['Já tem freguesa esperando! Pois não, obrigado.',
      'Alface fresquinha vende sozinha. Obrigado, freguês.',
      'Preço de vizinho, verdura de primeira. Pois não, obrigado.'],
    deixa: ['A Ceasa mandou verdura no fim das contas. Obrigado assim mesmo.',
      'As freguesas levaram repolho no lugar. Obrigado assim mesmo.',
      'Paguei o verdureiro e chorei no troco. Obrigado assim mesmo.'] },
  // (C11) O tomate só no outono e na primavera: no inverno o pé dá miúdo e o Mestre Bira não pede (o teste crítico achou o recado de
  // tomate no inverno, dia ~40). A estação da cultura (CULTURAS.estacoes) também vale: Recados.possivel cruza as duas.
  ent_tomate_bira: { tipo: 'entrega', cliente: 'bira', item: 'tomate', qtd: 2, estacoes: [0, 2], mapas: ['quintal'], diaMin: 11,
    fala: ['A peãozada reclamou do molho aguado da marmita. Dois tomates bons fazem milagre.',
      'O Zé quer fazer vinagrete pro churrasco de sábado da peãozada. Dois tomates bons, rapaz?',
      'A patroa jurou que não faz mais macarrão com tomate de feira. Dois da sua horta, rapaz?'],
    obrigado: ['Agora sim, molho de verdade!',
      'Vinagrete de respeito! O churrasco tá salvo, rapaz.',
      'Tomate vermelho por dentro! A patroa vai fazer festa, rapaz.'],
    deixa: ['A marmita foi de molho aguado mesmo. Fica pra próxima!',
      'O churrasco foi sem vinagrete mesmo. Fica pra próxima, rapaz!',
      'Foi macarrão na manteiga mesmo. Fica pra próxima, rapaz!'] },
  // ---- Entregas das fases seguintes (a praia e a mata)
  ent_sardinha_lourival: { tipo: 'entrega', cliente: 'lourival', item: 'sardinha', qtd: 4, estacoes: TODO_ANO, mapas: ['praia'], diaMin: 2, precisa: 'vara',
    fala: ['Compadre, o barco do Dito quebrou e a banca tá pelada. Me traz quatro sardinhas pro almoço do pessoal?',
      'Prometi uma sardinhada pros meninos da Colônia e o mar hoje não me deu nada. Quatro sardinhas, compadre?',
      'A isca do espinhel acabou, e sardinha é a melhor isca que tem. Me traz quatro, compadre?'],
    obrigado: ['Salvou a banca, compadre!',
      'Sardinhada garantida! O mar te conhece, compadre.',
      'Espinhel iscado! Amanhã tem garoupa, compadre.'],
    deixa: ['O Dito consertou o barco, compadre. Fica pra outra vez.',
      'Os meninos comeram pão com mortadela mesmo. Fica pra outra vez, compadre.',
      'Iscou com camarão mesmo, compadre. Fica pra outra vez.'] },
  ent_tainha_tonico: { tipo: 'entrega', cliente: 'tonico', item: 'tainha', qtd: 2, estacoes: [0, 1], mapas: ['praia'], diaMin: 2, precisa: 'vara',
    fala: ['Tainha na brasa da forja, Jocelino. Duas, se o mar deixar.',
      'O meu cunhado vem de São Vicente e só fala em tainha. Duas pra mim, rapaz?',
      'Tainha assada na folha de bananeira, no calor da forja. Duas, Jocelino?'],
    obrigado: ['Isso é que é almoço de ferreiro!',
      'Tainha gorda! O cunhado vai querer morar aqui, rapaz.',
      'A forja virou churrasqueira hoje! Valeu, rapaz.'],
    deixa: ['Almocei o que tinha, rapaz. A tainha fica pra outro dia.',
      'O cunhado comeu frango mesmo, rapaz. Fica pra outro dia.',
      'A folha de bananeira fica pra outro dia, rapaz.'] },
  ent_cogumelo_juca: { tipo: 'entrega', cliente: 'juca', item: 'cogumelo', qtd: 2, estacoes: [0, 1], mapas: ['mata'], diaMin: 2,
    fala: ['Cogumelo do mato com ovo, do jeito que a minha mãe fazia lá em Sergipe. Acha dois pra mim?',
      'A sua tia viu risoto de cogumelo na novela e cismou, sobrinho. Dois do chão da mata?',
      'Depois da chuva a mata enche de cogumelo. Me traz dois que eu faço um refogado com alho, sobrinho.'],
    obrigado: ['Esse cheiro me levou de volta pra casa.',
      'Risoto de novela na casa do Juca! Obrigado, sobrinho.',
      'Cogumelo bom, desses de cheiro forte. Obrigado, sobrinho.'],
    deixa: ['Fiz o ovo puro mesmo, sobrinho. Outro dia a gente acha.',
      'A sua tia fez arroz com ovo e disse que é risoto. Outro dia a gente acha.',
      'Refoguei só o alho mesmo, sobrinho. Outro dia a gente acha.'] },
  // ---- Coletas (só conta o que entrar na mochila depois de aceitar)
  col_madeira_ze: { tipo: 'coleta', cliente: 'ze', item: 'madeira', qtd: 15, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: ['O Mestre quer forma nova pra laje e a madeira da obra acabou. Junta quinze pra mim, da boa?',
      'Vou montar um palquinho pro samba da praça, parceiro. Junta quinze de madeira pra mim, da boa?',
      'O barraco de ferramenta da obra tá caindo aos pedaços. Quinze de madeira, juntando de hoje em diante, parceiro?'],
    obrigado: ['Forma de primeira! O Mestre vai achar que fui eu.',
      'O samba vai ter palco! Lá lá laiá, parceiro!',
      'Barraco de pé, ferramenta na sombra. Valeu, parceiro!'],
    deixa: ['O Mestre arrumou madeira no depósito. Valeu a intenção, parceiro!',
      'O samba foi no chão mesmo, parceiro. Valeu a intenção!',
      'Escorei o barraco com uma ripa velha. Valeu a intenção, parceiro!'] },
  col_pedra_tonico: { tipo: 'coleta', cliente: 'tonico', item: 'pedra', qtd: 15, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata', 'pedreira'], diaMin: 2,
    fala: ['A base da forja tá afundando. Quinze pedras e eu calço ela de novo.',
      'A chuva cavou um buraco na porta da ferraria e o freguês tropeça. Quinze pedras pra tapar, rapaz?',
      'Quero fazer uma muretinha pro carvão não molhar. Quinze pedras, juntando de hoje em diante?'],
    obrigado: ['Forja firme, ferro reto. Muito obrigado.',
      'Porta tapada, freguês de pé! Muito obrigado, rapaz.',
      'Carvão sequinho! Muito obrigado, rapaz.'],
    deixa: ['Calcei a forja com tijolo velho. Fica pra próxima, rapaz.',
      'Tapei o buraco com areia mesmo. Fica pra próxima, rapaz.',
      'Cobri o carvão com uma lona. Fica pra próxima, rapaz.'] },
  col_fibra_juca: { tipo: 'coleta', cliente: 'juca', item: 'fibra', qtd: 15, estacoes: TODO_ANO, mapas: ['quintal', 'vila', 'mata'], diaMin: 2,
    fala: ['A cerca de bambu do galinheiro tá solta. Fibra pra amarrar: quinze, que eu faço o resto.',
      'Vou trançar um balaio pra sua tia levar na feira, sobrinho. Quinze de fibra, juntando de hoje em diante?',
      'A rede da varanda desfiou toda, sobrinho. Quinze de fibra e eu remendo.'],
    obrigado: ['Galinha presa, horta salva!',
      'Balaio de Sergipe, feito em São Paulo! Obrigado, sobrinho.',
      'Rede nova, cochilo de domingo garantido. Obrigado, sobrinho.'],
    deixa: ['Amarrei a cerca com arame mesmo, sobrinho. Sem problema.',
      'A sua tia levou a sacola de plástico mesmo, sobrinho. Sem problema.',
      'Cochilei na cadeira mesmo, sobrinho. Sem problema.'] },
  // ---- (C11) Os recados de cada estação (o Help Wanted do Stardew pede o que a estação dá): a mata no outono e no inverno (cambuci,
  // araçá), a praia o ano todo (concha), e a primavera e o verão (caju, jabuticaba, pitanga, milho, abóbora), quando os da couve,
  // da goiaba e da tainha saem de cena.
  ent_cambuci_zelia: { tipo: 'entrega', cliente: 'zelia', item: 'cambuci', qtd: 3, estacoes: [0, 1], mapas: ['mata'], diaMin: 2,
    fala: ['Meu filho, a minha avó fazia doce de cambuci e eu nunca mais provei. Três da mata, pra eu tentar a receita?',
      'Dizem que cambuci com açúcar cura gripe, meu filho. Três, que eu tô com a garganta arranhando.'],
    obrigado: ['Cheiro de casa de vó! Vou fazer o doce hoje mesmo, meu filho.',
      'Gripe nenhuma resiste! Deus te pague, meu filho.'],
    deixa: ['Fiz doce de goiaba mesmo, meu filho. A avó ia entender.',
      'Tomei chá de alho mesmo, meu filho. Já passou.'] },
  ent_araca_lourival: { tipo: 'entrega', cliente: 'lourival', item: 'araca', qtd: 3, estacoes: [0, 1, 3], mapas: ['mata'], diaMin: 2,
    fala: ['Compadre, os meninos do barco pediram suco de araçá, que é azedinho e mata a sede. Três da mata?',
      'Araçá na cachaça é remédio de pescador velho, compadre. Três, que o joelho tá rangendo.'],
    obrigado: ['Suco pros meninos! O mar fica mais leve, compadre.',
      'O joelho agradece, compadre!'],
    deixa: ['Os meninos tomaram água mesmo, compadre. Fica pra outra vez.',
      'Passei pomada no joelho mesmo, compadre. Fica pra outra vez.'] },
  ent_concha_bira: { tipo: 'entrega', cliente: 'bira', item: 'concha', qtd: 3, estacoes: TODO_ANO, mapas: ['praia', 'quintal', 'vila'], diaMin: 2,
    fala: ['A patroa quer fazer uma cortina de concha pra varanda, rapaz. Três da praia pra começar?',
      'A minha sobrinha vem passar o fim de semana e quer um colar de concha. Três da praia, rapaz?'],
    obrigado: ['Varanda de casa de praia! A patroa vai gostar, rapaz.',
      'Colar de princesa! A sobrinha vai amar, rapaz.'],
    deixa: ['A patroa pendurou tampinha de garrafa mesmo. Fica pra próxima, rapaz.',
      'A sobrinha fez colar de macarrão mesmo. Fica pra próxima, rapaz.'] },
  ent_caju_ze: { tipo: 'entrega', cliente: 'ze', item: 'caju', qtd: 3, estacoes: [2, 3], mapas: ['quintal', 'vila'], diaMin: 2,
    fala: ['Caju com sal no intervalo da obra, parceiro: é a vitamina da peãozada. Três do chão?',
      'Quero fazer uma cajuína pro samba de sábado, do jeito da minha terra. Três cajus, parceiro?'],
    obrigado: ['Caju azedinho! A peãozada te agradece, parceiro.',
      'Cajuína no samba! Lá lá laiá, parceiro!'],
    deixa: ['A peãozada chupou laranja mesmo. Tranquilo, parceiro!',
      'O samba foi de guaraná mesmo. Tranquilo, parceiro!'] },
  ent_jabuticaba_juca: { tipo: 'entrega', cliente: 'juca', item: 'jabuticaba', qtd: 4, estacoes: [2, 3], mapas: ['mata'], diaMin: 2,
    fala: ['Lá em Sergipe não tinha jabuticaba, sobrinho. Me traz quatro da mata que eu quero provar de novo.',
      'A sua tia quer fazer geleia de jabuticaba pra vender na feira. Quatro da mata, sobrinho?'],
    obrigado: ['Docinha que só! São Paulo tem lá as suas vantagens, sobrinho.',
      'Geleia de primeira! A sua tia mandou guardar um pote pra você.'],
    deixa: ['Fica pra outra safra, sobrinho. Sem problema.',
      'A sua tia fez geleia de goiaba mesmo, sobrinho. Sem problema.'] },
  ent_pitanga_ananias: { tipo: 'entrega', cliente: 'ananias', item: 'pitanga', qtd: 4, estacoes: [2, 3], mapas: ['mata'], diaMin: 2,
    fala: ['No calor a freguesia pede suco de pitanga. Quatro da mata, freguês?',
      'Vou pôr pitanga na vitrine da Mercearia: fruta bonita chama freguês. Quatro, Jocelino?'],
    obrigado: ['Suco gelado na Mercearia! Pois não, obrigado.',
      'Vitrine vermelhinha, freguês na porta. Obrigado, freguês.'],
    deixa: ['A freguesia tomou refresco de pacote. Obrigado assim mesmo.',
      'Pus laranja na vitrine. Obrigado assim mesmo.'] },
  ent_milho_lourival: { tipo: 'entrega', cliente: 'lourival', item: 'milho', qtd: 2, estacoes: [2, 3], mapas: ['quintal'], diaMin: 2,
    fala: ['Milho verde assado na brasa, na beira do mar: tem coisa melhor, compadre? Duas espigas da sua horta?',
      'A Colônia vai fazer a festa do padroeiro e eu fiquei de levar pamonha. Duas espigas, compadre?'],
    obrigado: ['Milho doce, compadre! A brasa já tá acesa.',
      'Pamonha da Colônia garantida! Obrigado, compadre.'],
    deixa: ['Assei uma sardinha no lugar, compadre. Fica pra outra vez.',
      'Levei cocada pra festa mesmo, compadre. Fica pra outra vez.'] },
  ent_abobora_tonico: { tipo: 'entrega', cliente: 'tonico', item: 'abobora', qtd: 1, estacoes: [3, 0], mapas: ['quintal'], diaMin: 2,
    fala: ['Doce de abóbora com coco, no tacho grande, rapaz. Uma abóbora da sua horta?',
      'A patroa quer fazer quibebe pro almoço de domingo. Uma abóbora boa, rapaz?'],
    obrigado: ['Abóbora pesada, doce garantido! Valeu, rapaz.',
      'Quibebe de domingo! Passa lá pra provar, rapaz.'],
    deixa: ['O tacho fica pra outra fornada, rapaz.',
      'A patroa fez purê de batata mesmo, rapaz. Tranquilo.'] },
};
ecoCampo(PEDIDOS_VILA, 'paga', ECO.recados.paga);   // o pagamento de cada recado mora no ECO
// Onde mora o boneco de cada um (a entrega é feita no próprio morador): o mapa tem de estar aberto para ele pedir.
const RECADO_MORADOR = { zelia: 'vila', ananias: 'vila', ze: 'vila', bira: 'vila', tonico: 'vila', juca: 'quintal', lourival: 'praia' };
// "para a Dona Zélia", "o recado do Zé"
const RECADO_ARTIGO = { zelia: 'a', ananias: 'o', ze: 'o', bira: 'o', tonico: 'o', juca: 'o', lourival: 'o' };
const RECADO_NOME = { zelia: 'Dona Zélia', ananias: 'Seu Ananias', ze: 'Zé', bira: 'Mestre Bira', tonico: 'Seu Tonico', juca: 'Tio Juca', lourival: 'Seu Lourival' };
// Os mapas onde se procura o material no chão (madeira, pedra, fibra), na ordem.
const RECADO_MAPAS_MATERIAL = ['quintal', 'vila', 'mata', 'pedreira', 'praia'];
// (C2, 16/10) O material que a reforma da pensão ainda vai pedir (a etapa de agora e as seguintes), desde que a Rosa contou o sonho
// (antes, a família nem sabe da lojinha): { madeira: 20, ... }. O Agora não manda vender isso (cartao.js) e o quadro não sorteia
// recado do mesmo item (Recados.disputa). Desde o sonho, e não só da compra em diante: o recado do dia é sorteado de manhã, e no robô
// (semente 33) o de madeira do Zé saiu às 7h do dia da compra, foi aceito depois dela e levou a madeira do balcão (a janta foi do
// dia 5 para o 8); e o Agora não manda vender na véspera o que a reforma vai pedir no dia seguinte. Diferença pequena e de propósito
// do Stardew (lá o Help Wanted pode pedir a madeira que o jogador junta para a Robin, e ele decide): aqui o quadro tem só 1 recado
// por dia e o robô da Fase A perdeu 15 dias com a disputa.
function materialDaReforma() {
  const p = G.pensao; if (!p || typeof p.materialQueFalta !== 'function') return {};
  if (p.estado === 'fechada' && !(G.lojinha && G.lojinha.conversou)) return {};
  return p.materialQueFalta();
}

const Recados = {
  iniciar(s) {
    const r = s.recados || {}, ativos = {};
    for (const id in r.ativos || {}) if (PEDIDOS_VILA[id]) ativos[id] = Object.assign({}, r.ativos[id], { juntou: r.ativos[id].juntou || 0 });   // (recado que saiu do jogo: some)
    G.recados = { doDia: r.doDia && PEDIDOS_VILA[r.doDia] ? r.doDia : null, dia: r.dia || 0, ativos, ultimaVez: Object.assign({}, r.ultimaVez || {}),
      ultimoTipo: r.ultimoTipo || '', entregues: r.entregues || 0, vezes: Object.assign({}, r.vezes || {}) };   // (C11: vezes, quantas vezes cada um já saiu; o save antigo começa do zero)
  },
  salvar(s) { s.recados = JSON.parse(JSON.stringify(G.recados)); },
  nome(cliente) { return RECADO_NOME[cliente] || (typeof CLIENTE_NOME !== 'undefined' && CLIENTE_NOME[cliente]) || cliente; },
  estacao(dia) { return Math.floor((dia - 1) / 28) % 4; },
  aberto(mapa) { return typeof Mundo === 'undefined' || Mundo.aberto(mapa); },
  // O quadro já chegou (o guia libera o quadro de serviços; sem o guia, o simulador e as regras puras, vale o dia).
  liberado(dia = G.dia) { return !!G.recados && dia >= ECO.recados.diaMin && (typeof Guia === 'undefined' || Guia.liberado('quadro')); },
  // (C11) A vez do recado: 0 na 1ª vez que sai, 1 na 2ª... (G.recados.vezes conta no sorteio guardado, poeDoDia). As frases andam
  // juntas: a vez escolhe a fala, o obrigado e o "deixa" da mesma lista (a 3ª vez de um recado de 2 frases volta à 1ª).
  vez(id) { const R = G.recados; return Math.max(0, ((R && R.vezes && R.vezes[id]) || 1) - 1); },
  frase(lista, id) { if (!Array.isArray(lista)) return lista; return lista[Recados.vez(id) % lista.length]; },
  // A fala do pedido (a do Seu Ananias muda quando a pedreira abre).
  fala(id) { const P = PEDIDOS_VILA[id]; return Recados.frase(P.falaPedreira && Recados.aberto('pedreira') ? P.falaPedreira : P.fala, id); },
  obrigado(id) { return Recados.frase(PEDIDOS_VILA[id].obrigado, id); },
  deixa(id) { return Recados.frase(PEDIDOS_VILA[id].deixa, id); },
  // "Dona Zélia quer 3 couves"
  titulo(id) { const P = PEDIDOS_VILA[id]; return `${Recados.nome(P.cliente)} quer ${Itens.qtd(P.qtd, P.item)}`; },
  // Quanto do item os detritos dos mapas abertos soltam (a árvore conta o toco que fica). O mapa ainda não montado é montado
  // como o resto do jogo faz (os achados): o que o jogador já tirou não volta, e a mata e a pedreira repõem de manhã.
  noMundo(item, mapas = RECADO_MAPAS_MATERIAL) {
    let n = 0;
    for (const id of mapas) {
      if (!Recados.aberto(id) || typeof MAPAS_DEF === 'undefined' || !MAPAS_DEF[id]) continue;
      let m = null; try { m = MAPAS[id] || (typeof getMapa === 'function' ? getMapa(id) : null); } catch (e) { m = null; }
      if (!m) continue;
      for (const o of m.objs) {
        if (o.tipo !== 'detrito' || o.empreitaDet) continue;
        const D = DETRITOS[o.det]; if (!D) continue;
        n += (D.solta && D.solta[item]) || 0;
        if (D.vira && DETRITOS[D.vira] && DETRITOS[D.vira].solta) n += DETRITOS[D.vira].solta[item] || 0;
      }
    }
    return n;
  },
  ehMaterial(item) { return Object.values(DETRITOS).some(D => D.solta && D.solta[item]); },
  // (T8, 15/10) O que nasce no chão (goiaba, flor, coco, cogumelo: os achados de achados.js)? Esses só valem se o chão dos mapas
  // abertos der a quantidade dentro do prazo: a vistoria achou recado impossível (3 goiabas no inverno com 1 goiaba no chão em 2 dias).
  ehAchado(item) { return typeof ACHADOS_ESTACAO !== 'undefined' && [...ACHADOS_ESTACAO, ...ACHADOS_MATA, ACHADOS_PRAIA].some(t => t.some(([id]) => id === item)); },
  // Quantos do item o chão dos mapas abertos dá do dia até o fim do prazo (hoje, o que ainda não foi catado; os dias seguintes, o
  // sorteio deles, que é fixo pelo dia e pelo mapa).
  noChao(item, mapas, dia = G.dia) {
    if (typeof Achados === 'undefined') return 0;
    let n = 0;
    for (let d = dia; d < dia + Recados.prazo(); d++) for (const id of mapas) {
      if (!Recados.aberto(id) || !ACHADOS_POR_MAPA[id] || typeof MAPAS_DEF === 'undefined' || !MAPAS_DEF[id]) continue;
      let lista = [];
      try {
        if (d === G.dia && G.achados && G.achados.dia === d) { const ja = G.achados.catados[id] || []; lista = Achados.doDia(d, id).filter(x => !ja.includes(x.k)); }
        else lista = Achados.sortear(d, id, MAPAS[id] || getMapa(id));
      } catch (e) { lista = []; }
      n += lista.filter(x => x.id === item).length;
    }
    return n;
  },
  // Covas da horta plantadas com a cultura.
  plantadas(item) { return G.horta && G.horta.covas ? Object.values(G.horta.covas).filter(c => c && c.planta === item).length : 0; },
  // (T8, correção do controlador) As covas da cultura que ficam prontas (colhíveis) dentro do prazo do recado: as maduras e as que
  // crescem até lá (a mesma conta de dias da horta, uma noite regada por dia). O pé ainda verde que só fica pronto depois do prazo
  // não conta: com 2 dias de prazo, "3 couves" com os pés plantados ontem vencia sem ter como cumprir.
  prontasNoPrazo(item) {
    if (!G.horta || !G.horta.covas || typeof Horta === 'undefined') return 0;
    return Object.values(G.horta.covas).filter(c => c && c.planta === item && Horta.diasDa(c) - (c.dias || 0) <= Recados.prazo() - 1).length;
  },
  // Dá para fazer agora? A estação, o dia, o morador e o mapa de origem abertos, a ferramenta (a vara), a horta plantada (ou o
  // item na mochila) e o material no mundo aberto (na entrega, somando o que já está na mochila; na coleta, só o mundo).
  possivel(id, dia = G.dia, mochila = G.mochila) {
    const P = PEDIDOS_VILA[id];
    if (!P || !P.estacoes.includes(Recados.estacao(dia)) || dia < Math.max(P.diaMin, ECO.recados.diaMin)) return false;
    if (!Recados.aberto(RECADO_MORADOR[P.cliente]) || !P.mapas.some(m => Recados.aberto(m))) return false;
    if (P.precisa && !(mochila && mochila.total(P.precisa) > 0)) return false;
    const tem = P.tipo === 'entrega' && mochila ? mochila.total(P.item) : 0;
    // (C11) A colheita só se pede na estação da cultura (a da horta e a do recado: o tomate não sai no inverno), mesmo com o item na mochila.
    if (typeof CULTURAS !== 'undefined' && CULTURAS[P.item] && !CULTURAS[P.item].estacoes.includes(Recados.estacao(dia))) return false;
    if (typeof CULTURAS !== 'undefined' && CULTURAS[P.item]) return Recados.prontasNoPrazo(P.item) + tem >= P.qtd;
    if (Recados.ehMaterial(P.item)) return tem >= P.qtd || tem + Recados.noMundo(P.item, P.mapas) >= P.qtd;
    if (!P.precisa && Recados.ehAchado(P.item)) return tem >= P.qtd || tem + Recados.noChao(P.item, P.mapas, dia) >= P.qtd;
    return true;
  },
  // Os clientes dos serviços do dia: o quadro de hoje (o guardado, ou o sorteio do dia) e os aceitos hoje.
  clientesDosServicos(dia = G.dia) {
    if (!G.empreitas || typeof Empreitas === 'undefined') return [];
    const q = G.empreitas.dia === dia ? G.empreitas.quadro || [] : Empreitas.quadroDoDia(dia);
    const hoje = Object.keys(G.empreitas.aceitas || {}).filter(k => G.empreitas.aceitas[k] && G.empreitas.aceitas[k].dia === dia);
    return [...new Set(q.concat(hoje).map(k => dadosEmpreita(k) && dadosEmpreita(k).cliente).filter(Boolean))];
  },
  // Os que podem sair hoje: possíveis, fora dos aceitos, sem ter aparecido nos últimos ECO.recados.janela dias (14), de um cliente sem serviço nem
  // recado aceito hoje e de um item que nenhum recado aceito já pede (revisão da T3: Zélia e Bira pedindo 3 flores cada, a entrega
  // de um zerava o outro em silêncio).
  candidatos(dia = G.dia, servicos = null) {
    if (!Recados.liberado(dia)) return [];
    const R = G.recados, ocupados = new Set((servicos || Recados.clientesDosServicos(dia)).concat(Object.keys(R.ativos).map(k => PEDIDOS_VILA[k].cliente)));
    const itens = new Set(Object.keys(R.ativos).map(k => PEDIDOS_VILA[k].item));
    return Object.keys(PEDIDOS_VILA).filter(id => !R.ativos[id] && !(R.ultimaVez[id] && dia - R.ultimaVez[id] < ECO.recados.janela)
      && !ocupados.has(PEDIDOS_VILA[id].cliente) && !itens.has(PEDIDOS_VILA[id].item) && !Recados.disputa(id, dia) && Recados.possivel(id, dia));
  },
  // (C2, 16/10) O recado disputa o material da família: o item que a reforma da pensão ainda vai pedir (a madeira do balcão), ou a
  // pedra com a obra do Bira pedindo pedra da mochila hoje (obraPedePedra, obra_jogo.js). Esse não sai no sorteio.
  disputa(id, dia = G.dia) {
    const P = PEDIDOS_VILA[id]; if (!P) return false;
    if (materialDaReforma()[P.item]) return true;
    return P.item === 'pedra' && typeof obraPedePedra === 'function' && obraPedePedra(dia);
  },
  // Os recados que já saíram antes do dia, do mais novo ao mais velho.
  ultimos(dia = G.dia) { const R = G.recados; return Object.keys(R.ultimaVez).filter(id => PEDIDOS_VILA[id] && R.ultimaVez[id] < dia).sort((a, b) => R.ultimaVez[b] - R.ultimaVez[a]); },
  // O tipo que o ritmo pede hoje (pelos últimos recados que saíram): depois de uma coleta, entrega; depois de
  // ECO.recados.entregasPorColeta entregas seguidas, coleta; no meio do caminho, entrega; sem histórico, nenhum ('').
  tipoPreferido(dia = G.dia) {
    const ult = Recados.ultimos(dia);
    if (!ult.length) return '';
    if (PEDIDOS_VILA[ult[0]].tipo === 'coleta') return 'entrega';
    let seguidas = 0; for (const id of ult) { if (PEDIDOS_VILA[id].tipo !== 'entrega' || seguidas >= ECO.recados.entregasPorColeta) break; seguidas++; }
    return seguidas >= ECO.recados.entregasPorColeta ? 'coleta' : 'entrega';
  },
  // O sorteio do dia (fixo pelo dia, como o quadro de serviços): o tipo que o ritmo pede, quando houver; sem preferência, a entrega
  // pesa ECO.recados.pesoEntrega e a coleta 1; dentro do tipo, quem pediu ontem fica de fora quando há outro (para a mesma pessoa não
  // pedir dois dias seguidos), e o peso é 1 + min(14, dias sem aparecer); quem nunca apareceu vale 15.
  sortear(dia = G.dia, servicos = null) {
    const cand = Recados.candidatos(dia, servicos); if (!cand.length) return null;
    const f = mulberry(dia * 7349 + 23), R = G.recados;
    const ent = cand.filter(id => PEDIDOS_VILA[id].tipo === 'entrega'), col = cand.filter(id => PEDIDOS_VILA[id].tipo === 'coleta');
    let pool;
    const quer = Recados.tipoPreferido(dia);
    if (quer === 'coleta' && col.length) pool = col;
    else if (quer === 'entrega' && ent.length) pool = ent;
    else if (ent.length && col.length) pool = f() * (ECO.recados.pesoEntrega + 1) < ECO.recados.pesoEntrega ? ent : col;
    else pool = ent.length ? ent : col;
    const ontem = Recados.ultimos(dia)[0], cliOntem = ontem && dia - R.ultimaVez[ontem] === 1 ? PEDIDOS_VILA[ontem].cliente : '';
    if (cliOntem && pool.some(id => PEDIDOS_VILA[id].cliente !== cliOntem)) pool = pool.filter(id => PEDIDOS_VILA[id].cliente !== cliOntem);
    const peso = id => R.ultimaVez[id] ? 1 + Math.min(14, dia - R.ultimaVez[id]) : 15, soma = pool.reduce((t, id) => t + peso(id), 0);
    let v = f() * soma;
    for (const id of pool) { v -= peso(id); if (v < 0) return id; }
    return pool[pool.length - 1];
  },
  // O recado do dia: o guardado (o save e o recarregar mostram o mesmo) ou, para outro dia, o sorteio.
  doDia(dia = G.dia) { return G.recados && G.recados.dia === dia ? G.recados.doDia : Recados.sortear(dia); },
  // Guarda o recado do dia (uma vez por dia; antes do quadro liberado não marca o dia, para sortear quando ele chegar). O aceito
  // vencido que ninguém tirou à noite sai aqui, sem multa.
  poeDoDia(dia = G.dia) {
    const R = G.recados; if (!R) return null;
    if (R.dia === dia) return R.doDia;
    for (const id of Object.keys(R.ativos)) if (R.ativos[id].ate < dia) delete R.ativos[id];
    if (!Recados.liberado(dia)) { R.doDia = null; return null; }
    const id = Recados.sortear(dia);
    R.dia = dia; R.doDia = id;
    if (id) { R.ultimaVez[id] = dia; R.ultimoTipo = PEDIDOS_VILA[id].tipo; (R.vezes || (R.vezes = {}))[id] = (R.vezes[id] || 0) + 1; }
    return id;
  },
  hoje() { return Recados.poeDoDia(G.dia); },
  // O recado de hoje ainda no quadro (não aceito).
  noQuadro() { const id = Recados.hoje(); return id && !G.recados.ativos[id] ? id : null; },
  ativosDe(cliente) { return Object.keys(G.recados.ativos).filter(id => PEDIDOS_VILA[id].cliente === cliente); },
  aceitar(id) {
    const P = PEDIDOS_VILA[id], R = G.recados;
    if (!P || !R) return 'nao';
    if (R.ativos[id]) return 'ja';
    if (Recados.hoje() !== id) return 'nao';   // só o recado do dia
    if (Object.keys(R.ativos).length >= ECO.recados.maxAtivos) return 'limite';
    R.ativos[id] = { dia: G.dia, ate: G.dia + Recados.prazo() - 1, juntou: 0 };
    return 'ok';
  },
  // (T4b) O prazo em dias (Negócio 2, o Prazo de amigo: 1 dia a mais) e o pagamento (Negócio 3, a placa de propaganda no quintal:
  // +10%; Negócio 8, a Freguesia fiel: mais 10%). O quadro, a pergunta da entrega e o dinheiro leem daqui (e o simulador, o fator).
  prazo() { return ECO.recados.prazo + (typeof Habilidades !== 'undefined' && Habilidades.ganho('prazo_de_amigo') ? ECO.niveis.prazoExtra : 0); },
  temPlaca() { return !!(G.horta && G.horta.colocados && G.horta.colocados.some(c => c.id === 'placa_propaganda')); },
  fatorPaga() { return 1 + (Recados.temPlaca() ? ECO.niveis.placa : 0) + (typeof Habilidades !== 'undefined' && Habilidades.ganho('freguesia_fiel') ? ECO.niveis.freguesia : 0); },
  paga(id) { return Math.round(PEDIDOS_VILA[id].paga * Recados.fatorPaga()); },
  // A coleta: o que entrou na mochila agora (chamado onde o item do chão entra na mochila). Devolve os recados que acabaram de
  // completar a conta.
  contarColeta(item, qtd = 1) {
    const R = G.recados, completos = []; if (!R || !(qtd > 0)) return completos;
    for (const id of Object.keys(R.ativos)) {
      const P = PEDIDOS_VILA[id], a = R.ativos[id];
      if (P.tipo !== 'coleta' || P.item !== item || a.juntou >= P.qtd) continue;
      a.juntou = Math.min(P.qtd, a.juntou + qtd);
      if (a.juntou >= P.qtd) completos.push(id);
    }
    return completos;
  },
  // Quanto falta: na coleta incompleta, o que falta juntar; senão, o que falta na mochila.
  faltam(id, mochila = G.mochila) {
    const P = PEDIDOS_VILA[id], a = G.recados && G.recados.ativos[id]; if (!P) return 0;
    if (a && P.tipo === 'coleta' && a.juntou < P.qtd) return P.qtd - a.juntou;
    return Math.max(0, P.qtd - (mochila ? mochila.total(P.item) : 0));
  },
  // Pode entregar? 'ok', 'nao' (não aceito), 'juntando' (a coleta ainda não juntou tudo) ou 'falta' (falta na mochila).
  podeEntregar(id, mochila = G.mochila) {
    const P = PEDIDOS_VILA[id], a = G.recados && G.recados.ativos[id];
    if (!P || !a) return 'nao';
    if (P.tipo === 'coleta' && a.juntou < P.qtd) return 'juntando';
    if (!mochila || mochila.total(P.item) < P.qtd) return 'falta';
    return 'ok';
  },
  // Entregar direto da mochila (a pilha da mão conta junto): o item sai, o dinheiro entra na hora e a amizade sobe. Não mexe na
  // Fala da Vila nem na carreira (G.empreitas.entregues e a reputação ficam como estão).
  entregar(id, mochila = G.mochila) {
    const r = Recados.podeEntregar(id, mochila); if (r !== 'ok') return r;
    const P = PEDIDOS_VILA[id], R = G.recados;
    let resta = P.qtd - mochila.remover(P.item, P.qtd);
    if (resta > 0 && mochila.mao && mochila.mao.id === P.item) { const t = Math.min(resta, mochila.mao.qtd); mochila.mao.qtd -= t; resta -= t; if (mochila.mao.qtd <= 0) mochila.mao = null; }
    const v = Recados.paga(id); G.dinheiro += v; G.ganhoHoje = (G.ganhoHoje || 0) + v;
    // +50 de amizade com quem pediu (a família não tem número; a Lábia, 50% a mais, vale dentro do Amizade.ganhar)
    if (typeof Amizade !== 'undefined') Amizade.ganhar(P.cliente, 'recado', 'recado');
    delete R.ativos[id]; R.entregues++;
    return 'ok';
  },
  // O prazo em palavras ("até hoje", "até amanhã", "até quinta").
  textoPrazo(ate) {
    if (ate <= G.dia) return 'até hoje';
    if (ate === G.dia + 1) return 'até amanhã';
    return 'até ' + (typeof DIAS !== 'undefined' ? DIAS[(ate - 1) % 7] : 'o dia ' + ((ate - 1) % 28 + 1));
  },
  // O estado: do aceito ("tem 1/3 · até amanhã", "juntou 4/15 · até hoje") ou o rodapé do cartão no quadro ("até amanhã · Cr$ 70 ·
  // tem 1/3"; na coleta, "juntar 15 a partir de agora · Cr$ 90").
  textoEstado(id) {
    const P = PEDIDOS_VILA[id], R = G.recados; if (!P || !R) return '';
    const a = R.ativos[id], tem = G.mochila ? Math.min(P.qtd, G.mochila.total(P.item)) : 0;
    if (a) {
      const prazo = Recados.textoPrazo(a.ate);
      if (P.tipo === 'coleta') return a.juntou < P.qtd ? `juntou ${a.juntou}/${P.qtd} · ${prazo}` : tem < P.qtd ? `juntou ${P.qtd}/${P.qtd}, mas tem ${tem} na mochila · ${prazo}` : `juntou ${P.qtd}/${P.qtd}: é só entregar · ${prazo}`;
      return `tem ${tem}/${P.qtd} · ${prazo}`;
    }
    const prazo = Recados.textoPrazo(G.dia + Recados.prazo() - 1);
    if (P.tipo === 'coleta') return `juntar ${P.qtd} a partir de agora · Cr$ ${Recados.paga(id)}`;
    return `${prazo} · Cr$ ${Recados.paga(id)} · tem ${tem}/${P.qtd}`;
  },
  // A noite: o aceito no último dia do prazo vence (sem multa; na coleta, o que foi juntado fica com o jogador). Devolve
  // [{ id, venceu: true }] para a linha do resumo, na voz da pessoa (P.deixa).
  noite() {
    const R = G.recados, r = []; if (!R) return r;
    for (const id of Object.keys(R.ativos)) if (G.dia >= R.ativos[id].ate) { delete R.ativos[id]; r.push({ id, venceu: true }); }
    return r;
  },
  // A linha do vencido no resumo da noite (revisão da T3: a fala solta não dizia do que era):
  // O recado da Dona Zélia venceu: "Deixa, meu filho, a vizinha arrumou umas couves."
  linhaVencido(id) { const P = PEDIDOS_VILA[id]; return `O recado ${RECADO_ARTIGO[P.cliente] === 'a' ? 'da' : 'do'} ${Recados.nome(P.cliente)} venceu: "${Recados.deixa(id)}"`; },
};
INICIADORES.push(s => Recados.iniciar(s));
COLETORES.push(s => Recados.salvar(s));
