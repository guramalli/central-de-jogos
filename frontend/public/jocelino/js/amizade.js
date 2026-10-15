// Jocelino — amizade.js — a amizade do povo da Vila em pontos (T1 das conversas e histórias; spec
// docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seção 4.1).
// Como no Stardew (Friendship: 250 pontos = 1 coração, até 10), do nosso jeito: 100 pontos = 1 coração, de 0 a 10 (no máximo
// 1.000). Conversar dá +10 uma vez por dia; o favorito bem servido na janta +25; o recado ou o serviço do quadro +50; a missa e a
// festa do bairro +10. Não cai por falta de conversa (o jogo é aconchegante). A Lábia (habilidades.js) faz a amizade subir 50%
// mais rápido. A FAMÍLIA (Rosa, Tio Juca, Ritinha e Zezinho) NÃO tem número (decisão 3 do dono): tem as histórias e o carinho.
// Todo lugar que mexe na amizade chama Amizade.ganhar; todo lugar que lê usa Amizade.pontos/coracoes.
// O save antigo (antes da T1, +1 por coisa boa) migra uma vez: quem é da Vila e tinha N passa a ter N × 25; as chaves da família
// somem; a marca s.amizadePontos diz que já migrou.

const Amizade = {
  POR_CORACAO: 100, MAX_CORACOES: 10, MAX: 1000, MIGRA: 25, LABIA: 1.5,
  FAMILIA: ['rosa', 'juca', 'ritinha', 'zezinho'],
  NAO_CONTA: ['cachorro', 'viajante'],   // o cachorro da Vila e o Viajante (passa e vai embora) não fazem amizade
  // A mesma pessoa com dois ids no código: a Dona Cida é 'cida' no Bairro Novo (a padaria, a festa) e 'dona_cida' na janta (o retrato).
  ALIAS: { cida: 'dona_cida' },
  // Os pontos de cada coisa (seção 4.1). Presente e aniversário ficam prontos para a T5.
  PONTOS: { conversa: 10, janta: 25, recado: 50, servico: 50, missa: 10, festa: 10,
    presente: { ama: 40, gosta: 20, neutro: 10, nao_gosta: -10, odeia: -20 }, aniversario: 5 },

  // O id da amizade de um id qualquer (o alias) e de um morador do mapa (o dono do Bairro Novo, o balcão do comércio, a escola).
  id(id) { id = String(id || ''); return Amizade.ALIAS[id] || id; },
  idDe(p) {
    const id = String((p && p.id) || '');
    if (id.startsWith('dono_')) return Amizade.id(id.slice(5));
    if (id.startsWith('balcao_')) { const t = id.slice(7), K = typeof COMERCIOS !== 'undefined' && COMERCIOS[t]; return Amizade.id(K ? K.dono : t); }
    if (id.startsWith('escola_')) return Amizade.id(id.slice(7));
    return Amizade.id(id);
  },
  familia(id) { return Amizade.FAMILIA.includes(Amizade.id(id)); },
  // Quem tem corações: gente que não é da família (nem o cachorro, nem o Viajante).
  daVila(id) { id = Amizade.id(id); return !!id && !Amizade.FAMILIA.includes(id) && !Amizade.NAO_CONTA.includes(id); },
  pontos(id) { const am = G.amizade || {}; return Math.max(0, Math.min(Amizade.MAX, am[Amizade.id(id)] || 0)); },
  coracoes(id) { return Math.floor(Amizade.pontos(id) / Amizade.POR_CORACAO); },
  // Os pontos de uma coisa com a Lábia (para o texto na tela dizer o mesmo que a conta).
  // (só número: um motivo que aponta para uma tabela, como 'presente', vale 0; ver o aviso no ganhar)
  valor(motivo) { const m = typeof motivo === 'number' ? motivo : Amizade.PONTOS[motivo], v = typeof m === 'number' ? m : 0; return v > 0 && Amizade._labia() ? Math.round(v * Amizade.LABIA) : v; },
  // O nome de quem tem amizade (o cliente da janta, o dono do Bairro Novo, o peão, quem pede recado).
  NOMES: { santos: 'Seu Moreira', tiao: 'Tião', rosa: 'Rosa', juca: 'Tio Juca', ritinha: 'Ritinha', zezinho: 'Zezinho' },
  nome(id) {
    id = Amizade.id(id); const c = typeof Clientela !== 'undefined' && Clientela.dado(id), p = typeof PEOES !== 'undefined' && PEOES.find(x => x.id === id);
    return Amizade.NOMES[id] || (c && c.nome) || (typeof CLIENTE_NOME !== 'undefined' && CLIENTE_NOME[id]) || (typeof RECADO_NOME !== 'undefined' && RECADO_NOME[id]) || (p && p.nome)
      || (id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '));
  },
  // "+25 de amizade" para a tela (vazio para a família, que não tem número).
  texto(id, motivo) { const v = Amizade.daVila(id) ? Amizade.valor(motivo) : 0; return v > 0 ? `+${v} de amizade` : ''; },
  _labia() { return typeof Habilidades !== 'undefined' && Habilidades.tem('labia'); },
  // Soma (ou tira) pontos de uma pessoa da Vila, entre 0 e 1.000. Devolve quanto mudou de fato (0 para a família, que não tem número).
  // ATENÇÃO: o motivo-string só serve para os pontos que são número (conversa, janta, recado, servico, missa, festa). O que aponta
  // para uma tabela (ex.: 'presente', que tem ama/gosta/...) dá 0: passe o número, ex.
  // Amizade.ganhar(id, Amizade.PONTOS.presente.gosta * (aniversario ? Amizade.PONTOS.aniversario : 1), 'presente').
  ganhar(id, pts, motivo = '') {
    id = Amizade.id(id); if (!Amizade.daVila(id)) return 0;
    const am = G.amizade || (G.amizade = {}), antes = am[id] || 0;
    const v = Amizade.valor(typeof pts === 'number' ? pts : Amizade.PONTOS[pts] || 0);
    am[id] = Math.max(0, Math.min(Amizade.MAX, antes + v));
    const mudou = am[id] - antes;
    if (mudou) Amizade._hoje().push({ id, pontos: mudou, motivo: motivo || (typeof pts === 'string' ? pts : '') });
    return mudou;
  },
  ganharVarios(ids, pts, motivo) { let t = 0; for (const id of ids || []) t += Amizade.ganhar(id, pts, motivo); return t; },
  // O que subiu hoje, coisa por coisa ({ id, pontos, motivo }); some na virada do dia (não vai no save).
  _reg: { dia: 0, lista: [] },
  _hoje() { if (Amizade._reg.dia !== G.dia) Amizade._reg = { dia: G.dia, lista: [] }; return Amizade._reg.lista; },
  doDia() { return Amizade._hoje().slice(); },
  // A conversa: +10 na 1ª do dia com cada pessoa (como no Stardew, que conta a conversa uma vez por dia).
  conversouHoje(id) { return (G.amizadeConversa || {})[Amizade.id(id)] === G.dia; },
  conversar(id) {
    id = Amizade.id(id); if (!Amizade.daVila(id) || Amizade.conversouHoje(id)) return 0;
    (G.amizadeConversa || (G.amizadeConversa = {}))[id] = G.dia;
    return Amizade.ganhar(id, 'conversa', 'conversa');
  },
  // O save antigo (sem a marca): ×25 para a Vila (no teto de 1.000), sem a família; o alias junta a mesma pessoa.
  migrar(velho) {
    const novo = {};
    for (const k in velho || {}) { const id = Amizade.id(k), n = Number(velho[k]) || 0; if (!Amizade.daVila(id) || n <= 0) continue; novo[id] = (novo[id] || 0) + n * Amizade.MIGRA; }
    for (const id in novo) novo[id] = Math.min(Amizade.MAX, novo[id]);
    return novo;
  },
  iniciar(s) {
    G.amizade = s.amizadePontos ? Object.assign({}, s.amizade || {}) : Amizade.migrar(s.amizade);
    for (const k of Amizade.FAMILIA) delete G.amizade[k];
    G.amizadeConversa = Object.assign({}, s.amizadeConversa || {});
    Amizade._reg = { dia: 0, lista: [] };
  },
  salvar(s) { s.amizade = Object.assign({}, G.amizade || {}); s.amizadePontos = true; s.amizadeConversa = Object.assign({}, G.amizadeConversa || {}); },
};
INICIADORES.push(s => Amizade.iniciar(s));
COLETORES.push(s => Amizade.salvar(s));
// Toda conversa com alguém da Vila conta (a 1ª do dia), mesmo quando outro sistema toma a conversa (o recado, o balcão do comércio).
ANTES_DE_CONVERSAR.unshift(p => { try { Amizade.conversar(Amizade.idDe(p)); } catch (e) { console.error(e); } return false; });
