// PALAVRAS NOVAS PARA O TEMA "COR"
//
// Escritas contra a lista atual (72 palavras) — nenhuma repete.
//
// IDIOMA: português (ver CRITERIO-IDIOMA.js). "Pink" já está cadastrada e é
// exceção legítima, porque virou palavra corrente aqui; mas não vou somar
// "blue", "red" e companhia.
//
// CRITÉRIO: nome de cor que alguém escreveria na rodada. Entram:
//   - cores compostas com hífen ("azul-marinho", "verde-água"), que é como
//     a pessoa realmente digita
//   - cores que vêm de material ou fruta ("cobre", "pêssego", "musgo"),
//     desde que sejam usadas como cor de fato
//
// FICAM DE FORA qualidades que não são cor — "claro", "escuro", "fosco",
// "brilhante". O glossário atual tem "Quente", "Turva", "Neutra" e "Neutro",
// que caem nessa categoria e valeria a pena revisar.
//
// SOBRE A LETRA X: o português não tem nome de cor com X. Não inventei
// nenhum. Se a letra atrapalhar na prática, o caminho é reduzir o peso dela
// no sorteio — X já é a mais rara (peso 0,2), então sai pouquíssimo.
export const COR_NOVAS = {
  A: [
    "Açafrão", "Alaranjado", "Amêndoa", "Areia", "Azul-marinho",
    "Azul-claro", "Azul-escuro", "Azeviche", "Acinzentado", "Avermelhado",
    "Alabastro",
  ],
  B: [
    "Bronze", "Berinjela", "Baunilha", "Borgonha", "Branco-gelo",
  ],
  C: [
    "Caramelo", "Canela", "Cereja", "Castanho", "Champanhe",
    "Cáqui", "Carmesim", "Celeste", "Chumbo", "Cru",
    "Cinza-chumbo", "Cobalto",
  ],
  D: [
    "Damasco",
  ],
  E: [
    "Esverdeado", "Encarnado", "Espuma-do-mar",
  ],
  F: [
    "Framboesa", "Fumê",
  ],
  G: [
    "Granada", "Goiaba", "Girassol",
  ],
  H: [
    "Hena", "Heliotrópio",
  ],

  J: [
    "Jacarandá", "Jeans",
  ],
  L: [
    "Lima", "Limão", "Lavanda", "Latão", "Laranja-queimado",
  ],
  M: [
    "Musgo", "Mel", "Menta", "Malva", "Mogno",
  ],
  N: [
    "Nata",
  ],
  O: [
    "Opala", "Ostra",
  ],
  P: [
    "Pêssego", "Pastel", "Prateado", "Pardo", "Petróleo",
    "Pistache", "Papoula",
  ],

  R: [
    "Rubro", "Rosé", "Rosado", "Rosa-choque", "Ruivo",
    "Rosa-claro", "Roxo-escuro",
  ],
  S: [
    "Sépia", "Siena", "Safira", "Sálvia",
  ],
  T: [
    "Tijolo", "Trigo", "Tangerina", "Topázio",
  ],
  U: [
    "Ultramar", "Ultravioleta",
  ],
  V: [
    "Verde-água", "Verde-limão", "Verde-oliva", "Verde-musgo", "Violáceo",
    "Vermelho-escuro", "Verde-escuro", "Verde-claro",
  ],
  Z: [
    "Zarcão",
  ],
};
