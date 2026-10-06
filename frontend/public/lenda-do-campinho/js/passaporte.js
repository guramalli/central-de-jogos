/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🛂 PASSAPORTE DO CRAQUE — v408 (Raio-X I3, a parte EDUCAÇÃO do Educação Gamer; dono: "vamos começar a onda 2").
   - Em cada lugar (Vila, Praia, Cidade, CT, Estádio, Rio, Santos, as 11 cidades do mundo, Atlântida, a Estação e os
     4 planetas, o Multiverso, Pedraforte, os Picos Nublados, o Vale Celeste e o Vale Jurássico) um personagem que JÁ
     mora ali faz 3 perguntas de múltipla escolha (sorteadas de um banco de 6 a 9 daquele lugar).
     Acertou as 3 → carimbo no Passaporte. Errou → vê a explicação de cada resposta e tenta de novo depois de 1 minuto.
     Com o carimbo, dá para treinar de novo quando quiser (sem prêmio).
   - Conteúdo para 9–12 anos, ligado ao que o jogador vê no lugar: monumentos (placas de monumentos.js), geografia,
     cultura, história do futebol do país; na Europa, as REGRAS e o JOGO LIMPO (impedimento, cartões, vantagem...);
     Atlântida = oceanos; espaço = planetas, gravidade e a Lua; Multiverso = ciência; Pedraforte = rochas e metais;
     Picos Nublados = nuvens e clima; Vale Celeste = meteoros; Jurássico = paleontologia (Dra. Fóssil).
     Sem nomes de clubes, marcas ou jogadores reais (regra do jogo).
   - Recompensa SÓ de reconhecimento (regra do dono: nenhuma fonte nova de poder): tostões pequenos por carimbo,
     títulos por marcos (5, 15 e todos) e, com todos os carimbos, o adorno "Moldura do Viajante" (só visual).
   - Janela do Passaporte: window.abrePassaporte() (a aba 🛂 do Caderno do Craque, caderno.js, usa este nome) com
     passaporteProgresso() e passaporteProximas() para a % e as dicas do Caderno; botão no ☰ Menu e no menu do celular.
   - Missões leves de apresentação (Dona Zuleide, Agência de Turismo da Vila, nível 8 e 20), no padrão
     "📍 Onde achar e como chegar" (como_chegar.js: o bloco aponta quem faz as perguntas).
   - Seu Juca: o quiz de futebol ganha perguntas de regras e jogo limpo.
   Save: s.passaporte = { c: { lugar: data do carimbo }, ate: { lugar: pode tentar de novo a partir de }, tit: [marcos] }
   Prefixo: psp. Carregar NO FIM (depois de ui.js, data.js, como_chegar.js, adornos2.js e de todo arquivo que embrulha abrirNPC).
   ============================================================ */

/* ---------- os lugares e as perguntas ----------
   [pergunta, [resposta certa, errada, errada], explicação] — a ordem das respostas é sorteada na tela */
const PSP_LUGARES = [
  // ===== Brasil =====
  { id: 'vila', mapa: 'vila', npc: 'agente_turismo', nome: 'Vila do Campinho', curto: 'VILA', ic: '🏡', cor: '#2e8b57', grupo: 'brasil', lv: 1, tema: 'O Brasil e os mapas', p: [
    ['Qual é a capital do Brasil?', ['Brasília', 'Rio de Janeiro', 'São Paulo'], 'Brasília virou a capital em 1960. Antes dela, a capital era o Rio de Janeiro.'],
    ['Quantos estados o Brasil tem?', ['26 estados e o Distrito Federal', '20 estados', '30 estados e duas capitais'], 'São 26 estados mais o Distrito Federal, onde fica Brasília. Na bandeira, cada um é uma estrela: são 27 estrelas!'],
    ['O Sol nasce de que lado?', ['Leste', 'Oeste', 'Norte'], 'O Sol nasce no leste e se põe no oeste. Quem sabe disso fica muito mais difícil de se perder!'],
    ['A agulha de uma bússola aponta sempre para...', ['O norte', 'O sul', 'O mar mais perto'], 'A agulha é um ímã e aponta para o norte magnético da Terra. Com ela os viajantes acham o caminho.'],
    ['Qual é a maior floresta tropical do mundo, que fica em boa parte no Brasil?', ['Floresta Amazônica', 'Mata Atlântica', 'Floresta Negra'], 'A Floresta Amazônica é a maior floresta tropical do planeta e tem bichos e plantas que não existem em nenhum outro lugar.'],
    ['O Brasil faz fronteira com quase todos os países da América do Sul. Quais dois ficam de fora?', ['Chile e Equador', 'Argentina e Uruguai', 'Paraguai e Bolívia'], 'O Brasil é tão grande que encosta em quase todo mundo do continente: só o Chile e o Equador não são vizinhos dele.'],
    ['O que está escrito na faixa branca da bandeira do Brasil?', ['Ordem e Progresso', 'Brasil Campeão', 'Paz e Amor'], 'A frase "Ordem e Progresso" fica na faixa branca, em cima do céu azul estrelado.'],
  ] },
  { id: 'praia', mapa: 'praia', npc: 'tata', nome: 'Praia do Futevôlei', curto: 'PRAIA', ic: '🏖️', cor: '#e08a1e', grupo: 'brasil', lv: 5, tema: 'Praia, sol e mar', p: [
    ['Onde foi inventado o futevôlei?', ['No Brasil, nas praias do Rio de Janeiro', 'Na Austrália', 'No Japão'], 'O futevôlei nasceu nas areias de Copacabana, no Rio, nos anos 1960. É futebol misturado com vôlei!'],
    ['No futevôlei, que parte do corpo NÃO pode tocar na bola?', ['As mãos e os braços', 'A cabeça', 'O peito'], 'Vale pé, coxa, peito, ombro e cabeça. Mãos e braços, nunca: igualzinho ao futebol!'],
    ['De quanto em quanto tempo é bom passar protetor solar de novo na praia?', ['A cada 2 horas e depois de sair da água', 'Uma vez por semana', 'Só quando está nublado'], 'O protetor sai com o suor e com a água. Passe de novo a cada 2 horas e depois de cada mergulho.'],
    ['Na praia, o que quer dizer a bandeira vermelha do salva-vidas?', ['Perigo: é melhor não entrar no mar', 'Mar calmo, pode nadar', 'Hora do lanche'], 'A bandeira vermelha avisa que o mar está perigoso ali, com correnteza ou ondas fortes. Escute sempre o salva-vidas!'],
    ['O que mais puxa as marés, fazendo o mar subir e descer?', ['A Lua', 'O vento', 'Os peixes'], 'A gravidade da Lua puxa a água dos oceanos (o Sol ajuda um pouco). Por isso o mar sobe e desce todos os dias.'],
    ['A areia da praia é feita principalmente de quê?', ['Pedacinhos de rocha, como o quartzo', 'Açúcar', 'Sal grosso'], 'As ondas, o vento e a chuva quebram as rochas em grãos bem pequenos durante muito, muito tempo.'],
    ['Em que horário o sol é mais forte e é bom ficar na sombra?', ['Entre 10h e 16h', 'Bem cedinho, às 7h', 'À noite'], 'Do meio da manhã até o meio da tarde o sol queima mais. Nessa hora: sombra, boné, camiseta e água!'],
  ] },
  { id: 'cidade', mapa: 'cidade', npc: 'ginga', nome: 'Cidade', curto: 'CIDADE', ic: '🏙️', cor: '#c0307a', grupo: 'brasil', lv: 17, tema: 'Futsal e a cidade', p: [
    ['Quantos jogadores cada time tem em quadra no futsal, contando o goleiro?', ['5', '7', '11'], 'No futsal são 5 de cada lado: 1 goleiro e 4 na linha. Por isso todo mundo ataca e todo mundo defende!'],
    ['Quando a bola sai pela lateral no futsal, como ela volta para o jogo?', ['Com os pés, com a bola parada na linha', 'Com as mãos, por cima da cabeça', 'O árbitro joga a bola para cima'], 'No futsal o lateral é cobrado com o pé, com a bola parada em cima da linha lateral.'],
    ['Como é a bola de futsal, comparada com a de campo?', ['Um pouco menor e quica bem menos', 'Maior e bem mais leve', 'Quadrada'], 'A bola de futsal quica pouco, então fica mais no chão. Perfeita para tocar rápido na quadra!'],
    ['No futsal, quantas substituições um time pode fazer?', ['Quantas quiser', 'Só 3', 'Nenhuma'], 'No futsal as trocas são ilimitadas: quem sai pode voltar depois, quantas vezes o técnico quiser.'],
    ['Qual é o jeito seguro de atravessar a rua na cidade?', ['Na faixa de pedestres, olhando para os dois lados', 'Correndo entre os carros', 'Saindo de trás de um ônibus parado'], 'Atravesse na faixa, com o sinal verde para pedestres, e olhe para os dois lados antes de ir.'],
    ['O skate virou esporte olímpico pela primeira vez em qual Olimpíada?', ['Tóquio, disputada em 2021', 'Rio 2016', 'Pequim 2008'], 'O skate estreou nas Olimpíadas de Tóquio, que aconteceram em 2021. E o Brasil ganhou medalhas logo na estreia!'],
  ] },
  { id: 'ct', mapa: 'ct', npc: 'aurelio', nome: 'CT das Categorias de Base', curto: 'CT DA BASE', ic: '🏃', cor: '#3a6ad0', grupo: 'brasil', lv: 25, tema: 'Treino e saúde', p: [
    ['Por que fazer aquecimento antes de treinar?', ['Prepara os músculos e ajuda a evitar lesões', 'Para cansar antes do jogo', 'Não serve para nada'], 'O aquecimento esquenta os músculos e acelera o coração aos poucos. O corpo fica pronto e se machuca menos.'],
    ['O que é melhor beber durante o treino?', ['Água', 'Refrigerante', 'Nada, para não pesar'], 'Quando a gente sua, o corpo perde água. Beba água antes, durante e depois do treino, em golinhos.'],
    ['Quantas horas por noite uma criança de 9 a 12 anos precisa dormir?', ['Entre 9 e 12 horas', 'Só 5 horas', 'Umas 15 horas ou mais'], 'Dormindo, o corpo cresce e se recupera do treino, e a cabeça guarda o que você aprendeu. Craque dorme bem!'],
    ['Por que o coração bate mais rápido quando a gente corre?', ['Para levar mais oxigênio aos músculos', 'Porque está com medo', 'Para esfriar o corpo'], 'Os músculos trabalhando precisam de mais oxigênio, e quem leva é o sangue. Então o coração acelera!'],
    ['Qual lanche dá energia boa para treinar?', ['Uma fruta, como banana', 'Um pacote de balas', 'Um copo de refrigerante'], 'Frutas têm energia, vitaminas e fibras. Doce demais dá energia rapidinho, mas ela acaba logo.'],
    ['Em que momento os músculos ficam mais fortes?', ['No descanso, quando o corpo se recupera do treino', 'Só durante o jogo', 'Nunca, músculo não muda'], 'O treino dá o recado e o descanso faz o trabalho: é recuperando que o músculo fica mais forte.'],
  ] },
  { id: 'estadio', mapa: 'estadio', npc: 'dada', nome: 'Estádio Lendário', curto: 'ESTÁDIO', ic: '🏟️', cor: '#b08a10', grupo: 'brasil', lv: 35, tema: 'A história do futebol no Brasil', p: [
    ['Em que anos o Brasil foi a sede da Copa do Mundo masculina?', ['1950 e 2014', '1970 e 2002', '1962 e 1994'], 'O Brasil recebeu a Copa duas vezes: em 1950 e em 2014.'],
    ['Quando o futebol chegou ao Brasil?', ['No fim dos anos 1800', 'Há mil anos', 'Em 1990'], 'Chegou no fim do século 19, trazido por um jovem que tinha estudado na Inglaterra. Ele voltou com bolas e um livro de regras na mala!'],
    ['De 1941 a 1979, uma lei injusta no Brasil proibia quem de jogar futebol?', ['As mulheres', 'As crianças', 'Os goleiros'], 'Era uma regra muito injusta. Hoje o futebol é de todo mundo, e as jogadoras brasileiras estão entre as melhores do mundo!'],
    ['Quem ajuda o árbitro na beira do campo, levantando uma bandeira?', ['O assistente, o "bandeirinha"', 'O gandula', 'O massagista'], 'Os dois assistentes ficam nas laterais e levantam a bandeira para avisar impedimento, lateral, escanteio e faltas.'],
    ['O que faz um bom torcedor no estádio?', ['Canta e apoia o time, sem ofender ninguém', 'Joga coisas no campo', 'Briga com a torcida rival'], 'Torcer é festa! Respeitar o adversário, o árbitro e as outras torcidas também faz parte do jogo limpo.'],
    ['Como se chama quem busca a bola que sai do campo durante o jogo?', ['Gandula', 'Goleiro', 'Capitão'], 'Os gandulas ficam em volta do campo e devolvem a bola rapidinho, para o jogo não ficar parado.'],
    ['De que cor é a camisa principal da Seleção Brasileira desde os anos 1950?', ['Amarela', 'Branca', 'Vermelha'], 'A camisa amarela com detalhes verdes estreou em 1954. Antes disso a seleção jogava de branco.'],
  ] },
  { id: 'rio', mapa: 'rio', npc: 'lider_rio', nome: 'Rio de Janeiro', curto: 'RIO DE JANEIRO', ic: '⛰️', cor: '#1a8a5a', grupo: 'brasil', lv: 112, tema: 'A Cidade Maravilhosa', p: [
    ['Quantos metros tem o Cristo Redentor, contando o pedestal?', ['38 metros', '8 metros', '300 metros'], 'São 30 metros de estátua e 8 de pedestal, no alto do Corcovado. Ele é uma das Sete Maravilhas do Mundo Moderno!'],
    ['Desde quando funciona o bondinho do Pão de Açúcar?', ['1912', '1999', '1800'], 'Foi um dos primeiros bondinhos aéreos do mundo! Ele leva as pessoas até o alto do morro para ver a cidade.'],
    ['Por que a cidade se chama Rio de Janeiro?', ['Os navegadores chegaram em janeiro e acharam que a baía era um rio', 'Porque só chove em janeiro', 'Por causa de um rei chamado Janeiro'], 'Em janeiro de 1502, os portugueses viram a Baía de Guanabara e pensaram que era a boca de um rio. O nome ficou!'],
    ['Até 1960, o Rio de Janeiro era...', ['A capital do Brasil', 'Uma ilha deserta', 'Uma cidade de Portugal'], 'O Rio foi a capital do Brasil por quase 200 anos, até Brasília ser inaugurada, em 1960.'],
    ['O calçadão de Copacabana tem um desenho famoso de pedrinhas pretas e brancas. Que desenho é?', ['Ondas', 'Estrelas', 'Bolas de futebol'], 'As ondas são feitas em calçada portuguesa, com pedrinhas colocadas uma a uma. Elas lembram o mar ali do lado.'],
    ['O Rio recebeu as primeiras Olimpíadas da América do Sul. Em que ano?', ['2016', '2000', '1950'], 'Os Jogos Olímpicos do Rio aconteceram em 2016, com atletas do mundo inteiro.'],
  ] },
  { id: 'santos', mapa: 'santos', npc: 'guia_rei', nome: 'Santos', curto: 'SANTOS', ic: '⚓', cor: '#2a2a2a', grupo: 'brasil', lv: 182, tema: 'O porto, o café e o Rei', p: [
    ['O Porto de Santos é famoso por quê?', ['É o maior porto da América Latina', 'Só recebe barcos de pesca', 'Fica no meio da floresta'], 'Navios do mundo inteiro passam por ali. Por mais de cem anos, o café do Brasil saiu para o mundo por este porto.'],
    ['Por que alguns prédios da orla de Santos são tortos?', ['Foram construídos sobre um chão de argila mole', 'Por causa do vento forte', 'Foram feitos tortos de propósito'], 'Com o peso, o chão de argila afundou mais de um lado. Hoje os prédios novos são feitos com fundações bem mais fundas.'],
    ['O Jardim da Orla de Santos entrou para o livro dos recordes como...', ['O maior jardim de praia do mundo', 'O menor jardim do mundo', 'O jardim mais frio do mundo'], 'São mais de 5 quilômetros de jardim ao longo da praia, com flores, árvores e caminhos.'],
    ['Qual produto fez a Bolsa Oficial do Café de Santos ficar famosa?', ['O café', 'O chocolate', 'O algodão-doce'], 'Na Bolsa do Café, inaugurada em 1922, eram feitos os negócios do café que saía pelo porto. O relógio da torre é famoso!'],
    ['Em 1908 chegou ao Porto de Santos o primeiro navio com imigrantes de qual país?', ['Japão', 'Austrália', 'Canadá'], 'Os imigrantes japoneses chegaram em 1908 e ajudaram a construir o Brasil. Hoje o Brasil tem a maior comunidade japonesa fora do Japão.'],
    ['A estátua dourada da praça homenageia o Rei do Futebol. Quantas Copas do Mundo ele ganhou?', ['3', '1', '5'], 'Ele foi campeão em 1958, 1962 e 1970: o único jogador com três Copas do Mundo. E jogou quase a carreira inteira aqui em Santos!'],
  ] },
  // ===== Pelo mundo =====
  { id: 'cairo', mapa: 'cairo', npc: 'lider_cairo', nome: 'Cairo', curto: 'CAIRO', ic: '🐫', cor: '#c8781e', grupo: 'mundo', lv: 50, tema: 'O Egito antigo e o Nilo', p: [
    ['A Grande Esfinge de Gizé tem corpo de qual animal?', ['Leão', 'Camelo', 'Elefante'], 'Ela tem corpo de leão e cabeça de faraó, e foi esculpida numa rocha só, há uns 4.500 anos.'],
    ['Para que foram construídas as pirâmides de Gizé?', ['Para ser túmulos dos faraós', 'Para guardar trigo', 'Para ver as estrelas de perto'], 'Cada grande pirâmide era o túmulo de um faraó, o rei do Egito antigo. A maior tem mais de 4.500 anos!'],
    ['Qual rio atravessa o Cairo?', ['O rio Nilo', 'O rio Amazonas', 'O rio Tejo'], 'O Nilo é um dos rios mais longos do mundo. Sem ele, o Egito seria quase só deserto.'],
    ['Como se chama a escrita do Egito antigo, feita com desenhos?', ['Hieróglifos', 'Emojis', 'Grafite'], 'Os hieróglifos usavam figuras de pessoas, bichos e objetos. Eram escritos em paredes de pedra e em papiro.'],
    ['O papiro, o "papel" do Egito antigo, era feito de quê?', ['De uma planta da beira do Nilo', 'De areia do deserto', 'De pelo de camelo'], 'Os egípcios cortavam o caule da planta em tiras, cruzavam umas sobre as outras e prensavam até virar uma folha.'],
    ['O Egito fica em qual continente?', ['África', 'Europa', 'América do Sul'], 'O Egito fica no nordeste da África. Uma pontinha dele, a península do Sinai, já fica na Ásia!'],
    ['Qual país é o maior campeão da Copa Africana de Nações de futebol?', ['Egito', 'Brasil', 'Japão'], 'O Egito é a seleção que mais vezes ganhou o torneio das seleções da África.'],
  ] },
  { id: 'doha', mapa: 'doha', npc: 'lider_doha', nome: 'Doha', curto: 'DOHA', ic: '🏜️', cor: '#8a1a4a', grupo: 'mundo', lv: 62, tema: 'O deserto e o mar do Catar', p: [
    ['A Copa do Mundo de 2022, no Catar, foi a primeira...', ['Num país do mundo árabe', 'Na América do Sul', 'Jogada na neve'], 'Foi a primeira Copa no mundo árabe. E foi em novembro e dezembro, quando lá faz menos calor.'],
    ['O Catar é uma península. O que isso quer dizer?', ['É cercado de água por três lados', 'Fica no alto de uma montanha', 'Fica embaixo da terra'], 'Península é uma terra cercada de água por três lados e ligada ao continente por um lado só.'],
    ['Antes do petróleo, muita gente no Catar vivia de quê?', ['Mergulhar atrás de pérolas e pescar', 'Plantar café', 'Caçar pinguins'], 'Os mergulhadores desciam fundo, sem equipamento, para buscar ostras com pérolas. Era um trabalho muito difícil!'],
    ['Que ave participa de uma tradição antiga do deserto, a falcoaria?', ['O falcão', 'O pinguim', 'O papagaio'], 'Os falcões são treinados para voar e voltar para o braço do falcoeiro. São aves rapidíssimas!'],
    ['Onde fica o Museu de Arte Islâmica de Doha?', ['Numa ilha artificial, na baía', 'Debaixo da areia', 'No alto de uma duna'], 'O museu foi construído numa ilha feita pelas pessoas e guarda obras de arte de mais de mil anos.'],
    ['O que forma as dunas do deserto?', ['O vento, que empurra a areia', 'A chuva forte', 'Os camelos cavando'], 'O vento leva os grãos de areia e vai formando montes. Por isso as dunas mudam de forma e até "andam" devagarinho.'],
  ] },
  { id: 'toquio', mapa: 'toquio', npc: 'lider_toquio', nome: 'Tóquio', curto: 'TÓQUIO', ic: '🗼', cor: '#d0302a', grupo: 'mundo', lv: 74, tema: 'O Japão', p: [
    ['Por que a Torre de Tóquio é pintada de laranja e branco?', ['Para os aviões enxergarem bem', 'Porque são as cores de um time', 'Para esquentar no inverno'], 'Construções muito altas usam cores fortes para os pilotos verem de longe. Ela tem 333 metros!'],
    ['O Monte Fuji, a montanha mais alta do Japão, é...', ['Um vulcão', 'Uma montanha de gelo', 'Um prédio gigante'], 'O Fuji é um vulcão de 3.776 metros. Faz mais de 300 anos que ele não entra em erupção.'],
    ['Em que estação as cerejeiras florescem no Japão?', ['Primavera', 'Inverno', 'Só à noite'], 'Na primavera as árvores ficam cobertas de flores cor-de-rosa e as famílias fazem piquenique embaixo delas: é o hanami!'],
    ['O Japão é formado por...', ['Milhares de ilhas', 'Uma ilha só', 'Um grande deserto'], 'O Japão tem milhares de ilhas, mas quase todo mundo mora nas quatro maiores.'],
    ['Qual país tem a maior comunidade japonesa fora do Japão?', ['Brasil', 'Austrália', 'Egito'], 'Os primeiros imigrantes japoneses chegaram ao Brasil em 1908, pelo Porto de Santos. Hoje são milhões de descendentes!'],
    ['Em 2002, o Japão organizou uma Copa do Mundo junto com qual país?', ['Coreia do Sul', 'China', 'Brasil'], 'Foi a primeira Copa na Ásia e a primeira com dois países-sede. E o Brasil foi pentacampeão nela!'],
    ['Como as pessoas costumam se cumprimentar no Japão?', ['Com uma reverência, inclinando o corpo', 'Batendo palmas três vezes', 'Dando um pulo'], 'A reverência mostra respeito. No dojo do Mestre Kenji, todo treino começa e termina assim.'],
  ] },
  { id: 'miami', mapa: 'miami', npc: 'lider_miami', nome: 'Miami', curto: 'MIAMI', ic: '🌴', cor: '#e0508a', grupo: 'mundo', lv: 86, tema: 'A Flórida e o mar', p: [
    ['Miami fica em qual país?', ['Estados Unidos', 'México', 'Canadá'], 'Miami fica na Flórida, no sudeste dos Estados Unidos, na beira do oceano Atlântico.'],
    ['Os Everglades, perto de Miami, são o único lugar do mundo onde vivem juntos...', ['Jacarés e crocodilos', 'Leões e tigres', 'Pinguins e ursos-polares'], 'É um pântano enorme e protegido. Lá os jacarés e os crocodilos dividem a mesma água!'],
    ['Os prédios coloridos da Ocean Drive seguem qual estilo?', ['Art Déco', 'Pirâmide egípcia', 'Castelo medieval'], 'O Art Déco tem formas retas, curvas suaves e cores alegres. Miami tem centenas de prédios assim!'],
    ['Por que a Torre da Liberdade, em Miami, é famosa?', ['Recebeu milhares de pessoas que chegaram para começar uma vida nova', 'É a torre mais alta do mundo', 'É feita de chocolate'], 'Ali, pessoas que chegavam de outro país eram recebidas e ajudadas. Por isso ela é um símbolo de acolhida.'],
    ['A Copa do Mundo de 2026 foi organizada por quais países?', ['Estados Unidos, Canadá e México', 'Só a Inglaterra', 'Brasil e Argentina'], 'Foi a primeira Copa com três países-sede e com 48 seleções!'],
    ['O que é um furacão?', ['Uma tempestade gigante que gira, com ventos muito fortes', 'Um vulcão no mar', 'Uma onda de calor'], 'Os furacões se formam sobre o mar quente. Em Miami, as pessoas acompanham a previsão do tempo e sabem como ficar seguras.'],
  ] },
  { id: 'buenos', mapa: 'buenos', npc: 'lider_buenos', nome: 'Buenos Aires', curto: 'BUENOS AIRES', ic: '💃', cor: '#3a8ad8', grupo: 'mundo', lv: 100, tema: 'A Argentina', p: [
    ['O Obelisco de Buenos Aires fica numa avenida famosa por ser...', ['Uma das mais largas do mundo', 'A mais curta do mundo', 'Feita de água'], 'A Avenida 9 de Julho é larguíssima. O Obelisco, no meio dela, tem 67 metros.'],
    ['Que dança nasceu na região do Rio da Prata, onde fica Buenos Aires?', ['O tango', 'O samba', 'O frevo'], 'O tango nasceu nos bairros perto do porto, no fim dos anos 1800, e hoje é dançado no mundo inteiro.'],
    ['Como são as casinhas do bairro de La Boca?', ['Pintadas de muitas cores', 'Todas brancas', 'Feitas de gelo'], 'Conta-se que os moradores pintavam as casas com as sobras de tinta dos barcos do porto. Por isso cada parede tem uma cor!'],
    ['A Argentina foi campeã da Copa do Mundo de 2022. Em que país foi essa Copa?', ['Catar', 'Brasil', 'Japão'], 'A Copa de 2022 foi no Catar, e a Argentina venceu a final nos pênaltis.'],
    ['O que aparece no meio da bandeira da Argentina?', ['Um sol com rosto', 'Uma estrela vermelha', 'Uma bola'], 'É o Sol de Maio, um símbolo da independência do país.'],
    ['O mate, bebida típica da Argentina, também é tomado em qual região do Brasil?', ['No Sul, onde se chama chimarrão', 'Só no Amazonas', 'Em nenhum lugar do Brasil'], 'O mate é feito com erva-mate e água quente, numa cuia. No Rio Grande do Sul ele é o famoso chimarrão.'],
  ] },
  { id: 'lisboa', mapa: 'lisboa', npc: 'lider_lisboa', nome: 'Lisboa', curto: 'LISBOA', ic: '🚋', cor: '#d0a020', grupo: 'mundo', lv: 124, tema: 'Portugal e as regras do jogo', p: [
    ['Para que servia a Torre de Belém?', ['Proteger a entrada de Lisboa pelo rio Tejo', 'Guardar os sinos da cidade', 'Ser um farol para aviões'], 'Ela vigiava os barcos que entravam pelo rio. Dali partiam as caravelas das Grandes Navegações!'],
    ['A frota que chegou ao Brasil em 1500 saiu de qual cidade?', ['Lisboa', 'Paris', 'Londres'], 'Os navios portugueses partiram de Lisboa e chegaram ao litoral da Bahia em abril de 1500.'],
    ['Que doce famoso nasceu no bairro de Belém, em Lisboa?', ['O pastel de nata', 'O brigadeiro', 'O churro'], 'O pastel de nata é uma tortinha de massa folhada com creme. A receita veio dos monges de um mosteiro de Belém.'],
    ['Por que os bondinhos amarelos de Lisboa vivem subindo e descendo ladeiras?', ['A cidade fica em cima de várias colinas', 'A cidade é toda plana', 'Os trilhos são tortos de propósito'], 'Lisboa é chamada de cidade das sete colinas. Os bondes, que lá se chamam elétricos, ajudam a subir!'],
    ['No arremesso lateral, o que é obrigatório?', ['Usar as duas mãos, com a bola passando por trás e por cima da cabeça', 'Usar uma mão só', 'Chutar a bola'], 'E os dois pés precisam ficar no chão, em cima da linha ou do lado de fora. Feito errado, o lateral passa para o outro time.'],
    ['Um atacante pode estar impedido no campo de defesa do próprio time?', ['Não, só no campo do adversário', 'Sim, em qualquer lugar', 'Só no escanteio'], 'Quem está na metade do campo do próprio time nunca está em posição de impedimento.'],
  ] },
  { id: 'paris', mapa: 'paris', npc: 'lider_paris', nome: 'Paris', curto: 'PARIS', ic: '🗼', cor: '#4a5ad0', grupo: 'mundo', lv: 136, tema: 'A França e o jogo limpo', p: [
    ['Por que a Torre Eiffel fica uns centímetros mais alta no verão?', ['O calor faz o ferro dilatar (esticar)', 'Ela é regada como uma planta', 'Colocam um chapéu nela'], 'Com o calor, o metal se expande. A torre, de 1889, pode crescer cerca de 15 centímetros!'],
    ['Qual pintura famosa fica no Museu do Louvre?', ['A Mona Lisa', 'O Abaporu', 'O Grito'], 'O Louvre é um dos maiores museus de arte do mundo, e a Mona Lisa é a obra mais visitada de lá.'],
    ['Quantas avenidas saem da praça do Arco do Triunfo?', ['12', '2', '100'], 'As 12 avenidas formam uma estrela em volta do arco. Por isso o lugar é chamado de Praça da Estrela!'],
    ['A Catedral de Notre-Dame fica onde?', ['Numa ilha no meio do rio Sena', 'No alto da Torre Eiffel', 'Embaixo da terra'], 'Ela fica numa ilha no centro de Paris e tem gárgulas de pedra nos telhados.'],
    ['Em que cidade foi fundada, em 1904, a entidade que organiza a Copa do Mundo?', ['Paris', 'Rio de Janeiro', 'Tóquio'], 'A entidade que cuida do futebol no mundo inteiro nasceu em Paris, em 1904, com sete países.'],
    ['Um adversário caiu machucado e o time dele chutou a bola para fora. O que é jogo limpo na volta?', ['Devolver a bola para o time que parou o jogo', 'Aproveitar e atacar rápido', 'Esconder a bola'], 'Não está escrito na regra, mas é um costume de jogo limpo: quem parou o jogo para ajudar recebe a bola de volta.'],
    ['O que é a "lei da vantagem"?', ['O árbitro deixa o jogo seguir se parar fosse pior para quem sofreu a falta', 'Quem chega primeiro na bola ganha', 'O time da casa joga com um a mais'], 'Se o time que sofreu a falta continua num bom ataque, o árbitro estica os braços para a frente e manda seguir!'],
  ] },
  { id: 'munique', mapa: 'munique', npc: 'lider_munique', nome: 'Munique', curto: 'MUNIQUE', ic: '🥨', cor: '#2a7ad8', grupo: 'mundo', lv: 148, tema: 'A Alemanha e as saídas de bola', p: [
    ['O que acontece no relógio da torre da Prefeitura Nova de Munique?', ['Bonecos dançam e giram ao som dos sinos', 'Sai água como de uma fonte', 'Ele anda para trás'], 'É o Glockenspiel: um relógio com sinos e bonecos grandes que fazem um show lá no alto da torre.'],
    ['A final da Copa do Mundo de 1974 foi jogada em qual cidade?', ['Munique', 'Rio de Janeiro', 'Tóquio'], 'A Alemanha ganhou aquela Copa em casa, com a final aqui em Munique.'],
    ['Munique é a capital de qual região da Alemanha?', ['Baviera', 'Patagônia', 'Sibéria'], 'A Baviera fica no sul da Alemanha, perto dos Alpes. O pretzel, um pão em forma de laço, é muito famoso por lá.'],
    ['Munique fica perto de quais montanhas famosas?', ['Os Alpes', 'Os Andes', 'O Himalaia'], 'Em dia claro, dos lugares altos da cidade dá para ver os picos dos Alpes no horizonte.'],
    ['A bola saiu pela linha de fundo e quem tocou por último foi um DEFENSOR. O que o árbitro marca?', ['Escanteio', 'Tiro de meta', 'Pênalti'], 'Defensor tocou por último e a bola saiu pela linha de fundo, fora do gol? Escanteio para o ataque!'],
    ['E se a bola sai pela linha de fundo depois de um toque do ATACANTE?', ['Tiro de meta', 'Escanteio', 'Lateral'], 'Aí a bola volta para o time que defende, com o tiro de meta cobrado de dentro da pequena área.'],
    ['Dá para fazer gol direto de escanteio?', ['Sim, é o gol olímpico', 'Não, nunca', 'Só com a mão'], 'O gol direto de escanteio vale e tem até nome especial: gol olímpico!'],
  ] },
  { id: 'milao', mapa: 'milao', npc: 'lider_milao', nome: 'Milão', curto: 'MILÃO', ic: '⛪', cor: '#2a9a5a', grupo: 'mundo', lv: 156, tema: 'A Itália e as regras do gol', p: [
    ['Quanto tempo levou para o Duomo de Milão ficar pronto?', ['Quase 600 anos', 'Duas semanas', 'Dez anos'], 'A construção começou em 1386 e foi terminando aos poucos. A catedral tem mais de 3.400 estátuas!'],
    ['O mapa da Itália tem um formato famoso. Parece o quê?', ['Uma bota', 'Uma bola', 'Um peixe'], 'A Itália parece uma bota de cano alto. E, na ponta, ela parece chutar uma bola: a ilha da Sicília!'],
    ['Milão é famosa no mundo todo por ser uma capital de quê?', ['Da moda', 'Do gelo', 'Dos dinossauros'], 'Em Milão acontecem grandes desfiles e trabalham estilistas do mundo inteiro.'],
    ['Em que ano a Itália foi campeã da Copa do Mundo jogada na Alemanha?', ['2006', '1950', '2014'], 'A Itália venceu a Copa de 2006, na Alemanha, numa final decidida nos pênaltis.'],
    ['O goleiro pode pegar com as mãos uma bola que o companheiro chutou de propósito para ele?', ['Não, aí ele joga com os pés', 'Sim, sempre', 'Só no segundo tempo'], 'É a regra do recuo, criada em 1992 para o jogo não ficar parado. Se pegar com a mão, é tiro livre indireto para o adversário.'],
    ['Quando um gol vale?', ['Quando a bola inteira passa da linha do gol', 'Quando metade da bola passa', 'Quando a bola encosta na trave'], 'Se um pedacinho da bola ainda estiver em cima da linha, não é gol. Tem que passar inteira!'],
    ['Como o árbitro mostra que um tiro livre é indireto?', ['Levantando um braço', 'Apitando três vezes', 'Sentando no chão'], 'No tiro livre indireto, a bola precisa tocar em outro jogador antes de entrar no gol. O braço levantado avisa isso.'],
  ] },
  { id: 'madri', mapa: 'madri', npc: 'lider_madri', nome: 'Madri', curto: 'MADRI', ic: '💃', cor: '#c8302a', grupo: 'mundo', lv: 162, tema: 'A Espanha e os cartões', p: [
    ['O que era a Puerta de Alcalá, em Madri?', ['Um dos portões de entrada da cidade', 'Um estádio', 'Uma fábrica de churros'], 'Ela tem mais de 240 anos. Antigamente, quem chegava a Madri por aquele lado passava por esse portão.'],
    ['Onde fica Madri dentro da Espanha?', ['Bem no centro do país', 'Numa ilha', 'Na fronteira com o Brasil'], 'Madri fica no meio da Espanha. Na praça Puerta del Sol tem a placa do "quilômetro zero", de onde se contam as estradas do país.'],
    ['Em que ano a seleção masculina da Espanha ganhou a sua primeira Copa do Mundo?', ['2010', '1950', '1994'], 'A Espanha foi campeã em 2010, na África do Sul, com um futebol de muitos passes curtos.'],
    ['O flamenco, música e dança cheia de palmas e sapateado, vem de qual região da Espanha?', ['Do sul, da Andaluzia', 'Do Polo Norte', 'De uma ilha do Pacífico'], 'O flamenco nasceu na Andaluzia, no sul da Espanha, e hoje é dançado no país inteiro.'],
    ['O que acontece com o jogador que leva dois cartões amarelos no mesmo jogo?', ['Recebe o vermelho e sai do jogo', 'Ganha um prêmio', 'Nada, pode continuar'], 'Dois amarelos viram um vermelho. O jogador sai e o time fica com um a menos.'],
    ['Quando um jogador é expulso, o time pode colocar outro no lugar dele?', ['Não, o time fica com um jogador a menos', 'Sim, na hora', 'Só se o técnico pedir com educação'], 'Essa é a "punição" do cartão vermelho: o time inteiro joga com menos gente até o fim.'],
    ['Um atacante exatamente na mesma linha do penúltimo defensor está impedido?', ['Não, na mesma linha pode', 'Sim, sempre', 'Só se for o goleiro'], 'Para estar impedido, ele precisa estar mais perto do gol do que a bola e do que o penúltimo adversário. Empatado na linha, pode!'],
  ] },
  { id: 'londres', mapa: 'londres', npc: 'lider_londres', nome: 'Londres', curto: 'LONDRES', ic: '💂', cor: '#b0202a', grupo: 'mundo', lv: 176, tema: 'A Inglaterra, berço das regras', p: [
    ['O nome "Big Ben" é, na verdade, de quê?', ['Do sino gigante dentro da torre', 'De um rei', 'Do relógio de pulso de um guarda'], 'Big Ben é o sino de mais de 13 toneladas. A torre do relógio hoje se chama Torre Elizabeth.'],
    ['Em que cidade foram escritas, em 1863, as primeiras regras do futebol moderno?', ['Londres', 'Rio de Janeiro', 'Cairo'], 'Em 1863, clubes ingleses se reuniram em Londres e combinaram regras iguais para todos. Nascia o futebol como a gente conhece!'],
    ['Em que ano a Inglaterra ganhou a Copa do Mundo jogando em casa?', ['1966', '2002', '1930'], 'A Copa de 1966 foi na Inglaterra, e a final foi jogada aqui em Londres.'],
    ['De que cor são os famosos ônibus de dois andares de Londres?', ['Vermelhos', 'Verdes', 'Roxos'], 'Os ônibus vermelhos de dois andares são um símbolo da cidade, assim como as cabines de telefone vermelhas.'],
    ['Qual rio atravessa Londres?', ['O Tâmisa', 'O Nilo', 'O Amazonas'], 'O rio Tâmisa corta a cidade, e a torre do Big Ben fica bem na beira dele.'],
    ['Qual é o número mínimo de jogadores que um time precisa ter em campo para o jogo continuar?', ['7', '3', '11'], 'Se um time ficar com menos de 7 jogadores, o jogo não pode continuar.'],
    ['O que é o VAR?', ['Árbitros de vídeo que ajudam a rever lances importantes', 'Um tipo de chuteira', 'Um drible famoso'], 'O VAR ajuda em gols, pênaltis e cartões vermelhos. Numa Copa do Mundo, ele estreou em 2018.'],
  ] },
  // ===== Mar e espaço =====
  { id: 'atlantida', mapa: 'atlantida', npc: 'lider_atl', nome: 'Atlântida', curto: 'ATLÂNTIDA', ic: '🐙', cor: '#1aa0b0', grupo: 'mar', lv: 196, tema: 'Oceanos e vida marinha', p: [
    ['Quanto da superfície da Terra é coberta pelos oceanos?', ['Mais ou menos 70%', 'Só 10%', 'Nada, é tudo terra'], 'Os oceanos cobrem cerca de 71% do planeta. Por isso a Terra parece azul vista do espaço!'],
    ['Qual é o maior oceano do mundo?', ['Pacífico', 'Atlântico', 'Índico'], 'O Pacífico é tão grande que todos os continentes juntos caberiam dentro dele.'],
    ['As baleias são peixes?', ['Não, são mamíferos e respiram ar', 'Sim, são peixes gigantes', 'São dinossauros'], 'As baleias sobem para respirar por um buraquinho no alto da cabeça, e os filhotes mamam leite da mãe.'],
    ['Quantos corações tem um polvo?', ['3', '1', '8'], 'O polvo tem 3 corações e sangue azul. E ainda tem 8 braços cheios de ventosas!'],
    ['Os corais são...', ['Animais minúsculos que vivem em colônias', 'Pedras coloridas', 'Plantas de plástico'], 'Cada coral é feito de milhares de bichinhos chamados pólipos. Os recifes de coral são a casa de muitos peixes.'],
    ['No cavalo-marinho, quem carrega os ovos até os filhotes nascerem?', ['O pai', 'A mãe', 'A tia polvo'], 'A mãe coloca os ovos numa bolsinha na barriga do pai, e é ele que cuida deles até os filhotes nascerem!'],
    ['O esqueleto do tubarão é feito de quê?', ['De cartilagem, como a ponta do nariz', 'De ossos bem duros', 'De madeira'], 'O tubarão não tem ossos: o esqueleto é de cartilagem, mais leve e flexível. Aperte a ponta do seu nariz: isso é cartilagem!'],
    ['Qual é o lugar mais fundo dos oceanos?', ['A Fossa das Marianas', 'O lago do parque', 'A Baía de Guanabara'], 'Ela tem quase 11 quilômetros de fundura: o Monte Everest inteiro caberia lá dentro!'],
    ['Por que não se deve jogar sacola plástica no mar?', ['As tartarugas podem confundir com águas-vivas e engolir', 'Porque a sacola afunda os navios', 'Porque deixa o mar doce'], 'As tartarugas marinhas comem águas-vivas, e uma sacola boiando parece muito com uma. Lixo no lixo!'],
  ] },
  { id: 'estacao', mapa: 'estacao', npc: 'lider_esp', nome: 'Estação Espacial', curto: 'ESTAÇÃO ESPACIAL', ic: '🛰️', cor: '#3a4ab0', grupo: 'mar', lv: 298, tema: 'O Sistema Solar', p: [
    ['Quantos planetas tem o Sistema Solar?', ['8', '12', '3'], 'Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano e Netuno. Plutão hoje é chamado de planeta-anão.'],
    ['O Sol é um...', ['Estrela', 'Planeta', 'Cometa'], 'O Sol é a estrela mais perto da Terra. Ele é tão grande que caberia mais de um milhão de Terras dentro dele!'],
    ['Quanto tempo a luz do Sol leva para chegar até a Terra?', ['Uns 8 minutos', '1 segundo', '1 ano'], 'A luz é a coisa mais rápida que existe, mas o Sol está tão longe que ela leva uns 8 minutos para chegar aqui.'],
    ['Por que os astronautas flutuam dentro de uma estação espacial?', ['A estação vive "caindo" em volta da Terra, e eles caem junto', 'Porque lá não existe nenhuma gravidade', 'Porque eles são muito leves'], 'A gravidade da Terra ainda puxa a estação, mas ela anda tão rápido que vai caindo em volta do planeta sem nunca chegar ao chão. Quem está dentro cai junto e flutua!'],
    ['A Estação Espacial Internacional dá uma volta na Terra em mais ou menos...', ['1 hora e meia', '1 ano', '1 semana'], 'Ela voa a uns 28 mil quilômetros por hora. Os astronautas veem o Sol nascer cerca de 16 vezes por dia!'],
    ['A Terra é o planeta número quanto, contando a partir do Sol?', ['3º', '1º', '8º'], 'Primeiro vem Mercúrio, depois Vênus e então a Terra: nem perto demais, nem longe demais. O lugar certo para ter água líquida!'],
  ] },
  { id: 'lua', mapa: 'lua', npc: 'lider_lua', nome: 'Lua', curto: 'LUA', ic: '🌙', cor: '#6a6a7a', grupo: 'mar', lv: 300, tema: 'A Lua e a gravidade', p: [
    ['Na Lua, quanto você pesaria?', ['Umas 6 vezes menos', 'O mesmo que na Terra', 'O dobro'], 'A gravidade da Lua é cerca de 1/6 da gravidade da Terra. Um pulo seu lá iria muito mais alto!'],
    ['A Lua tem luz própria?', ['Não, ela reflete a luz do Sol', 'Sim, ela é uma lâmpada gigante', 'Só na lua cheia'], 'A Lua brilha porque o Sol ilumina ela. As fases mudam conforme a parte iluminada que a gente consegue ver daqui.'],
    ['Em que ano pessoas pisaram na Lua pela primeira vez?', ['1969', '1500', '2010'], 'Em julho de 1969 dois astronautas caminharam na Lua, pertinho daqui: no Mar da Tranquilidade!'],
    ['Por que as pegadas deixadas na Lua podem durar milhões de anos?', ['Lá não tem vento nem chuva para apagar', 'Foram coladas com cola', 'A Lua é feita de cimento'], 'A Lua quase não tem ar, então não tem vento nem chuva. As pegadas ficam lá, paradinhas.'],
    ['Os "mares" da Lua, como o Mar da Tranquilidade, têm água?', ['Não, são planícies de lava antiga que endureceu', 'Sim, cheios de peixes', 'Só quando chove'], 'Antigamente achavam que as manchas escuras eram mares. Na verdade são planícies de lava que esfriou há bilhões de anos.'],
    ['Por que a gente sempre vê o mesmo lado da Lua?', ['Ela gira em volta de si no mesmo tempo que leva para dar a volta na Terra', 'Porque a Lua não gira', 'Porque o outro lado é invisível'], 'A Lua leva uns 27 dias para girar e também para dar a volta na Terra. Por isso mostra sempre a mesma "cara" para nós.'],
    ['Se você gritasse na Lua, sem rádio, alguém ouviria?', ['Não, sem ar o som não viaja', 'Sim, bem mais alto', 'Só se fosse de dia'], 'O som precisa de ar (ou de água) para viajar. Por isso os astronautas conversam pelo rádio do capacete.'],
  ] },
  { id: 'marte', mapa: 'marte', npc: 'lider_marte', nome: 'Marte', curto: 'MARTE', ic: '🔴', cor: '#c0482a', grupo: 'mar', lv: 325, tema: 'O Planeta Vermelho', p: [
    ['Por que Marte é vermelho?', ['O chão tem muito ferro enferrujado', 'Está pegando fogo', 'Alguém pintou'], 'A poeira de Marte tem óxido de ferro, o mesmo da ferrugem. Por isso ele é chamado de Planeta Vermelho.'],
    ['Quantas luas Marte tem?', ['2', 'Nenhuma', '20'], 'São duas luas pequenas e com formato de batata: Fobos e Deimos.'],
    ['Qual é o maior vulcão conhecido do Sistema Solar, que fica em Marte?', ['Monte Olimpo', 'Monte Fuji', 'Pão de Açúcar'], 'O Monte Olimpo tem mais de 20 quilômetros de altura: mais que o dobro do Monte Everest!'],
    ['Quanto dura um dia em Marte?', ['Um pouco mais que um dia da Terra', 'Uma hora', 'Um ano inteiro'], 'O dia de Marte tem cerca de 24 horas e 40 minutos. Bem parecido com o nosso!'],
    ['Quem está explorando Marte hoje em dia?', ['Jipes-robôs com rodas', 'Turistas de férias', 'Ninguém nunca mandou nada para lá'], 'Vários jipes-robôs já andaram por Marte tirando fotos e estudando as rochas. Pessoas ainda não foram... quem sabe você?'],
    ['Marte tem gelo?', ['Sim, nos polos e embaixo do chão', 'Não, lá é só fogo', 'Só nas luas dele'], 'Marte tem calotas de gelo nos polos, como a Terra, e também gelo escondido debaixo do solo.'],
    ['Marte é o planeta número quanto, contando a partir do Sol?', ['4º', '2º', '7º'], 'Marte vem logo depois da Terra. Ele é menor que a Terra e muito mais frio.'],
  ] },
  { id: 'saturno', mapa: 'saturno', npc: 'lider_saturno', nome: 'Saturno', curto: 'SATURNO', ic: '🪐', cor: '#b08a3a', grupo: 'mar', lv: 350, tema: 'Os anéis e os gigantes', p: [
    ['Do que são feitos os anéis de Saturno?', ['De pedaços de gelo e rocha', 'De ouro maciço', 'De fumaça colorida'], 'Os anéis são bilhões de pedaços de gelo e rocha, do tamanho de grãos de areia até casas, girando em volta do planeta.'],
    ['Saturno é um planeta de que tipo?', ['Gigante gasoso', 'De pedra, como a Terra', 'Uma estrela'], 'Saturno é feito quase todo de gás. Não tem um chão firme para pousar!'],
    ['Qual é o maior planeta do Sistema Solar?', ['Júpiter', 'Saturno', 'Terra'], 'Saturno é o segundo maior. O primeiro é Júpiter, o vizinho dele.'],
    ['Se existisse uma banheira gigante do tamanho certo, Saturno...', ['Boiaria, porque é menos denso que a água', 'Afundaria na hora', 'Derreteria'], 'Saturno é enorme, mas muito "fofo": é tão pouco denso que boiaria numa banheira gigante!'],
    ['Qual é a maior lua de Saturno, que tem lagos de metano?', ['Titã', 'Fobos', 'A nossa Lua'], 'Titã tem um ar bem grosso e lagos de metano líquido, não de água. É a segunda maior lua do Sistema Solar.'],
    ['Quanto tempo Saturno leva para dar uma volta no Sol?', ['Quase 30 anos da Terra', '1 dia', '1 mês'], 'Saturno está tão longe que leva uns 29 anos e meio para dar a volta. Um "ano" lá é muito comprido!'],
    ['Quantas luas tem Saturno?', ['Mais de 100', 'Nenhuma', 'Só 1'], 'Os astrônomos já descobriram mais de 100 luas em volta de Saturno, e ainda acham novas!'],
  ] },
  { id: 'nebulosa', mapa: 'nebulosa', npc: 'lider_nebulosa', nome: 'Nebulosa de Órion', curto: 'NEBULOSA DE ÓRION', ic: '🌌', cor: '#7a3ac0', grupo: 'mar', lv: 375, tema: 'As estrelas', p: [
    ['O que é uma nebulosa?', ['Uma nuvem de gás e poeira onde nascem estrelas', 'Um planeta de algodão', 'Um buraco no céu'], 'Nas nebulosas, a gravidade junta gás e poeira até formar estrelas novas. A Nebulosa de Órion é um berçário de estrelas!'],
    ['As "Três Marias", que a gente vê no céu do Brasil, fazem parte de qual constelação?', ['Órion', 'Cruzeiro do Sul', 'Ursa Maior'], 'As Três Marias são o cinturão do caçador Órion. Pertinho delas fica a Nebulosa de Órion, que dá para ver até sem telescópio!'],
    ['Um ano-luz mede o quê?', ['Distância', 'Tempo', 'Peso'], 'Ano-luz é a distância que a luz percorre em um ano: quase 10 trilhões de quilômetros!'],
    ['Qual é a estrela mais perto da Terra?', ['O Sol', 'A Estrela Dalva', 'A Lua'], 'O Sol é uma estrela! (A Estrela Dalva, na verdade, é o planeta Vênus.) Depois do Sol, a estrela mais perto fica a uns 4 anos-luz.'],
    ['O que a cor de uma estrela mostra?', ['A temperatura dela', 'A idade do planeta mais perto', 'O humor dela'], 'Estrelas azuladas são as mais quentes; as avermelhadas são mais "frias" (mesmo assim, quentíssimas!).'],
    ['Por que as estrelas parecem piscar?', ['O ar da Terra, que se mexe, entorta a luz delas', 'Elas acendem e apagam', 'Alguém mexe num interruptor'], 'A luz atravessa camadas de ar quente e frio que se mexem, e parece tremer. Vistas do espaço, as estrelas não piscam!'],
  ] },
  // ===== Multiverso, vales e Jurássico =====
  { id: 'multiverso', mapa: 'multiverso', npc: 'guardiao_mv', nome: 'Multiverso', curto: 'MULTIVERSO', ic: '🌀', cor: '#5a3ad8', grupo: 'mv', lv: 400, tema: 'Curiosidades de ciência', p: [
    ['O que é mais quente?', ['Um raio', 'A superfície do Sol', 'Uma fogueira'], 'Um raio pode chegar a uns 30.000 °C, umas cinco vezes mais quente que a superfície do Sol!'],
    ['Quantos ossos tem o corpo de um adulto?', ['206', '50', '1.000'], 'Os bebês nascem com uns 300 ossinhos. Alguns vão se juntando enquanto a gente cresce, até ficarem 206.'],
    ['O que as plantas soltam no ar quando fazem fotossíntese?', ['Oxigênio', 'Fumaça', 'Purpurina'], 'Com luz do sol, água e gás carbônico, as plantas fazem o próprio alimento e soltam o oxigênio que a gente respira.'],
    ['Em que temperatura a água ferve, na beira do mar?', ['100 °C', '0 °C', '37 °C'], 'A água ferve a 100 °C e congela a 0 °C. No alto das montanhas, ela ferve com menos calor!'],
    ['O que é mais rápido: a luz ou o som?', ['A luz', 'O som', 'Os dois são iguais'], 'Por isso a gente vê o relâmpago antes de ouvir o trovão. A luz é a coisa mais rápida do universo.'],
    ['Um ímã atrai qual destes objetos?', ['Um prego de ferro', 'Uma borracha', 'Uma folha de papel'], 'Ímãs atraem materiais como o ferro. Plástico, papel e madeira, não.'],
    ['O que acontece com a água quando ela congela?', ['Ela ocupa mais espaço', 'Ela some', 'Ela encolhe e afunda'], 'O gelo ocupa mais espaço que a água líquida. Por isso o gelo boia, e uma garrafa cheia pode estourar no congelador!'],
  ] },
  { id: 'pedraforte', mapa: 'pedraforte', npc: 'rei_barbaferro', nome: 'Pedraforte', curto: 'PEDRAFORTE', ic: '⛏️', cor: '#7a5a3a', grupo: 'mv', lv: 400, tema: 'Rochas e metais', p: [
    ['Qual é o mineral natural mais duro que existe?', ['Diamante', 'Ouro', 'Giz'], 'O diamante risca quase tudo, e quase nada risca ele. Por isso é usado em brocas e serras.'],
    ['O diamante e o grafite (a ponta do lápis) são feitos do mesmo elemento. Qual?', ['Carbono', 'Ferro', 'Ouro'], 'Os dois são carbono puro! O que muda é o jeito como os átomos estão arrumados.'],
    ['O que o ferro precisa para enferrujar?', ['Água e o oxigênio do ar', 'Só escuridão', 'Música alta'], 'A ferrugem aparece quando o ferro reage com o oxigênio, com a ajuda da umidade. O ouro não enferruja!'],
    ['Quando a lava de um vulcão esfria, ela vira...', ['Rocha', 'Areia de praia na hora', 'Gelo'], 'A lava que esfria vira rochas chamadas magmáticas, como o basalto.'],
    ['O bronze, usado em medalhas e estátuas, é a mistura de quais metais?', ['Cobre e estanho', 'Ouro e prata', 'Ferro e plástico'], 'Misturar metais forma uma liga. O bronze foi tão importante que deu nome a uma época: a Idade do Bronze!'],
    ['O aço, usado em pontes e prédios, é feito principalmente de quê?', ['Ferro com um pouquinho de carbono', 'Alumínio e água', 'Pedra e areia'], 'Um pouquinho de carbono deixa o ferro muito mais forte. É assim que se faz o aço!'],
  ] },
  { id: 'picos', mapa: 'picos_nublados', npc: 'rainha_nimbus', nome: 'Picos Nublados', curto: 'PICOS NUBLADOS', ic: '☁️', cor: '#4a8ad0', grupo: 'mv', lv: 475, tema: 'Nuvens e clima', p: [
    ['As nuvens são feitas de quê?', ['Gotinhas de água e cristais de gelo', 'Algodão', 'Fumaça de chaminé'], 'O vapor de água sobe, esfria e vira gotinhas minúsculas. Milhões delas juntas formam uma nuvem.'],
    ['Quando a gente sobe uma montanha bem alta, o ar fica...', ['Mais frio', 'Mais quente', 'Igual'], 'Quanto mais alto, mais frio: é por isso que tem neve no topo de montanhas altas, até em países quentes.'],
    ['Para ver um arco-íris, onde o Sol precisa estar?', ['Atrás de você', 'Na sua frente', 'Embaixo da terra'], 'Com o Sol nas costas e gotas de chuva na frente, a luz se divide nas cores do arco-íris.'],
    ['Por que a gente vê o relâmpago antes de ouvir o trovão?', ['A luz é muito mais rápida que o som', 'O trovão acontece depois', 'O ouvido é preguiçoso'], 'Os dois acontecem juntos! Conte os segundos entre o clarão e o barulho: a cada 3 segundos, o raio está mais ou menos 1 quilômetro longe.'],
    ['Qual é a montanha mais alta do mundo?', ['Monte Everest', 'Pão de Açúcar', 'Monte Fuji'], 'O Everest tem cerca de 8.849 metros e fica no Himalaia, entre o Nepal e a China.'],
    ['Qual é a ordem do ciclo da água?', ['Evapora, vira nuvem e cai como chuva', 'Chove, vira pedra e some', 'Congela, derrete e vira fogo'], 'O Sol esquenta a água, ela evapora, vira nuvem e volta como chuva para os rios e mares. E tudo recomeça!'],
    ['Quantas pontas costuma ter um floco de neve?', ['6', '3', '10'], 'Os cristais de gelo crescem com seis lados. Por isso os flocos têm seis pontas, e quase nunca dois são iguais!'],
  ] },
  { id: 'vale', mapa: 'vale_celeste', npc: 'guardiao_vale', nome: 'Vale das Pedras Celestiais', curto: 'VALE CELESTE', ic: '☄️', cor: '#c05a1a', grupo: 'mv', lv: 1, tema: 'Meteoros e cometas', p: [
    ['O que é uma "estrela cadente"?', ['Uma pedrinha do espaço brilhando ao entrar no ar da Terra', 'Uma estrela caindo de verdade', 'Um avião'], 'Não é uma estrela! É um meteoro: um pedacinho de rocha que entra muito rápido no ar e brilha ao esquentar.'],
    ['Como se chama a pedra do espaço que chega até o chão?', ['Meteorito', 'Cometa', 'Satélite'], 'No espaço ela é um meteoroide; brilhando no céu, um meteoro; e o pedaço que chega ao chão é o meteorito!'],
    ['Como se chama o maior meteorito já encontrado no Brasil, com mais de 5 toneladas?', ['Bendegó', 'Saci', 'Curupira'], 'O Bendegó foi encontrado na Bahia em 1784 e hoje fica no Museu Nacional, no Rio. Ele resistiu até ao incêndio do museu, em 2018!'],
    ['Do que é feito um cometa?', ['Gelo, poeira e rocha', 'Fogo puro', 'Metal derretido'], 'Quando o cometa chega perto do Sol, o gelo vira gás e forma uma cauda brilhante.'],
    ['Para que lado aponta a cauda de um cometa?', ['Sempre para longe do Sol', 'Sempre para o Sol', 'Sempre para a Terra'], 'O "vento" de partículas que sai do Sol empurra a cauda. Por isso ela aponta para o lado oposto ao Sol.'],
    ['Segundo os cientistas, o que causou o fim da maioria dos dinossauros, há 66 milhões de anos?', ['A queda de um asteroide gigante', 'Um inverno de uma semana', 'Eles foram embora de barco'], 'Um asteroide de uns 10 quilômetros caiu onde hoje é o México. As aves são as descendentes dos dinossauros que sobreviveram!'],
    ['Onde fica o cinturão de asteroides do Sistema Solar?', ['Entre Marte e Júpiter', 'Em volta da Lua', 'Dentro do Sol'], 'Lá giram milhões de rochas em volta do Sol. A maioria é bem pequena.'],
  ] },
  { id: 'jurassico', mapa: 'jur_acampamento', npc: 'dra_fossil', nome: 'Vale Jurássico', curto: 'VALE JURÁSSICO', ic: '🦖', cor: '#4a7a2a', grupo: 'mv', lv: 560, tema: 'Dinossauros e fósseis', p: [
    ['O que faz um paleontólogo?', ['Estuda fósseis para entender a vida do passado', 'Cuida de dentes', 'Constrói prédios'], 'Paleontólogos como eu escavam ossos, pegadas e conchas que viraram pedra e descobrem como era a Terra há milhões de anos.'],
    ['O Tiranossauro rex viveu no período Jurássico?', ['Não, ele viveu depois, no Cretáceo', 'Sim, era o rei do Jurássico', 'Ele vive até hoje'], 'O T. rex viveu no fim do Cretáceo, há uns 68 milhões de anos. No Jurássico viviam outros, como o Estegossauro.'],
    ['Pessoas e dinossauros gigantes viveram ao mesmo tempo?', ['Não, milhões de anos separam os dois', 'Sim, as pessoas montavam neles', 'Só no Brasil'], 'Os grandes dinossauros sumiram há 66 milhões de anos. Os primeiros seres humanos apareceram há só uns 300 mil anos.'],
    ['Quais animais de hoje são descendentes dos dinossauros?', ['As aves', 'Os gatos', 'Os peixes'], 'Galinhas, pombos e beija-flores são parentes dos dinossauros! Muitos dinossauros até tinham penas.'],
    ['Como se forma um fóssil?', ['O corpo fica coberto de terra e, com o tempo, minerais tomam o lugar dos ossos', 'Alguém esculpe na pedra', 'O bicho congela no freezer'], 'Leva milhares ou milhões de anos: camadas de lama e areia cobrem os restos e vão virando pedra junto com eles.'],
    ['Como se chama o cocô de dinossauro que virou fóssil?', ['Coprólito', 'Pedra-pomes', 'Âmbar'], 'Sim, cocô fossilizado existe! Ele mostra aos cientistas o que os dinossauros comiam.'],
    ['Os pterossauros, que voavam no tempo dos dinossauros, eram dinossauros?', ['Não, eram répteis voadores, primos deles', 'Sim, dinossauros com asas', 'Eram morcegos gigantes'], 'Os pterossauros eram parentes próximos, mas não eram dinossauros. O Brasil tem fósseis lindos deles na Chapada do Araripe, no Ceará!'],
    ['Alguns dos dinossauros mais antigos do mundo foram achados em qual estado do Brasil?', ['Rio Grande do Sul', 'Amazonas', 'Pernambuco'], 'Há cerca de 230 milhões de anos viviam lá dinossauros pequenos que estão entre os primeiros da história!'],
  ] },
];
const PSP_GRUPOS = [['brasil', '🌎 Brasil'], ['mundo', '✈️ Pelo mundo'], ['mar', '🌊 Mar e espaço'], ['mv', '🌀 Multiverso, vales e Jurássico']];
const PSP_POR_ID = Object.fromEntries(PSP_LUGARES.map(L => [L.id, L]));
const PSP_POR_NPC = Object.fromEntries(PSP_LUGARES.map(L => [L.npc, L]));
const PSP_ESPERA = 60000; // errou: tenta de novo depois de 1 minuto
// títulos por marco (só reconhecimento)
const PSP_MARCOS = [
  { n: 5, id: 'viajante', ic: '🧭', nome: 'Viajante Sabido' },
  { n: 15, id: 'explorador', ic: '🗺️', nome: 'Explorador do Saber' },
  { n: PSP_LUGARES.length, id: 'sabio', ic: '🌍', nome: 'Sábio do Universo', moldura: true },
];

/* ---------- estado ---------- */
function pspEstado() {
  const s = G.save; if (!s) return { c: {}, ate: {}, tit: [] };
  let p = s.passaporte; if (!p || typeof p !== 'object') p = s.passaporte = {};
  if (!p.c || typeof p.c !== 'object') p.c = {}; if (!p.ate || typeof p.ate !== 'object') p.ate = {}; if (!Array.isArray(p.tit)) p.tit = [];
  return p;
}
const pspFeitos = () => PSP_LUGARES.filter(L => pspEstado().c[L.id]).length;
const pspTem = id => !!pspEstado().c[id];
const pspFalta = id => Math.max(0, (pspEstado().ate[id] || 0) - Date.now());
const pspNpcNome = L => ((typeof NPCS !== 'undefined' && NPCS[L.npc] && NPCS[L.npc].nome) || L.npc);
const pspNpcCurto = L => pspNpcNome(L).split(',')[0];
function pspNivelLugar(L) { // nível de chegada (só para mostrar): voo da cidade, planeta, senão o do dado
  try { if (typeof VOOS !== 'undefined' && VOOS[L.id] && VOOS[L.id].lvl > 1) return VOOS[L.id].lvl; } catch (e) { }
  try { if (typeof PLANETAS !== 'undefined') { const pl = PLANETAS.find(x => x.id === L.mapa); if (pl && pl.req) return pl.req; } } catch (e) { }
  return L.lv || 1;
}
function pspTituloAtual() { const n = pspFeitos(); let t = null; for (const m of PSP_MARCOS) if (n >= m.n) t = m; return t; }
// para o Caderno do Craque (caderno.js): % e as próximas coisas fáceis
window.passaporteProgresso = function () { try { return { feitos: G.save ? pspFeitos() : 0, total: PSP_LUGARES.length }; } catch (e) { return { feitos: 0, total: PSP_LUGARES.length }; } };
window.passaporteProximas = function () {
  try {
    const nv = (G.save && G.save.nivel) || 1;
    return PSP_LUGARES.filter(L => !pspTem(L.id) && pspNivelLugar(L) <= nv).sort((a, b) => pspNivelLugar(a) - pspNivelLugar(b)).slice(0, 2)
      .map(L => ({ txt: `🛂 Carimbo de ${L.nome}: 3 perguntas com ${pspNpcCurto(L)}`, peso: 0.45 }));
  } catch (e) { return []; }
};
// marca as flags das missões de apresentação (psp_c1, psp_c3) conforme o número de carimbos
function pspFlags() { const s = G.save; if (!s || !s.flags) return; const n = pspFeitos(); if (n >= 1) s.flags.psp_c1 = true; if (n >= 3) s.flags.psp_c3 = true; }

/* ---------- o carimbo (desenhado por código) ---------- */
function pspHash(t) { let h = 2166136261; for (const ch of String(t)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function pspRnd(seed) { let a = seed || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function pspTextoArco(x, txt, r, embaixo) {
  const chars = [...txt], ws = chars.map(c => x.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0);
  let a = embaixo ? Math.PI / 2 + tot / (2 * r) : -Math.PI / 2 - tot / (2 * r);
  for (let i = 0; i < chars.length; i++) {
    const da = ws[i] / r, m = embaixo ? a - da / 2 : a + da / 2;
    x.save(); x.rotate(m); x.translate(r, 0); x.rotate(embaixo ? -Math.PI / 2 : Math.PI / 2); x.fillText(chars[i], 0, 0); x.restore();
    a = embaixo ? a - da : a + da;
  }
}
function pspCarimbo(L, feito, tam = 120) {
  const c = document.createElement('canvas'); c.width = c.height = tam; c.className = 'psp-cv';
  const x = c.getContext('2d'), R = tam / 2, rnd = pspRnd(pspHash(L.id));
  x.translate(R, R);
  if (!feito) {
    x.strokeStyle = 'rgba(120,100,70,.45)'; x.lineWidth = 2; x.setLineDash([5, 5]);
    x.beginPath(); x.arc(0, 0, R * 0.86, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
    x.globalAlpha = 0.28; x.font = `${Math.round(tam * 0.32)}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    try { x.filter = 'grayscale(1)'; } catch (e) { } x.fillText(L.ic, 0, 0); x.filter = 'none'; x.globalAlpha = 1;
    return c;
  }
  x.rotate((rnd() - 0.5) * 0.45);
  const tinta = L.cor;
  x.strokeStyle = tinta; x.fillStyle = tinta;
  x.lineWidth = tam * 0.04; x.beginPath(); x.arc(0, 0, R * 0.9, 0, Math.PI * 2); x.stroke();
  x.lineWidth = tam * 0.015; x.beginPath(); x.arc(0, 0, R * 0.62, 0, Math.PI * 2); x.stroke();
  // o nome em volta (em cima) e "PASSAPORTE DO CRAQUE" (embaixo)
  x.textAlign = 'center'; x.textBaseline = 'middle';
  let f = tam * 0.12; const rTxt = R * 0.76, max = Math.PI * rTxt * 0.92;
  const mede = (t, px) => { x.font = `800 ${px}px Fredoka, Nunito, sans-serif`; return x.measureText(t).width; };
  while (f > tam * 0.06 && mede(L.curto, f) > max) f -= 0.5;
  x.font = `800 ${f}px Fredoka, Nunito, sans-serif`; pspTextoArco(x, L.curto, rTxt, false);
  x.font = `700 ${tam * 0.07}px Fredoka, Nunito, sans-serif`; pspTextoArco(x, 'PASSAPORTE DO CRAQUE', rTxt, true);
  // estrelinhas dos lados
  for (const s of [-1, 1]) { x.save(); x.translate(s * rTxt, 0); x.font = `${tam * 0.08}px sans-serif`; x.fillText('★', 0, 0); x.restore(); }
  // o ícone no meio
  x.font = `${Math.round(tam * 0.3)}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`; x.globalAlpha = 0.92; x.fillText(L.ic, 0, -tam * 0.03); x.globalAlpha = 1;
  // a data
  const d = new Date(pspEstado().c[L.id] || Date.now()), dd = n => String(n).padStart(2, '0');
  x.font = `700 ${tam * 0.07}px Fredoka, Nunito, sans-serif`; x.fillText(`${dd(d.getDate())}/${dd(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`, 0, tam * 0.2);
  // falhas de tinta (cara de carimbo de verdade)
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, rr = rnd() * R * 0.95; x.globalAlpha = 0.25 + rnd() * 0.6; x.beginPath(); x.arc(Math.cos(a) * rr, Math.sin(a) * rr, 0.6 + rnd() * tam * 0.018, 0, Math.PI * 2); x.fill(); }
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  return c;
}

/* ---------- as 3 perguntas ---------- */
function pspSorteia(L) {
  const p = pspEstado(); p.ult = p.ult && typeof p.ult === 'object' ? p.ult : {};
  const ult = Array.isArray(p.ult[L.id]) ? p.ult[L.id] : [];
  const idx = L.p.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [idx[i], idx[k]] = [idx[k], idx[i]]; }
  idx.sort((a, b) => ult.includes(a) - ult.includes(b)); // as que não caíram da última vez vêm primeiro
  const tres = idx.slice(0, 3); p.ult[L.id] = tres; return tres;
}
function pspProva(L, npc) {
  if (!G.save) return;
  const pratica = pspTem(L.id);
  if (!pratica && pspFalta(L.id) > 0) return pspEspera(L, npc);
  const qs = pspSorteia(L), certos = [];
  let i = 0;
  const topo = conteudo => el('div', { class: 'npc-topo' }, npc && typeof retratoNPC === 'function' ? retratoNPC(npc) : el('div', { class: 'psp-ic-grande' }, L.ic), el('div', { class: 'fala' }, ...conteudo));
  const pontos = () => el('div', { class: 'psp-pontos' }, ...qs.map((_, k) => el('span', { class: k < certos.length ? (certos[k] ? 'ok' : 'nao') : k === i ? 'agora' : '' }, k < certos.length ? (certos[k] ? '✔' : '✘') : String(k + 1))));
  const mostra = () => {
    const [perg, ops, expl] = L.p[qs[i]], certa = ops[0];
    const emb = [...ops]; for (let k = emb.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [emb[k], emb[j]] = [emb[j], emb[k]]; }
    let resp = false;
    const grade = el('div', { class: 'quiz-op psp-op' }), fim = el('div', { class: 'psp-fim' }), ops2 = el('div', { class: 'opcoes' });
    const responder = (op, b) => {
      if (resp) return; resp = true; window.teclaModal = null;
      const ok = op === certa; certos.push(ok);
      grade.querySelectorAll('button').forEach(x => { x.disabled = true; if (x.dataset.op === certa) x.classList.add('certo'); });
      if (!ok && b) b.classList.add('errado');
      try { som(ok ? 'moeda' : 'erro'); } catch (e) { }
      fim.append(el('p', { class: 'psp-res ' + (ok ? 'ok' : 'nao') }, ok ? '✔ Isso mesmo!' : `✘ Não foi dessa vez. A resposta certa é: ${certa}`), el('p', { class: 'psp-expl' }, '💡 ', expl));
      const ultima = i >= qs.length - 1;
      ops2.append(el('button', { class: 'btn amarelo', type: 'button', onclick: () => { if (ultima) resultado(); else { i++; mostra(); } } }, ultima ? 'Ver o resultado' : 'Próxima pergunta'));
    };
    emb.forEach((op, k) => { const b = el('button', { class: 'btn', type: 'button', 'data-op': op }, `${k + 1}. ${op}`); b.onclick = () => responder(op, b); grade.append(b); });
    window.teclaModal = ev => { const n = '123456789'.indexOf(ev.key); if (n >= 0 && n < grade.children.length && !resp) grade.children[n].click(); };
    abreModal(el('h2', {}, `❓ Passaporte: ${L.nome}${pratica ? ' (treino)' : ''}`), topo([el('p', { class: 'psp-tema' }, `${L.ic} ${L.tema} · pergunta ${i + 1} de 3`), el('p', { class: 'psp-perg' }, perg)]), pontos(), grade, fim, ops2,
      el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: () => { if (!pratica && certos.includes(false)) { pspEstado().ate[L.id] = Date.now() + PSP_ESPERA; salvar(); } fechaModal(); } }, 'Sair')));
  };
  const resultado = () => {
    const n = certos.filter(Boolean).length, tudo = n === qs.length;
    if (pratica) {
      abreModal(el('h2', {}, `❓ Passaporte: ${L.nome} (treino)`), topo([el('p', {}, tudo ? 'Acertou as 3 de novo! Você sabe mesmo tudo sobre este lugar.' : `Você acertou ${n} de 3. Releia as explicações e treine de novo quando quiser.`)]), pontos(),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => pspProva(L, npc) }, 'Treinar de novo'), el('button', { class: 'btn', type: 'button', onclick: () => window.abrePassaporte() }, '🛂 Ver o passaporte'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
      return;
    }
    if (!tudo) {
      pspEstado().ate[L.id] = Date.now() + PSP_ESPERA; salvar();
      abreModal(el('h2', {}, `❓ Passaporte: ${L.nome}`), topo([el('p', {}, `Você acertou ${n} de 3. Quase lá! Para ganhar o carimbo, é preciso acertar as 3.`), el('p', {}, 'Leia de novo as explicações, descanse um minutinho e tente outra vez. As perguntas mudam um pouco a cada tentativa!')]), pontos(),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Combinado!')));
      return;
    }
    pspDaCarimbo(L, npc, topo, pontos);
  };
  mostra();
}
function pspEspera(L, npc) {
  const txt = el('b', {}, fmtFalta(pspFalta(L.id)));
  const tm = setInterval(() => { if (!document.body.contains(txt)) return clearInterval(tm); const f = pspFalta(L.id); if (f <= 0) { clearInterval(tm); pspProva(L, npc); return; } txt.textContent = fmtFalta(f); }, 500);
  abreModal(el('h2', {}, `❓ Passaporte: ${L.nome}`), el('p', {}, `${pspNpcCurto(L)} está preparando novas perguntas. Volte em `, txt, '.'),
    el('p', { class: 'vazio' }, 'Enquanto isso, que tal ler a placa do monumento ou dar uma volta pelo lugar?'), el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Ok')));
}
function pspDaCarimbo(L, npc, topo, pontos) {
  const s = G.save, p = pspEstado();
  if (p.c[L.id]) return;
  p.c[L.id] = Date.now(); delete p.ate[L.id];
  const ouro = Math.round(Math.min(2500, 40 + (s.nivel || 1) * 5)); // tostões pequenos (só reconhecimento)
  s.ouro += ouro; G.uiSujo = true;
  pspFlags();
  const n = pspFeitos();
  log(`🛂 CARIMBO NO PASSAPORTE: ${L.nome}! (${n} de ${PSP_LUGARES.length}) +${fmt(ouro)} tostões.`, 'l-lvl');
  try { som('nivel'); } catch (e) { }
  const novos = PSP_MARCOS.filter(m => n >= m.n && !p.tit.includes(m.id));
  for (const m of novos) { p.tit.push(m.id); log(`${m.ic} NOVO TÍTULO: ${m.nome}! (${m.n} carimbos no Passaporte do Craque)`, 'l-lendario'); if (m.moldura) log('🛂 Adorno liberado: Moldura do Viajante (Equipamento → ✨ Adornos).', 'l-lendario'); }
  try { banner(novos.length ? `${novos[novos.length - 1].ic} ${novos[novos.length - 1].nome}` : `🛂 Carimbo: ${L.nome}`, novos.length ? 'Novo título no Passaporte!' : `${n} de ${PSP_LUGARES.length} carimbos`); } catch (e) { }
  salvar();
  const cv = pspCarimbo(L, true, 150); cv.classList.add('psp-bate');
  abreModal(el('h2', {}, `❓ Passaporte: ${L.nome}`), topo([el('p', {}, 'Acertou as 3! Você aprendeu um montão sobre este lugar. Aqui está o seu carimbo!')]), pontos(),
    el('div', { class: 'psp-novo' }, cv, el('div', {}, el('b', {}, `${n} de ${PSP_LUGARES.length} carimbos`), el('small', {}, `+${fmt(ouro)} tostões`),
      ...novos.map(m => el('div', { class: 'psp-tit-novo' }, `${m.ic} Título novo: ${m.nome}!`)))),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => window.abrePassaporte() }, '🛂 Ver o passaporte'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
}

/* ---------- a janela do Passaporte ---------- */
let PSP_SEL = null;
function pspComoChegar(L) { // texto curto de como chegar até quem faz as perguntas
  try {
    if (typeof ccRota !== 'function') return '';
    const r = ccRota(L.mapa); if (!r) return '';
    const cam = typeof ccCaminhoTxt === 'function' ? ccCaminhoTxt(r) : '';
    return [r.viagem, cam ? 'Caminho ' + cam : ''].filter(Boolean).join(' · ');
  } catch (e) { return ''; }
}
window.abrePassaporte = function abrePassaporte() {
  if (!G.save) return;
  const p = pspEstado(), n = pspFeitos(), T = PSP_LUGARES.length, nv = G.save.nivel || 1;
  const tit = pspTituloAtual(), prox = PSP_MARCOS.find(m => n < m.n);
  const cab = el('div', { class: 'psp-cab' },
    el('div', { class: 'psp-conta' }, el('b', {}, `${n} de ${T} carimbos`), el('div', { class: 'psp-barra' }, el('i', { style: `width:${Math.round(n / T * 100)}%` }))),
    el('div', { class: 'psp-titulo' }, tit ? `Título: ${tit.ic} ${tit.nome}` : 'Ainda sem título', prox ? el('small', {}, ` · faltam ${prox.n - n} para ${prox.ic} ${prox.nome}`) : el('small', {}, ' · você completou o passaporte! 🎉')));
  const det = el('div', { class: 'psp-det' });
  const mostraDet = L => {
    det.innerHTML = '';
    if (!L) { det.append(el('p', { class: 'vazio' }, 'Em cada lugar, um morador faz 3 perguntas. Acerte as 3 e ganhe o carimbo! Clique num carimbo para ver quem procurar.')); return; }
    const tem = !!p.c[L.id], lvL = pspNivelLugar(L);
    det.append(el('b', {}, `${L.ic} ${L.nome} — ${L.tema}`), el('div', {}, `🙋 Quem pergunta: ${pspNpcNome(L)}`));
    if (!tem && lvL > nv) det.append(el('div', {}, `🔒 Você chega lá por volta do nível ${lvL}.`));
    else { const cc = pspComoChegar(L); if (cc) det.append(el('div', {}, `🧭 ${cc}`)); }
    if (tem) { const q = L.p[pspHash(L.id + (p.c[L.id] || 0) + new Date().getDate()) % L.p.length]; det.append(el('div', { class: 'psp-lembra' }, '💡 Você aprendeu: ', q[2])); }
    else if (pspFalta(L.id) > 0) det.append(el('div', {}, `⏳ Pode tentar de novo em ${fmtFalta(pspFalta(L.id))}.`));
  };
  const paginas = PSP_GRUPOS.map(([g, nomeG]) => {
    const ls = PSP_LUGARES.filter(L => L.grupo === g), ng = ls.filter(L => p.c[L.id]).length;
    return el('div', { class: 'psp-pag' }, el('h3', {}, `${nomeG} `, el('small', {}, `${ng}/${ls.length}`)),
      el('div', { class: 'psp-grade' }, ...ls.map(L => {
        const tem = !!p.c[L.id];
        const card = el('button', { type: 'button', class: 'psp-card' + (tem ? ' tem' : '') + (PSP_SEL === L.id ? ' sel' : ''), title: tem ? `${L.nome}: carimbado!` : `${L.nome}: fale com ${pspNpcCurto(L)}` },
          pspCarimbo(L, tem, 96), el('b', {}, L.nome), el('small', {}, tem ? '✔ carimbado' : pspNpcCurto(L)));
        card.onclick = () => { PSP_SEL = L.id; document.querySelectorAll('.psp-card.sel').forEach(x => x.classList.remove('sel')); card.classList.add('sel'); mostraDet(L); };
        return card;
      })));
  });
  mostraDet(PSP_SEL && PSP_POR_ID[PSP_SEL]);
  const marcos = el('div', { class: 'psp-marcos' }, ...PSP_MARCOS.map(m => el('span', { class: n >= m.n ? 'ok' : '' }, `${n >= m.n ? m.ic : '🔒'} ${m.nome} (${m.n})${m.moldura ? ' + Moldura do Viajante' : ''}`)));
  abreModal.largo = true;
  abreModal(el('h2', {}, '🛂 Passaporte do Craque'), cab, det, ...paginas, marcos,
    el('p', { class: 'dica' }, 'Cada carimbo dá alguns tostões. Os títulos e a moldura são só para mostrar o quanto você sabe.'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
};

/* ---------- o botão na conversa com quem faz as perguntas ---------- */
function pspPoeBotao(npc) {
  if (!npc || !G.save || !G.mapa) return;
  const L = PSP_POR_NPC[npc.id]; if (!L || L.mapa !== G.mapa.id) return;
  const M = document.getElementById('modal'), C = document.getElementById('modalConteudo'); if (!M || M.hidden || !C) return;
  const ops = C.querySelector('.opcoes'); if (!ops || ops.querySelector('.psp-bt')) return;
  const tem = pspTem(L.id), f = pspFalta(L.id);
  const rot = tem ? '🛂 Passaporte: treinar as perguntas (carimbo ✔)' : f > 0 ? `🛂 Passaporte: 3 perguntas (volta em ${fmtFalta(f)})` : `🛂 Passaporte: 3 perguntas sobre ${L.nome}`;
  const b = el('button', { class: 'btn roxo psp-bt', type: 'button', onclick: () => pspProva(L, npc) }, rot);
  const ult = ops.lastElementChild; if (ult && /Tchau|Um dia eu vou|Fechar/.test(ult.textContent)) ult.before(b); else ops.append(b);
}
// a Dona Zuleide abre a janela dos cartões-postais (vila_nova.js), sem os botões de missão: as missões do Passaporte entram aqui
function pspMissoesZuleide(npc) {
  if (!npc || npc.id !== 'agente_turismo' || !G.save) return;
  const C = document.getElementById('modalConteudo'), ops = C && C.querySelector('.opcoes'); if (!ops || ops.querySelector('.psp-mq')) return;
  const qs = MISSOES.filter(q => q.npc === 'agente_turismo' && /^psp_/.test(q.id));
  const pronta = qs.find(q => statusMissao(q) === 'pronta'), ativa = qs.find(q => statusMissao(q) === 'ativa'), disp = qs.find(q => statusMissao(q) === 'disponivel');
  const poe = b => { b.classList.add('psp-mq'); ops.prepend(b); };
  if (pronta) poe(el('button', { class: 'btn amarelo', type: 'button', onclick: () => { entregaMissao(pronta); abrirNPCDepois(npc, pronta.fim); } }, `Entregar: ${pronta.titulo}`));
  else if (disp) poe(el('button', { class: 'btn amarelo', type: 'button', onclick: () => modalMissao(npc, disp) }, `Missão: ${disp.titulo}`));
  else if (ativa) {
    const fala = C.querySelector('.fala'); const [a, b2] = progressoMissao(ativa);
    if (fala && !fala.querySelector('.psp-mq-linha')) {
      const li = el('div', { class: 'linha-item psp-mq-linha' }, el('div', { class: 'nm' }, el('b', {}, ativa.titulo), el('small', {}, `${descMissao(ativa)} — ${a}/${b2}`)));
      try { const bl = typeof blocoComoChegar === 'function' && blocoComoChegar(ativa, true); if (bl) li.querySelector('.nm').append(bl); } catch (e) { }
      fala.append(li);
    }
  }
}
{
  const _abPsp = abrirNPC;
  abrirNPC = function (npc) {
    const r = _abPsp.apply(this, arguments);
    try { pspMissoesZuleide(npc); } catch (e) { console.warn('passaporte (missões)', e); }
    try { pspPoeBotao(npc); } catch (e) { console.warn('passaporte', e); }
    return r;
  };
}

/* ---------- missões de apresentação (padrão "📍 Onde achar e como chegar") ---------- */
MISSOES.push(
  { id: 'psp_m1', npc: 'agente_turismo', titulo: '🛂 O Passaporte do Craque', lvl: 8, pspOnde: ['agente_turismo'],
    texto: 'Todo craque que viaja aprende um pouco de cada lugar! Este é o seu Passaporte do Craque. Acerte as minhas 3 perguntas, aqui na Agência de Turismo da Vila do Campinho, e ganhe o primeiro carimbo.',
    req: { flag: 'psp_c1', desc: 'Ganhe 1 carimbo no Passaporte do Craque (3 perguntas da Dona Zuleide, na Vila)' },
    rec: { xp: 300, ouro: 80 },
    fim: 'Que carimbo bonito! Em muitos lugares do mundo tem alguém com perguntas para você. Procure o botão 🛂 nas conversas.' },
  { id: 'psp_m2', npc: 'agente_turismo', titulo: '🛂 Carimbos da estrada', lvl: 20, pre: 'psp_m1', pspOnde: ['tata', 'ginga'],
    texto: 'Leve o passaporte na estrada! O Mestre Tatá, na Praia do Futevôlei, e o Mestre Ginga, nas Quadras de Futsal da Cidade, também fazem perguntas e dão carimbos. Junte 3 carimbos e volte aqui na Agência de Turismo.',
    req: { flag: 'psp_c3', desc: 'Tenha 3 carimbos no Passaporte (Praia: Mestre Tatá · Cidade: Mestre Ginga)' },
    rec: { xp: 1500, ouro: 250 },
    fim: '3 carimbos! Quando você voar pelo mundo, cada cidade tem o seu. Com 5 carimbos, você ganha o título de Viajante Sabido!' },
);
// quem procurar agora: o primeiro lugar da missão ainda sem carimbo
function pspOndeNpc(q) { const l = q.pspOnde || []; return l.find(id => { const L = PSP_POR_NPC[id]; return L && !pspTem(L.id); }) || l[l.length - 1]; }
if (typeof ccInfo === 'function') {
  const _ccPsp = ccInfo;
  ccInfo = function (q) {
    try {
      if (q && q.pspOnde) {
        const id = pspOndeNpc(q), a = indice().npc[id];
        if (a && a.mapa) return { quem: NPCS[id] ? NPCS[id].nome : id, npc: id, como: 'faz as 3 perguntas do Passaporte', mapa: a.mapa, onde: ccNome(a.mapa), parte: ccParte(a.mapa, a.x, a.y), rota: ccRota(a.mapa), lugarDe: true };
      }
    } catch (e) { }
    return _ccPsp.apply(this, arguments);
  };
  if (window.COMO_CHEGAR) window.COMO_CHEGAR.ccInfo = ccInfo;
}
// a seta amarela: missão do passaporte em andamento → quem faz as perguntas
{
  const _oaPsp = objetivoAtual;
  objetivoAtual = function () {
    const r = _oaPsp.apply(this, arguments);
    try {
      const s = G.save; if (!s || !G.guiaOn || (typeof TUTORIAL !== 'undefined' && s.tut < TUTORIAL.length)) return r;
      if (MISSOES.some(q => statusMissao(q) === 'pronta')) return r;
      const q = MISSOES.find(q => statusMissao(q) === 'ativa');
      if (q && q.pspOnde) { const a = alvoNpc(pspOndeNpc(q)); if (a) return a; }
    } catch (e) { }
    return r;
  };
}

/* ---------- adorno: Moldura do Viajante (todos os carimbos; só visual) ---------- */
try {
  if (window.ADORNOS2 && ADORNOS2.OPCOES && ADORNOS2.OPCOES.extra && !ADORNOS2.OPCOES.extra.some(o => o[0] === 'moldura_viajante'))
    ADORNOS2.OPCOES.extra.push(['moldura_viajante', 'Moldura do Viajante', '🛂', { ok: () => !!G.save && pspFeitos() >= PSP_LUGARES.length, txt: '🔒 Todos os carimbos do Passaporte do Craque' }, 'Seu nome numa plaquinha azul de carimbos (só visual).']);
} catch (e) { }
if (typeof rotulo === 'function') {
  const _rotPsp = rotulo;
  rotulo = function (ctx, txt, x, y, cor, tam) {
    try {
      const s = G.save;
      if (s && window.ADORNOS2 && txt === `Nv ${s.nivel} ${s.nome}`) {
        const ex = ADORNOS2.atual('extra');
        if (ex.includes('moldura_viajante') && !ex.includes('moldura')) {
          const f = tam * G.dpr; ctx.font = `700 ${f}px Fredoka, Nunito, sans-serif`;
          const w = ctx.measureText(txt).width + f * 1.6, h = f * 1.5, x0 = x - w / 2, y0 = y - f * 1.05;
          ctx.save(); ctx.fillStyle = 'rgba(10,30,70,0.78)'; ctx.beginPath(); ctx.roundRect(x0 - 2, y0 - 2, w + 4, h + 4, 5 * G.dpr); ctx.fill();
          ctx.strokeStyle = '#7ec8ff'; ctx.lineWidth = 2 * G.dpr; ctx.setLineDash([4 * G.dpr, 3 * G.dpr]); ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 4 * G.dpr); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#ffd25a'; ctx.font = `${f * 0.7}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', x0 + f * 0.45, y0 + h / 2); ctx.fillText('★', x0 + w - f * 0.45, y0 + h / 2);
          ctx.restore();
          return _rotPsp.call(this, ctx, txt, x, y, '#cfe9ff', tam);
        }
      }
    } catch (e) { }
    return _rotPsp.apply(this, arguments);
  };
}

/* ---------- Seu Juca: perguntas de regras e jogo limpo (o quiz sorteia de QUIZ; a 1ª resposta é a certa) ---------- */
if (typeof QUIZ !== 'undefined' && !QUIZ.some(q => q[0].startsWith('Quantos cartões amarelos no mesmo jogo'))) QUIZ.push(
  ['Quantos cartões amarelos no mesmo jogo fazem um jogador ser expulso?', ['2', '3', '1', '4']],
  ['Um time com um jogador expulso pode colocar outro no lugar dele?', ['Não, joga com um a menos', 'Sim, na hora', 'Só no intervalo', 'Só se o adversário deixar']],
  ['Em qual destas jogadas NÃO existe impedimento?', ['Arremesso lateral', 'Passe longo para o atacante', 'Cruzamento na área', 'Tabelinha']],
  ['Um jogador que está no campo de defesa do próprio time pode estar impedido?', ['Não', 'Sim', 'Só se estiver correndo', 'Só se for atacante']],
  ['Para ser gol, quanto da bola precisa passar da linha do gol?', ['A bola inteira', 'Metade', 'Só um pedacinho', 'Basta tocar na linha']],
  ['O árbitro esticou os dois braços para a frente. O que isso quer dizer?', ['Vantagem: o jogo continua', 'Fim de jogo', 'Pênalti', 'Substituição']],
  ['O árbitro levantou um braço na cobrança de falta. O que isso quer dizer?', ['Tiro livre indireto', 'Gol anulado', 'Cartão vermelho', 'Fim do primeiro tempo']],
  ['Um jogador caiu machucado e o outro time chutou a bola para fora. O que é jogo limpo na volta?', ['Devolver a bola para eles', 'Cobrar rápido e atacar', 'Fingir que não viu', 'Reclamar com o árbitro']],
  ['O goleiro pode pegar com as mãos uma bola que o companheiro recuou de propósito com o pé?', ['Não', 'Sim', 'Só fora da área', 'Só no segundo tempo']],
  ['Qual é o número mínimo de jogadores que um time precisa ter em campo para o jogo continuar?', ['7', '9', '5', '11']],
  ['Dá para fazer gol direto na saída de bola, no meio do campo?', ['Sim, vale gol', 'Não, nunca', 'Só de cabeça', 'Só se o goleiro deixar']],
  ['Para que serve o VAR?', ['Ajudar o árbitro a rever lances pelo vídeo', 'Escolher o melhor do jogo', 'Contar o público', 'Cortar a grama']],
  ['Fingir uma falta para enganar o árbitro (simulação) dá o quê?', ['Cartão amarelo', 'Pênalti', 'Nada', 'Um gol']],
  ['No arremesso lateral, onde ficam os dois pés do jogador?', ['No chão, em cima da linha ou do lado de fora', 'No ar', 'Dentro do campo', 'Um em cada lado da linha, pulando']],
  ['Quando a bola sai pela linha de fundo depois de um toque do defensor, o que é marcado?', ['Escanteio', 'Tiro de meta', 'Lateral', 'Pênalti']],
  ['O que um jogador com espírito esportivo faz no fim do jogo?', ['Cumprimenta os adversários e o árbitro', 'Sai sem falar com ninguém', 'Reclama do resultado', 'Esconde a bola']],
);

/* ---------- menu e começo do jogo ---------- */
function pspMenu() {
  const lista = document.querySelector('#topo .tb-lista');
  if (lista && !document.getElementById('btnPassaporte')) {
    const b = el('button', { class: 'btn', id: 'btnPassaporte', type: 'button', role: 'menuitem', title: 'Passaporte do Craque: carimbos dos lugares que você conhece', onclick: () => window.abrePassaporte() }, '🛂 Passaporte do Craque');
    const ref = lista.querySelector('#btnCaderno') || lista.querySelector('[data-abre="album"]'); if (ref) ref.after(b); else lista.append(b);
  }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade && !document.getElementById('cmPassaporte')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmPassaporte', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); window.abrePassaporte(); } }, el('span', { class: 'cm-ic' }, '🛂'), 'Passaporte'));
}
try { // o ☰ Menu em grade: o Passaporte no grupo 🏅 Coleção
  if (typeof OPC_GRUPOS !== 'undefined') { const g = OPC_GRUPOS.find(x => x[0] === 'colecao'); if (g && !/passaporte/.test(g[2].source)) g[2] = new RegExp(g[2].source + '|passaporte', g[2].flags); }
} catch (e) { }
{
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(pspMenu, 0)); else setTimeout(pspMenu, 0);
  const _iniPsp = iniciarJogo;
  iniciarJogo = async function () { const r = await _iniPsp.apply(this, arguments); try { pspMenu(); pspFlags(); } catch (e) { } return r; };
  setInterval(() => { try { pspMenu(); } catch (e) { } }, 2000); // (o menu do celular chega depois)
}
{
  const st = document.createElement('style'); st.id = 'passaporte-css';
  st.textContent = `
  .psp-cab { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; margin: 4px 0 8px; }
  .psp-conta { display: flex; align-items: center; gap: 8px; } .psp-barra { width: 160px; max-width: 40vw; height: 10px; border-radius: 6px; background: rgba(0,0,0,.15); overflow: hidden; }
  .psp-barra i { display: block; height: 100%; background: linear-gradient(90deg, #2e9e5a, #f0c030); }
  .psp-titulo { font-weight: 700; } .psp-titulo small { font-weight: 400; opacity: .8; }
  .psp-det { margin: 4px 0 8px; padding: 8px 10px; border-radius: 10px; background: rgba(240,200,80,.14); border-left: 3px solid #d0a020; font-size: 14px; line-height: 1.4; }
  .psp-det .psp-lembra { margin-top: 4px; font-style: italic; }
  .psp-pag { background: #fbf4e2; color: #3a2a1a; border-radius: 12px; padding: 8px 10px 10px; margin: 8px 0; box-shadow: inset 0 0 0 2px #e8d8b0; }
  .psp-pag h3 { margin: 2px 0 6px; font-size: 16px; } .psp-pag h3 small { opacity: .65; font-weight: 400; }
  .psp-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(108px, 1fr)); gap: 6px; }
  .psp-card { display: flex; flex-direction: column; align-items: center; gap: 1px; background: transparent; border: 2px solid transparent; border-radius: 10px; padding: 4px 2px; cursor: pointer; color: inherit; font: inherit; }
  .psp-card:hover, .psp-card.sel { border-color: #d0a020; background: rgba(208,160,32,.1); }
  .psp-card .psp-cv { width: 84px; height: 84px; } .psp-card b { font-size: 12px; text-align: center; line-height: 1.15; } .psp-card small { font-size: 11px; opacity: .7; text-align: center; line-height: 1.1; }
  .psp-card:not(.tem) b { opacity: .7; }
  .psp-marcos { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; } .psp-marcos span { padding: 3px 8px; border-radius: 12px; background: rgba(0,0,0,.08); font-size: 13px; } .psp-marcos span.ok { background: #2e9e5a; color: #fff; }
  .psp-tema { font-size: 13px !important; opacity: .8; margin: 0 0 4px; } .psp-perg { font-size: 19px !important; font-weight: 700; }
  .psp-pontos { display: flex; gap: 6px; justify-content: center; margin: 6px 0; } .psp-pontos span { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; background: rgba(0,0,0,.12); font-size: 13px; }
  .psp-pontos span.agora { background: #f0c030; color: #2a1a00; } .psp-pontos span.ok { background: #2e9e5a; color: #fff; } .psp-pontos span.nao { background: #c0302a; color: #fff; }
  .psp-op .btn { white-space: normal; }
  .psp-fim .psp-res { font-weight: 800; margin: 8px 0 2px; } .psp-fim .psp-res.ok { color: #1e8a4a; } .psp-fim .psp-res.nao { color: #c0302a; }
  .psp-fim .psp-expl { margin: 2px 0 6px; padding: 6px 8px; border-radius: 8px; background: rgba(240,200,80,.18); line-height: 1.4; }
  .psp-novo { display: flex; align-items: center; gap: 14px; justify-content: center; margin: 8px 0; } .psp-novo > div { display: flex; flex-direction: column; gap: 2px; }
  .psp-tit-novo { font-weight: 800; color: #b07a00; }
  .psp-ic-grande { font-size: 64px; line-height: 1; }
  .psp-bate { animation: pspBate .55s cubic-bezier(.2,1.6,.4,1) both; } @keyframes pspBate { 0% { transform: scale(2.2) rotate(-20deg); opacity: 0; } 60% { opacity: 1; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
  @media (max-width: 640px) { .psp-grade { grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); } .psp-card .psp-cv { width: 72px; height: 72px; } .psp-perg { font-size: 17px !important; } }`;
  document.head.append(st);
}
