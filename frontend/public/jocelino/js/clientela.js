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
INICIADORES.push(s => { G.amizade = Object.assign({}, s.amizade || {}); });
COLETORES.push(s => { s.amizade = Object.assign({}, G.amizade); });
