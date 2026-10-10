// Jocelino — clientela.js — os moradores da Vila como fregueses da pensão (os clientes fixos do Bancho e a agenda dos
// aldeões do Stardew, que vão ao saloon em dias certos): cada um tem um dia da semana e um prato favorito; chega entre
// 17h30 e 19h além dos clientes da noite, pede o favorito se a Rosa sabe fazer e, bem servido, ganha um coração de
// amizade (G.amizade) e dá uma curtida a mais. E os filhos: em 1 de cada 3 noites a Ritinha fica no caixa (gorjeta 10%
// maior) ou o Zezinho aparece (recolhe louça devagarinho... ou rouba uma cocada da panela).

// Dia da semana (0 = segunda ... 5 = sábado; domingo a pensão fecha) → quem vem e o que gosta.
const CLIENTELA = {
  0: [{ id: 'bira', nome: 'Mestre Bira', prato: 'pf_peao', fala: 'Rosa, o de sempre! Segunda é dia de sustância.', elogio: 'Isso é que é PF! Amanhã levanto três paredes.' },
      { id: 'ze', nome: 'Zé', prato: 'marmita_peao', fala: 'Cheguei cantando, Dona Rosa! Tem marmita?', elogio: 'Lá lá laiá! Linguiça boa dá até samba!' }],
  1: [{ id: 'tonico', nome: 'Seu Tonico', prato: 'peixe_frito', fala: 'Martelei o dia inteiro. Um peixinho, Rosa?', elogio: 'Crocante que nem ferradura nova!' },
      { id: 'dona_cida', nome: 'Dona Cida', prato: 'sopa_pedra', fala: 'Terça eu não cozinho, minha filha. Vim pra sopa.', elogio: 'Essa sopa cura até fofoca!' }],
  2: [{ id: 'ananias', nome: 'Seu Ananias', prato: 'goiabada', fala: 'Fechei o depósito cedo. Tem doce hoje?', elogio: 'Goiabada assim eu vendia no depósito!' },
      { id: 'zelia', nome: 'Dona Zélia', prato: 'cocada_tijolinho', fala: 'Quarta é meu dia de me dar um agrado.', elogio: 'Ai, que cocada! Vou contar pra Vila inteira.' }],
  3: [{ id: 'juca', nome: 'Tio Juca', prato: 'moqueca', fala: 'Sobrinho, o cheiro chegou lá em casa. Vim conferir.', elogio: 'Igualzinha à de Aracaju. A Rosa é danada!' },
      { id: 'lourival', nome: 'Seu Lourival', prato: 'peixe_frito', fala: 'Pesquei ontem, juro! Frita um pra mim?', elogio: 'Esse eu não pesquei, mas vou dizer que sim.' }],
  4: [{ id: 'severino', nome: 'Severino', prato: 'pf_peao', fala: 'Sexta tem samba. Antes, um PF caprichado.', elogio: 'Feijão desse jeito dá até vontade de sambar.' },
      { id: 'tonhao', nome: 'Tonhão', prato: 'marmita_peao', fala: 'Rosa, hoje eu como três. Já avisando.', elogio: 'Bota a segunda! E a terceira!' }],
  5: [{ id: 'lurdes', nome: 'Dona Lurdes', prato: 'bolo_milho', fala: 'Sábado eu venho pelo bolo. E pela prosa.', elogio: 'Fofinho! Me passa a receita, Rosa?' },
      { id: 'paulo', nome: 'Paulo', prato: 'pamonha', fala: 'Ouvi dizer que tem pamonha de Aracaju aqui.', elogio: 'Pamonha, pamonha! Agora entendi a fama.' }],
};
const Clientela = {
  CHEGA_DE: 17 * 60 + 30, CHEGA_ATE: 19 * 60, GORJETA_RITINHA: 0.10,
  dado(id) { for (const d in CLIENTELA) { const c = CLIENTELA[d].find(x => x.id === id); if (c) return c; } return null; },
  // O cliente do turno: o nome e a mania (Lourival cheira a peixe, Tonhão pede três vezes) vêm de Pratos.CLIENTES quando ele já existia.
  cliente(id) {
    const d = Clientela.dado(id), base = Pratos.CLIENTES.find(c => c.id === id);
    return { id, nome: d ? d.nome : (base ? base.nome : id), mania: base ? base.mania : '', morador: true };
  },
  // Quem vem jantar hoje (vazio no domingo e com a pensão fechada); o favorito só vale se a Rosa sabe fazer.
  daNoite(p, dia) {
    if (!p || !['aberta', 'pronta'].includes(p.estado)) return [];
    const wd = (dia - 1) % 7;
    return (CLIENTELA[wd] || []).map(c => Object.assign(Clientela.cliente(c.id), { favorito: p.receitas.includes(c.prato) ? c.prato : '' }));
  },
  // Põe os moradores do dia na fila do turno (além dos clientes da noite), sem repetir quem já vinha por acaso.
  porNaFila(t, p, dia) {
    const vem = Clientela.daNoite(p, dia), n = vem.length;
    t._fila = t._fila.filter(f => !vem.some(c => c.id === f.cliente.id));
    vem.forEach((c, k) => t._fila.push({ minuto: Clientela.CHEGA_DE + Math.round((Clientela.CHEGA_ATE - Clientela.CHEGA_DE) * (k + 0.5) / n), cliente: c }));
    t._fila.sort((a, b) => a.minuto - b.minuto);
    return vem;
  },
  registrarAmizade(am, ids) { for (const id of ids || []) am[id] = (am[id] || 0) + 1; return am; },
  // Em 1 de cada 3 noites um dos filhos aparece (alternando); nunca no domingo.
  filhoDaNoite(dia) { if ((dia - 1) % 7 === 6 || dia % 3 !== 0) return ''; return Math.floor(dia / 3) % 2 ? 'ritinha' : 'zezinho'; },
};

// ---------- o Doutor Paladar ----------
// O crítico exigente do Dave, do nosso jeito: 1 vez por estação (a partir do degrau 2), numa noite sorteada, chega
// disfarçado de cliente comum (chapéu-coco, bigode, caderninho). A nota, de 1 a 5 garfos, sai dos critérios: base 1,
// +1 atendido rápido, +1 sem louça suja no balcão na hora, +1 bebida na medida, +1 prato caprichado (nível 3+) ou raro
// (★★★+). Se vai embora sem comer, 1 garfo. A melhor nota fica em p.garfos (os degraus 5 e 6 pedem 4 e 5) e a matéria
// sai na Gazeta no dia seguinte, por carta.
const Paladar = {
  GRAU: 2,
  cliente() { return { id: 'paladar', nome: 'Cliente de chapéu-coco', mania: 'paladar' }; },
  // A noite da estação (dia absoluto): entre o 9º e o 22º dia dela, nunca no domingo.
  noiteDaEstacao(est) { let d = est * 28 + 9 + Math.floor(mulberry(est * 977 + 13)() * 14); if ((d - 1) % 7 === 6) d++; return d; },
  vem(p, dia) { return !!p && ['aberta', 'pronta'].includes(p.estado) && p.grau() >= Paladar.GRAU && dia === Paladar.noiteDaEstacao(Math.floor((dia - 1) / 28)); },
  nota(c) { return clamp(1 + (c.rapido ? 1 : 0) + (c.louca === 0 ? 1 : 0) + (c.medida ? 1 : 0) + (c.nivel >= 3 || c.raridade >= 3 ? 1 : 0), 1, 5); },
  materia(n) {
    return ['', 'Pensão da Rosa: o crítico saiu sem jantar. "Esperei, esperei... e nada." Um garfo, por educação.',
      'Pensão da Rosa: comida honesta, serviço que precisa de ajuste. Dois garfos.',
      'Pensão da Rosa: boa surpresa na Vila Maré. Três garfos, e a promessa de voltar.',
      'Pensão da Rosa: tempero de mãe, atendimento ligeiro, balcão limpo. Quatro garfos!',
      'Pensão da Rosa: perfeita. Cinco garfos, nota máxima. Melhor mesa do litoral!'][n] + '\n\n— Doutor Paladar, Gazeta de Santos';
  },
};
INICIADORES.push(s => { for (const x of (G.pensao && G.pensao.paladarNotas) || []) if (!CARTAS['paladar_' + x.dia]) CARTAS['paladar_' + x.dia] = { de: 'Gazeta de Santos', dia: x.dia + 1, texto: Paladar.materia(x.nota) }; });
INICIADORES.push(s => { G.amizade = Object.assign({}, s.amizade || {}); });
COLETORES.push(s => { s.amizade = Object.assign({}, G.amizade); });
