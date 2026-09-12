// TEMA "PEIXES"
//
// ESCOPO: peixes dos oceanos Atlântico, Pacífico e Índico, de água doce e
// ornamentais. Nome vulgar e nome científico, conforme definido.
//
// ESTE ARQUIVO NÃO REPETE o que vem da segmentação de "Animais". Aquelas 37
// já entram pelo script `segmentar-animais`: acará, arraia, bagre, baiacu,
// cavalo-marinho, dourada, dourado, enguia, esturjão, hipocampo, jamanta,
// lambari, lula, lula-gigante, mandi, namorado, peixe, piranha, pirarucu,
// poraquê, polvo, robalo, rêmora, salmão, sardinha, tainha, tilápia, traíra,
// tubarão, tucunaré, ubarana, xaréu, xerelete, xexéu, xereu.
//
// (Lula e polvo são moluscos, não peixes. Vieram assim da classificação
// anterior e ficam — o jogador vai escrever mesmo assim, e recusar seria
// frustrar resposta que a maioria considera válida num tema de bichos
// aquáticos. Fica o registro caso você prefira apagar.)
//
// LISTA AMPLIADA com a curadoria do Gustavinho (setembro/2026).
//
// O QUE FICOU DE FORA daquela lista, e por quê:
//   - mamíferos: boto, golfinho, peixe-boi, toninha, beluga. A própria lista
//     os marcava como tais. Eles estão no tema "Mamíferos", e aceitar aqui
//     faria a mesma resposta valer em dois temas — que é justamente o que a
//     segmentação de Animais veio resolver.
//   - moluscos: mexilhão, búzio.
//   - nomes que só existem na forma composta: "Gaivota (Peixe-gaivota)",
//     "Coruja", "Macaco", "Zebra". A forma "Peixe-X" entrou; a simples não,
//     pra não colidir com Aves e Mamíferos.
//   - K, W e Y (Kribensis, Koi, Yellowtail): letras que o Stop não sorteia.
//
// IDIOMA: nome popular em português e nome científico. Nomes regionais
// brasileiros são o que faz este tema render — pacu, curimbatá, matrinxã.
export const PEIXES_WORDS = {
  A: [
    "Atum", "Anchova", "Agulha", "Apaiari",
    "Aruanã", "Abrótea", "Anequim", "Abadejo",
    "Acari", "Alcaparra", "Alcorraz", "Alfaquique",
    "Anguila", "Anjo", "Apara", "Araiá",
    "Aranha", "Arenque", "Ariacó", "Acarari",
    "Acoupa",
  ],
  B: [
    "Badejo", "Betta", "Bacalhau", "Barbado",
    "Bonito", "Bicuda", "Barracuda", "Bairdi",
    "Baiacu-de-espinho", "Baiacu-cofre", "Balista", "Barbo",
    "Barrigudinho", "Beijupirá", "Beluga", "Bica",
    "Bijupirá", "Biquara", "Bodião", "Borboleta",
    "Brachionus", "Brema",
  ],
  C: [
    "Corvina", "Cavala", "Carpa", "Cascudo",
    "Curimbatá", "Cioba", "Cangulo", "Cará",
    "Cachara", "Congro", "Cação", "Cação-frango",
    "Cachorra", "Cadoz", "Canivete", "Caranha",
    "Carapau", "Caxaréu", "Cherelete", "Chona",
    "Chopa", "Choupa", "Ciclídeo", "Ciprinídeo",
    "Ciriá", "Congro-rosa", "Corimba", "Corimbatá",
    "Curimbá", "Curimbatan",
  ],
  D: [
    "Dentão", "Donzela", "Dourado-do-mar", "Douradinho",
    "Dário", "Damião", "Dragão-marinho", "Dragão-voador",
  ],
  E: [
    "Espada", "Escamudo", "Espadarte", "Enchova",
    "Espadinha", "Enxada", "Enxova", "Embiotocídeo",
    "Escolar", "Escorpião", "Esmeril", "Espadilha",
    "Esturião",
  ],
  F: [
    "Frade", "Foguete", "Fogueteiro", "Fole",
    "Fura-vaso", "Fura-barreiras", "Fuso",
  ],
  G: [
    "Garoupa", "Guaivira", "Guppy", "Galo",
    "Gurijuba", "Gadoz", "Galo-do-alto", "Gambúzia",
    "Garoupa-verdadeira", "Garoupa-são-tomé", "Gato-marinho", "Góbio",
    "Goraz", "Guaiuba", "Guarajuba", "Guaru",
  ],
  H: [
    "Hadoque", "Hoplias", "Hemiodus", "Halibute",
    "Hápalo",
  ],
  I: [
    "Iau", "Inhacica", "Iriará", "Itararé",
  ],
  J: [
    "Jaú", "Jundiá", "Jurupensém", "Jacundá",
    "Jandiá", "Jatuarana", "Jeju", "Jupará",
  ],
  L: [
    "Linguado", "Lobo", "Lampreia", "Lúcio",
    "Labro", "Lajeado", "Lanceiro", "Lanceta",
    "Lanterninha", "Lapa", "Lichia", "Lija",
    "Limpa-vidro", "Lingado", "Linguado-da-areia", "Linha",
    "Liro", "Lisa", "Lombo", "Louro",
    "Lúcio-pargo",
  ],
  M: [
    "Merluza", "Matrinxã", "Manjuba", "Mero",
    "Molly", "Miraguaia", "Mapará", "Machadinha",
    "Macua", "Mandi-chorão", "Mandim", "Mandipirá",
    "Mangona", "Marimba", "Maroto", "Marlin",
    "Marlin-azul", "Marlin-branco", "Mictófido", "Mixine",
    "Mojarra", "Molinésia", "Morato", "Moreia",
    "Moreia-pintada", "Mucuíba", "Mucum", "Mulata",
    "Murteira", "Mustela",
  ],
  N: [
    "Neon", "Nototênia", "Niquim", "Neon-cardinal",
    "Nhacundá", "Nharé", "Noronha",
  ],
  O: [
    "Olho-de-boi", "Oscar", "Ostracion", "Olhete",
    "Olho-de-cão", "Olho-de-vidro", "Ogcocefálio",
  ],
  P: [
    "Pacu", "Pargo", "Pintado", "Peixe-espada",
    "Peixe-boi", "Pescada", "Piapara", "Piau",
    "Peixe-palhaço", "Pirapitinga", "Pacu-caranha", "Pado",
    "Pagu", "Pira", "Palombeta", "Pampo",
    "Panga", "Pangasius", "Panqueca", "Papiá",
    "Parati", "Pargo-rosa", "Paru", "Passarinho",
    "Patuda", "Pava", "Peixe-anjo", "Peixe-cachorro",
    "Peixe-canivete", "Peixe-cobra", "Peixe-cristal", "Peixe-crocodilo",
    "Peixe-elefante", "Peixe-faca", "Peixe-fita", "Peixe-folha",
    "Peixe-gato", "Peixe-galo", "Peixe-lanterna", "Peixe-leão",
    "Peixe-lua", "Peixe-macaco", "Peixe-martelo", "Peixe-morcego",
    "Peixe-mosquito", "Peixe-parafuso", "Peixe-pedra", "Peixe-piloto",
    "Peixe-pipa", "Peixe-porco", "Peixe-prego", "Peixe-rato",
    "Peixe-rei", "Peixe-sapo", "Peixe-serra", "Peixe-sol",
    "Peixe-trombeta", "Peixe-voador", "Peixe-vidro", "Peixe-zebra",
    "Perca", "Perca-sol", "Pescada-amarela", "Pescada-branca",
    "Pescada-cambucu", "Pescada-foguete", "Pescada-olhuda", "Pescada-real",
    "Pescadinha", "Piau-três-pintas", "Piava", "Piavuçu",
    "Piloto", "Pimenta", "Piaba", "Piabanha",
    "Piraíba", "Piracanjuba", "Pirambeba", "Piranha-caju",
    "Piranha-preta", "Pirapeda", "Piraputanga", "Pirara",
    "Pirarara", "Piratuca", "Pitu", "Plati",
    "Poecília", "Polaca", "Pompano", "Prejereba",
    "Pua",
  ],
  Q: [
    "Quimera", "Quebra-anzol", "Quatro-olhos", "Quimboto",
    "Quinguio",
  ],
  R: [
    "Rodóstomo", "Raia", "Roncador", "Raia-tacha",
    "Raia-viola", "Raia-lixa", "Raia-manta", "Raia-preta",
    "Raia-pintada", "Ralo", "Ramirezi", "Rinchão",
    "Rinoquimera", "Rivelino", "Robalo-flecha", "Robalo-peva",
    "Rombudo", "Rosadinho", "Ruivaca", "Ruivo",
  ],
  S: [
    "Sarda", "Sargo", "Surubim", "Salmonete",
    "Sirigado", "Serra", "Sabalo", "Saboré",
    "Saca-areia", "Saco", "Sado", "Saicanga",
    "Salema", "Salteador", "Sanguinheiro", "Sardinha-verdadeira",
    "Sardinhão", "Sargo-de-dente", "Sargento", "Sauá",
    "Sauris", "Savelha", "Sável", "Selene",
    "Serrana", "Serrano", "Solha", "Solhão",
    "Sombrio", "Sorubim", "Surubim-chicote", "Surubim-lima",
  ],
  T: [
    "Tambaqui", "Truta", "Tetra", "Tamboril",
    "Tarpão", "Tubarão-branco", "Taimen", "Tamoatá",
    "Tambacu", "Tambor", "Tanganica", "Tanga",
    "Tarpon", "Tarta", "Tataíra", "Tetra-neon",
    "Tico-tico", "Tila", "Tilápia-do-nilo", "Tilápia-de-moçambique",
    "Timbira", "Timburé", "Tinga", "Tinguí",
    "Tira-vira", "Tomete", "Torito", "Toro",
    "Torpedo", "Trachino", "Trairão", "Tremedor",
    "Treme-treme", "Truta-arco-íris", "Truta-marinha", "Tubarão-baleia",
    "Tubarão-cabeça-chata", "Tubarão-lixa", "Tubarão-martelo", "Tubarão-mako",
    "Tubarão-tigre", "Tubarão-touro", "Tubarão-azul", "Tucunaré-açu",
    "Tucunaré-amarelo", "Tucunaré-azul", "Tucunaré-fogo", "Tuvira",
  ],
  U: [
    "Ubatã", "Uiraçu", "Uja", "Umbla",
    "Urubitinga", "Urucu",
  ],
  V: [
    "Vermelho", "Viola", "Vairão", "Veja",
    "Velha", "Veludo", "Verdinho", "Verdemã",
    "Viúva", "Viuvinha", "Voador", "Voador-de-fundo",
    "Voador-de-pedra", "Volga",
  ],
  X: [
    "Xixarro", "Xaputa", "Xarelete", "Xaréu-branco",
    "Xaréu-preto", "Xira", "Xingú",
  ],
  Z: [
    "Zebrinha", "Zibelina",
  ],
};
