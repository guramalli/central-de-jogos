// PALAVRAS NOVAS PARA O TEMA "MAMÍFEROS" (antigo "Animais")
//
// ⚠️ ESTE ARQUIVO FOI LIMPO DEPOIS DE CAUSAR UM PROBLEMA.
//
// Ele foi escrito quando o tema se chamava "Animais" e aceitava qualquer
// bicho — tinha 104 não-mamíferos (aves, peixes, insetos). Depois da
// segmentação, rodar o importador RECRIOU todos eles no tema, desfazendo a
// separação em silêncio.
//
// Lição: importador é um arquivo VIVO. Se o tema de destino mudar de escopo,
// o arquivo precisa mudar junto — senão a próxima importação reverte o
// trabalho.
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
    "Ariranha",
  ],
  B: [
    "Bezerro", "Bicho-preguiça", "Búfalo-d'água", "Boto",
  ],
  C: [
    "Carneiro", "Cotia", "Cachalote",
  ],
  D: [
    "Damão", "Dugongo",
  ],
  E: [
    "Égua", "Elefante-marinho", "Equidna", 
  ],
  F: [
    "Fuinha",
  ],
  G: [
    "Gambá", "Gazela",
  ],
  H: [
    "Hamster", "Hipopótamo-pigmeu",
  ],
  I: [
    "Irara",
  ],
  J: [
    "Jaguarundi",
  ],
  L: [
    "Lêmure", "Leopardo", "Lhama",
  ],
  M: [
    "Mamute", "Mandril", "Mabeco", "Muriqui",
  ],
  N: [
    "Nutria", "Narval",
  ],
  O: [
    "Onça-pintada", "Orangotango-de-bornéu",
  ],
  P: [
    "Pangolim",
  ],
  Q: [
    "Queixada", "Quatipuru", 
  ],
  R: [
    "Raposa-do-ártico",
  ],
  S: [
    "Suçuarana",
  ],
  T: [
    "Tamanduá-bandeira", "Tigre-siberiano", "Toupeira",
  ],
  U: [
    "Urso-pardo", "Uacari",
  ],
  V: [
    "Vison", "Veado-campeiro",
  ],
};
