// PALAVRAS NOVAS PARA O TEMA "ANIMAIS"
//
// Escritas mirando os buracos reais do glossário (saída do listar-palavras):
// X estava vazia, e 18 letras tinham menos de 8 palavras.
//
// CRITÉRIO: animal real, com nome EM PORTUGUÊS usado no Brasil.
//
// Ficam de fora:
//   - estrangeirismos: "ibex" é cabra-montês, "zorro" é raposa, "quokka"
//     não tem nome corrente em português
//   - raças: "dálmata" e "siamês" são raça, não animal, e aceitar abriria a
//     porta pra centenas de variações
//   - termos técnicos: ninguém digita "isópode" ou "quelônio" numa rodada
//   - nomes regionais de Portugal desconhecidos aqui
//
// A normalização tira acento e caixa, então não repito "leão"/"leao".
//
// SOBRE A LETRA X: o português tem pouquíssimos animais com X, e os que
// existem são regionais (peixes e aves do Nordeste e da Amazônia). Listei só
// os que existem de fato. Se ainda assim a letra ficar frustrante na rodada,
// o caminho é reduzir o peso dela no sorteio — inventar animal seria pior.
export const ANIMAIS_NOVAS = {
  A: [
    "Arraia", "Avestruz", "Andorinha", "Ariranha", "Anaconda",
    "Albatroz", "Araçari", "Anu", "Acará",
  ],
  B: [
    "Bem-te-vi", "Besouro", "Bezerro", "Bicho-preguiça", "Barata",
    "Bagre", "Baiacu", "Búfalo-d'água", "Bicho-da-seda", "Boto",
  ],
  C: [
    "Camaleão", "Caranguejo", "Carneiro", "Cotia", "Cupim",
    "Cavalo-marinho", "Cágado", "Cobra-coral", "Codorna", "Cachalote",
    "Caracol", "Carrapato",
  ],
  D: [
    "Dourado", "Damão", "Dugongo", "Dourada",
  ],
  E: [
    "Égua", "Elefante-marinho", "Estrela-do-mar", "Emu", "Equidna",
    "Esturjão",
  ],
  F: [
    "Faisão", "Flamingo", "Fuinha", "Frango", "Formiga-cortadeira",
    "Fragata",
  ],
  G: [
    "Ganso", "Gafanhoto", "Gavião", "Gralha", "Grilo",
    "Guará", "Garça", "Gambá", "Galinha", "Gazela",
  ],
  H: [
    "Hamster", "Harpia", "Hidra", "Hipocampo", "Hipopótamo-pigmeu",
  ],
  I: [
    "Íbis", "Irara", "Inhambu",
  ],
  J: [
    "João-de-barro", "Jibóia", "Jaguarundi", "Jararaca", "Jaburu",
    "Juriti", "Joaninha",
  ],
  L: [
    "Lagartixa", "Lagosta", "Lêmure", "Leopardo", "Libélula",
    "Lula-gigante", "Lambari", "Lhama", "Louva-a-deus", "Lagarta",
  ],
  M: [
    "Mosca", "Mosquito", "Marreco", "Maritaca", "Mamute",
    "Marimbondo", "Minhoca", "Mandril", "Mandi", "Mexilhão",
    "Mabeco", "Muriqui",
  ],
  N: [
    "Nutria", "Narval", "Nhandu",
  ],
  O: [
    "Ostra", "Ouriço", "Onça-pintada", "Osga", "Orangotango-de-bornéu",
    "Oropêndola",
  ],
  P: [
    "Pavão", "Perereca", "Piranha", "Pardal", "Percevejo",
    "Pernilongo", "Pombo", "Pirarucu", "Pangolim", "Peru",
    "Piolho", "Poraquê",
  ],
  Q: [
    "Queixada", "Quatipuru", "Quiriquiri",
  ],
  R: [
    "Raposa-do-ártico", "Rouxinol", "Robalo", "Rã-touro", "Rêmora",
  ],
  S: [
    "Salamandra", "Sardinha", "Serpente-cascavel", "Siri", "Sabiá",
    "Seriema", "Salmão", "Sanguessuga", "Suçuarana", "Socó",
  ],
  T: [
    "Tamanduá-bandeira", "Tucunaré", "Tilápia", "Traíra", "Tuiuiú",
    "Tainha", "Tigre-siberiano", "Toupeira",
  ],
  U: [
    "Uirapuru", "Urutu", "Ubarana", "Urso-pardo", "Uacari",
  ],
  V: [
    "Vespa", "Víbora", "Vison", "Veado-campeiro", "Vaga-lume",
    "Verdelhão",
  ],
  X: [
    "Xaréu", "Xexéu", "Xerelete",
  ],
  Z: [
    "Zangão", "Zabelê",
  ],
};
