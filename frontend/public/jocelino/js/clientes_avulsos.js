// Jocelino — clientes_avulsos.js — SÓ DADOS: fregueses de fora, de passagem pela Pensão da Rosa (não moram na Vila).
// O turno da janta (turno_janta.js) mistura estes com os moradores na fila do salão, para o jogador sentir que vem gente
// diferente toda noite.
// Arte: a/personagens/<id>/andar (folha 4x4 igual à dos moradores) e a/retratos/<id>_normal e <id>_alegre.
// Feitos por ferramentas_arte/produzir_clientes.sh (descrições em ferramentas_arte/pecas_clientes.txt).
//   id      — nome da arte
//   nome    — como aparece no balão e no caderno
//   apelido — como a Rosa chama o freguês
//   curto   — uma linha para identificar quem é
//   de      — de onde vem
//   sexo    — 'h' ou 'm' (para concordância nas falas)
//   jeito   — (14/10, Tarefa E1) apressado, paciente, exigente ou generoso: muda a paciência e a gorjeta (os números em
//             ECO.pensao.jeitos); a fala curta (FALAS_AVULSOS, palco.js) combina com ele

const CLIENTES_AVULSOS = [
	{ id: 'cliente_hiroshi', nome: 'Seu Hiroshi Nakamura', apelido: 'Seu Hiroshi', sexo: 'h', jeito: 'exigente',
		curto: 'japonês da Liberdade, de óculos e camisa social', de: 'Liberdade, São Paulo' },
	{ id: 'cliente_jorge', nome: 'Jorge Luís da Silva', apelido: 'Jorginho Black', sexo: 'h', jeito: 'apressado',
		curto: 'rapaz de black power e camisa estampada', de: 'Santos' },
	{ id: 'cliente_dandara', nome: 'Dandara Conceição', apelido: 'Dandara', sexo: 'm', jeito: 'generoso',
		curto: 'moça de tranças longas e vestido colorido', de: 'São Vicente' },
	{ id: 'cliente_severiano', nome: 'Seu Severiano Bezerra', apelido: 'Seu Severiano', sexo: 'h', jeito: 'paciente',
		curto: 'vaqueiro paraibano de chapéu de couro', de: 'Campina Grande, Paraíba' },
	{ id: 'cliente_greta', nome: 'Greta Schneider', apelido: 'a Alemoa', sexo: 'm', jeito: 'paciente',
		curto: 'turista loira de chapéu de palha e máquina fotográfica', de: 'Blumenau, Santa Catarina' },
	{ id: 'cliente_dona_pina', nome: 'Dona Giuseppina Bianchi', apelido: 'Dona Pina', sexo: 'm', jeito: 'exigente',
		curto: 'senhora italiana da Mooca, baixinha, de avental e coque', de: 'Mooca, São Paulo' },
	{ id: 'cliente_caicara', nome: 'Seu Jovino dos Santos', apelido: 'Jovino Caiçara', sexo: 'h', jeito: 'apressado',
		curto: 'pescador caiçara de chapéu de palha e regata', de: 'Ilha Comprida' },
	{ id: 'cliente_ana', nome: 'Ana Maria Ribeiro', apelido: 'Aninha da Faculdade', sexo: 'm', jeito: 'apressado',
		curto: 'estudante de óculos redondos, com livros no braço', de: 'São Paulo' },
	{ id: 'cliente_benedito', nome: 'Seu Benedito Ferreira', apelido: 'Seu Dito', sexo: 'h', jeito: 'paciente',
		curto: 'senhor de boina e bengala, de barba branca', de: 'Cubatão' },
	{ id: 'cliente_luana', nome: 'Luana Moreira', apelido: 'Luana do Surfe', sexo: 'm', jeito: 'generoso',
		curto: 'surfista de cabelo queimado de sol e flor na orelha', de: 'Guarujá' },
];

// (14/10, Tarefa E1) O jeito de cada freguês de fora: o nome que aparece no clique, o que ele muda (dito para o jogador) e o ícone
// discreto em cima da cabeça enquanto espera (arte que já existe; o paciente não tem ícone, o jeito dele aparece só no clique).
// {estrelas} na dica: o ECO.pensao.jeitos.exigente.estrelasGorjeta (palco.js, jeitoDoAvulso).
const JEITOS_AVULSO = {
	apressado: { nome: 'apressado', dica: 'pouca paciência; servido rápido, a gorjeta é boa', icone: 'fx/gota', escala: 3.2 },
	paciente: { nome: 'paciente', dica: 'espera mais, sem reclamar', icone: '', escala: 1 },
	exigente: { nome: 'exigente', dica: 'só dá gorjeta com {estrelas} estrelas; quando gosta, curte mais', icone: 'ui/garfo_nota', escala: 1.1 },
	generoso: { nome: 'generoso', dica: 'deixa uma gorjeta maior', icone: 'salao/moedas_balcao', escala: 1.3 },
};
