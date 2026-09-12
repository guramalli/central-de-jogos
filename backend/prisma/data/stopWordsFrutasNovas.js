// PALAVRAS NOVAS PARA O TEMA "FRUTAS"
//
// Escritas contra a lista atual (99 palavras) — nenhuma repete.
//
// PROBLEMAS ENCONTRADOS NO GLOSSÁRIO ATUAL, que valem revisão no painel:
//   - "manga" está cadastrada na letra N e "morango" na letra V. Palavra na
//     letra errada VALE PONTO quando aquela letra é sorteada.
//   - "xerez" está em X, mas é um vinho, não fruta.
//   - há vários pares repetidos só por acento ou caixa ("graviola/graviola",
//     "cereja/cereja"). A normalização já trata isso, então são linhas
//     duplicadas à toa — inofensivas, mas inflam a contagem do tema.
//
// IDIOMA: português (ver CRITERIO-IDIOMA.js). Entram os nomes regionais
// brasileiros, que é o que faz este tema render — "bacuri", "pitomba",
// "grumixama". Quem joga escreve isso.
//
// CRITÉRIO: fruta de verdade. Ficam de fora legumes e hortaliças. O tomate
// já está cadastrado e é o caso clássico de discussão — botanicamente fruto,
// na cozinha brasileira não. Deixei como está, mas fica o registro.
//
// LETRAS H E Z: ficam VAZIAS, e é o correto.
//
// Cheguei a incluir "zimbro" em Z, mas ele não é fruta: é um cone de
// conífera, parente do pinheiro, usado como tempero (é o que dá sabor ao
// gin). Botanicamente não é fruto, e num tema de frutas validaria resposta
// errada pra sempre.
//
// Preencher letra difícil é justamente onde a tentação de inventar aparece.
// Letra vazia e honesta é melhor: se H e Z atrapalharem na prática, o
// caminho é reduzir o peso delas no sorteio.
export const FRUTAS_NOVAS = {
  A: [
    "Ata", "Abiu", "Abricó", "Anona", "Amora-preta",
  ],
  B: [
    "Bacaba", "Bacupari", "Biribá", "Butiá",
  ],
  C: [
    "Castanha", "Cidra", "Camu-camu", "Cambuci", "Cacau",
    "Cajarana", "Cajá-manga",
  ],
  D: [
    "Durião",
  ],
  F: [
    "Fruta-pão", "Feijoa", "Figo-da-índia",
  ],
  G: [
    "Grumixama", "Guabiroba",
  ],
  J: [
    "Juçara", "Jatobá", "Jaracatiá",
  ],
  L: [
    "Laranja-lima", "Limão-siciliano", "Lima-da-pérsia",
  ],
  M: [
    "Mangaba", "Mexerica", "Mirtilo", "Macadâmia", "Mamão-papaia",
    "Marmelo",
  ],
  N: [
    "Noz-pecã",
  ],
  P: [
    "Pequi", "Pupunha", "Pomelo", "Pitomba", "Pinhão",
    "Papaia",
  ],
  R: [
    "Rambutão",
  ],
  S: [
    "Sapucaia",
  ],
  T: [
    "Taperebá", "Tamarilo",
  ],
  U: [
    "Uxi", "Umari",
  ],
};
