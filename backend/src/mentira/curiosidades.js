// MENTIRA SINCERA — curiosidades (lote de teste aprovado, 30).
//
// Cada uma:
//   texto   — a curiosidade com a lacuna "___";
//   verdade — o que completa de verdade (aparece embaralhada com as mentiras);
//   aceitas — outras formas de escrever a verdade: quem "mente" escrevendo
//             uma delas é avisado ("essa é a resposta certa, invente outra!");
//   casa    — mentiras da CASA: completam as opções quando há poucos
//             jogadores (cair nelas não dá ponto a ninguém).
//
// Regra de conteúdo: a verdade tem que PARECER mentira — é o que faz o jogo.

export const CURIOSIDADES = [
  { id: "coca", texto: "Antes de virar refrigerante, a Coca-Cola era vendida em farmácias como ___.", verdade: "tônico para o cérebro", aceitas: ["tonico cerebral", "tonico para o cerebro", "remedio para o cerebro"], casa: ["xarope para tosse", "cura para ressaca"] },
  { id: "escocia", texto: "O animal nacional da Escócia é o ___.", verdade: "unicórnio", aceitas: ["unicornio"], casa: ["cervo", "cavalo-marinho"] },
  { id: "cleopatra", texto: "Cleópatra viveu mais perto, no tempo, da ___ do que da construção da Grande Pirâmide.", verdade: "chegada do homem à Lua", aceitas: ["chegada a lua", "ida a lua", "homem na lua", "pouso na lua"], casa: ["invenção da internet", "Copa do Mundo de 1950"] },
  { id: "polvo", texto: "O polvo tem ___ corações.", verdade: "três", aceitas: ["3", "tres"], casa: ["cinco", "oito"] },
  { id: "suica", texto: "Na Suíça, por lei, é proibido criar um ___ sozinho, sem companhia.", verdade: "porquinho-da-índia", aceitas: ["porquinho da india", "porquinho"], casa: ["peixinho dourado", "papagaio"] },
  { id: "banana", texto: "A banana é levemente ___.", verdade: "radioativa", aceitas: ["radioativo"], casa: ["alcoólica", "magnética"] },
  { id: "pringles", texto: "O inventor da embalagem da Pringles pediu para ser enterrado ___.", verdade: "dentro de uma lata de Pringles", aceitas: ["numa lata de pringles", "em uma lata de pringles", "na lata de pringles", "lata de pringles"], casa: ["com um tubo de batatas no caixão", "na fábrica da Pringles"] },
  { id: "ketchup", texto: "No século 19, o ketchup era vendido nos EUA como ___.", verdade: "remédio", aceitas: ["remedio", "medicamento"], casa: ["tinta de tecido", "graxa de sapato"] },
  { id: "oxford", texto: "A Universidade de Oxford é mais antiga que o Império ___.", verdade: "Asteca", aceitas: ["asteca", "azteca"], casa: ["Otomano", "Mongol"] },
  { id: "tubaroes", texto: "Os tubarões existem na Terra há mais tempo que as ___.", verdade: "árvores", aceitas: ["arvores", "arvore"], casa: ["baratas", "estrelas-do-mar"] },
  { id: "vombate", texto: "O vombate, um bicho australiano, faz cocô em formato de ___.", verdade: "cubo", aceitas: ["cubos", "quadrado", "dado"], casa: ["espiral", "estrela"] },
  { id: "porco", texto: "Em 1386, na França, um ___ foi julgado num tribunal e executado.", verdade: "porco", aceitas: ["porca", "suino"], casa: ["cachorro", "galo"] },
  { id: "codigo", texto: "O primeiro produto do mundo registrado por código de barras foi um pacote de ___.", verdade: "chiclete", aceitas: ["chicletes", "goma de mascar"], casa: ["cigarro", "sabão em pó"] },
  { id: "coala", texto: "O coala tem ___ quase idênticas às de um humano.", verdade: "impressões digitais", aceitas: ["impressoes digitais", "digitais"], casa: ["cordas vocais", "unhas"] },
  { id: "cacareco", texto: "Em 1959, um ___ recebeu cerca de 100 mil votos para vereador em São Paulo.", verdade: "rinoceronte", aceitas: ["rinoceronte cacareco", "cacareco"], casa: ["macaco de zoológico", "palhaço de circo"] },
  { id: "dumont", texto: "Santos Dumont ajudou a popularizar o ___.", verdade: "relógio de pulso", aceitas: ["relogio de pulso", "relogio"], casa: ["chapéu-panamá", "guarda-chuva"] },
  { id: "bigben", texto: "\"Big Ben\" não é o nome da torre de Londres, e sim do ___.", verdade: "sino", aceitas: ["sino grande", "sinos"], casa: ["relógio", "arquiteto"] },
  { id: "mel", texto: "O mel achado em tumbas egípcias de milhares de anos ___.", verdade: "ainda podia ser comido", aceitas: ["ainda era comestivel", "estava bom para comer", "podia ser comido", "ainda estava bom"], casa: ["tinha virado pedra", "era usado para mumificar gatos"] },
  { id: "esposa", texto: "Na Finlândia existe um campeonato mundial de ___.", verdade: "carregar a esposa", aceitas: ["carregar esposa", "carregamento de esposas", "carregar a mulher"], casa: ["dormir na neve", "arremesso de celular"] },
  { id: "google", texto: "O nome \"Google\" vem de \"googol\", que é o número 1 seguido de ___ zeros.", verdade: "cem", aceitas: ["100"], casa: ["mil", "um milhão de"] },
  { id: "emus", texto: "Em 1932, a Austrália mandou soldados com metralhadoras numa guerra contra ___ e perdeu.", verdade: "emus", aceitas: ["emu", "emas"], casa: ["cangurus", "coelhos"] },
  { id: "golfinho", texto: "Os golfinhos dormem com ___.", verdade: "metade do cérebro acordada", aceitas: ["meio cerebro acordado", "metade do cerebro", "um olho aberto"], casa: ["a barriga para cima", "a cabeça fora d'água"] },
  { id: "nintendo", texto: "A Nintendo foi fundada em 1889 para vender ___.", verdade: "cartas de baralho", aceitas: ["baralho", "cartas"], casa: ["guarda-chuvas", "arroz"] },
  { id: "lego", texto: "Contando por unidades, a Lego é a maior fabricante de ___ do mundo.", verdade: "pneus", aceitas: ["pneu"], casa: ["rodas de carrinho", "bonecos"] },
  { id: "venus", texto: "Em Vênus, um dia dura mais que ___.", verdade: "um ano inteiro", aceitas: ["um ano", "o ano"], casa: ["um mês na Terra", "uma semana na Terra"] },
  { id: "youtube", texto: "O primeiro vídeo da história do YouTube foi gravado num ___.", verdade: "zoológico", aceitas: ["zoologico", "zoo"], casa: ["banheiro", "estacionamento"] },
  { id: "ratos", texto: "Os ratos dão risada quando sentem ___.", verdade: "cócegas", aceitas: ["cocegas"], casa: ["cheiro de queijo", "medo"] },
  { id: "playstation", texto: "O PlayStation nasceu de uma parceria da Sony com a ___, que foi desfeita.", verdade: "Nintendo", aceitas: ["nintendo"], casa: ["Sega", "Philips"] },
  { id: "astronautas", texto: "No espaço, os astronautas ficam até ___ mais altos.", verdade: "5 centímetros", aceitas: ["5 cm", "cinco centimetros", "5cm", "5 centimetros"], casa: ["20 centímetros", "1 metro"] },
  { id: "eiffel", texto: "A Torre Eiffel fica até ___ mais alta no verão, por causa do calor.", verdade: "15 centímetros", aceitas: ["15 cm", "quinze centimetros", "15cm", "15 centimetros"], casa: ["2 metros", "1 centímetro"] },
];
