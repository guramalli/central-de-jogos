// Jocelino — clientes_avulsos.js — SÓ DADOS: fregueses de fora, de passagem pela Pensão da Rosa (não moram na Vila).
// Ainda não está ligado no jogo (nem no index.html): quem for usar mistura estes com os moradores na fila do salão,
// para o jogador sentir que vem gente diferente toda noite.
// Arte: a/personagens/<id>/andar (folha 4x4 igual à dos moradores) e a/retratos/<id>_normal e <id>_alegre.
// Feitos por ferramentas_arte/produzir_clientes.sh (descrições em ferramentas_arte/pecas_clientes.txt).
//   id      — nome da arte
//   nome    — como aparece no balão e no caderno
//   apelido — como a Rosa chama o freguês
//   curto   — uma linha para identificar quem é
//   de      — de onde vem
//   sexo    — 'h' ou 'm' (para concordância nas falas)

const CLIENTES_AVULSOS = [
	{ id: 'cliente_hiroshi', nome: 'Seu Hiroshi Nakamura', apelido: 'Seu Hiroshi', sexo: 'h',
		curto: 'japonês da Liberdade, de óculos e camisa social', de: 'Liberdade, São Paulo' },
	{ id: 'cliente_jorge', nome: 'Jorge Luís da Silva', apelido: 'Jorginho Black', sexo: 'h',
		curto: 'rapaz de black power e camisa estampada', de: 'Santos' },
	{ id: 'cliente_dandara', nome: 'Dandara Conceição', apelido: 'Dandara', sexo: 'm',
		curto: 'moça de tranças longas e vestido colorido', de: 'São Vicente' },
	{ id: 'cliente_severiano', nome: 'Seu Severiano Bezerra', apelido: 'Seu Severiano', sexo: 'h',
		curto: 'vaqueiro paraibano de chapéu de couro', de: 'Campina Grande, Paraíba' },
	{ id: 'cliente_greta', nome: 'Greta Schneider', apelido: 'a Alemoa', sexo: 'm',
		curto: 'turista loira de chapéu de palha e máquina fotográfica', de: 'Blumenau, Santa Catarina' },
	{ id: 'cliente_dona_pina', nome: 'Dona Giuseppina Bianchi', apelido: 'Dona Pina', sexo: 'm',
		curto: 'senhora italiana da Mooca, baixinha, de avental e coque', de: 'Mooca, São Paulo' },
	{ id: 'cliente_caicara', nome: 'Seu Jovino dos Santos', apelido: 'Jovino Caiçara', sexo: 'h',
		curto: 'pescador caiçara de chapéu de palha e regata', de: 'Ilha Comprida' },
	{ id: 'cliente_ana', nome: 'Ana Maria Ribeiro', apelido: 'Aninha da Faculdade', sexo: 'm',
		curto: 'estudante de óculos redondos, com livros no braço', de: 'São Paulo' },
	{ id: 'cliente_benedito', nome: 'Seu Benedito Ferreira', apelido: 'Seu Dito', sexo: 'h',
		curto: 'senhor de boina e bengala, de barba branca', de: 'Cubatão' },
	{ id: 'cliente_luana', nome: 'Luana Moreira', apelido: 'Luana do Surfe', sexo: 'm',
		curto: 'surfista de cabelo queimado de sol e flor na orelha', de: 'Guarujá' },
];
