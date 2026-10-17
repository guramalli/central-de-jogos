// Jocelino — conversas.js — o motor de falas (T2 das conversas e histórias; spec
// docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seções 3.1 e 3.2).
// Como no Stardew (Modding:Dialogue): cada morador tem uma tabela de falas, uma para cada situação, e o jogo testa as situações
// NUMA ORDEM FIXA; vale a primeira que casar. A emoção vai na página, como prefixo ("@alegre Que bom!"): o retrato troca para
// <pessoa>_alegre (ui.js, abrirPlaca); sem prefixo, o _normal; se a arte daquela emoção não existe, volta para o _normal sem erro.
//
// CONVERSAS[id] = { nome?, aniversario?: [estação 0..3, dia 1..28], primeira?: [páginas], depois?: fn, linhas: [
//   { quando: { ... }, fala: [páginas] | (ctx) => [páginas], uma?: true, depois?: fn, id?: 'chave do uma' }, ... ] }
// As condições do `quando` (todas precisam casar):
//   topico: 'id' (G.topicos[id] >= hoje; cada pessoa comenta uma vez)  aniversario: true (é o dia da pessoa)
//   festa: true | 'id' | ['id'...] (FESTAS_DO_DIA)                     se: () => bool (o estado do jogo)    ato: N | [N...] (G.ato)
//   lugar: 'quintal'|'vila'|'praia'|'obra'|'pensao'|'bairro'|'mata'|'pedreira'|'gremio' (ou lista)
//   estacao: 'Outono'|0..3   dia: 1..28 (com a estação: a data fixa)   chuva: true (com chuva, 50% de chance) | false
//   semana: 'domingo'|'Dom'|0..6 (0 = segunda, como o SEMANA)          coracoes: N (N corações ou mais; só o povo da Vila)
//   ano: 1 (o 1º ano) | 2 (do 2º em diante)
//   encomenda: true (a pessoa marcou a festa dela na pensão: do dia do aviso até a noite) | 'depois' (a festa saiu, ontem ou hoje)
//     | 'deixa' (não saiu: a despensa não deu, a pensão não abriu) — as encomendas de festa (encomendas.js; E3). Vale como a festa
//     (a regra 4): a fala da festa passa na frente da fala comum da pessoa.
//   resposta: 'marca' | ['marca'...] (alguma já respondida) | '!marca' (ainda não) | { id: 'valor' | ['valor'...] } (o que respondeu)
//     — é o $p do Stardew: a fala muda com o que o Jocelino respondeu antes (G.respostas, as perguntas abaixo). Vale como estado
//     (a regra 5, a do `se`).
// PARA QUEM ESCREVE FALAS (as pegadinhas):
//   - `dia` sem `estacao` e `ano` sozinho NÃO são a regra 7: a linha cai na regra 12 (a geral) e só casa no dia/ano pedido. Para
//     a data fixa, ponha os dois (`{ estacao: 'Inverno', dia: 9 }`); o `ano` serve de condição a mais numa linha de outra regra.
//   - a página que começa com "@palavra " (arroba, letras minúsculas e um espaço) PERDE esse prefixo: ele é a emoção do retrato
//     (ui.js). Não comece uma frase com @ de verdade; uma emoção sem arte volta para o _normal.
//   - a fala-função que devolve [] (ou nada) não abre placa vazia: vale a fala padrão da pessoa (a 1ª linha geral, sem `quando`)
//     ou "Bom dia, Jocelino!" (e avisa no console).
// AS PERGUNTAS (3.4; o $q/$r/$p do Stardew). A linha pode ter `pergunta`: depois das páginas, abre a escolha com o retrato
// (perguntarCom, ui.js). Sem `pergunta.texto`, a ÚLTIMA página da fala vira o texto da pergunta.
//   pergunta: { id?: 'ze_samba', texto?: '...', opcoes: [ { t: 'texto', amizade?: 20 | { zelia: 20, ze: 10 },
//               resposta?: [páginas] | (ctx) => [páginas], marca?: 'zelia_cortina' | [...], valor?: 'qualquer coisa' }, ... ] }
//   - com `id`: a pergunta é feita UMA vez (a linha some depois de respondida) e G.respostas[id] = o `valor` da opção (sem ele, o
//     texto da opção, sem o @); a amizade conta só nessa vez;
//   - sem `id`: é a pergunta rápida (o $y): repete e não mexe na amizade;
//   - `marca`: G.respostas[marca] = o dia em que respondeu; volta nas falas (`resposta` no quando), nos eventos e nas cartas;
//   - `amizade`: o tom (3.4) — nenhuma resposta honesta é punida; a grosseria custa no máximo −20 (mais que isso vira −20); com a
//     família, não conta (Amizade.ganhar dá 0);
//   - fechar sem escolher (Esc) vale a ÚLTIMA opção: ponha por último a resposta neutra.
// As cenas e eventos (T7+) usam Conversas.perguntar(p, pergunta, { depois(i, opção) }) direto. Quem monta a conversa sozinho com
// Conversas.paginas(p) (o quintal) NÃO faz a pergunta: use Conversas.abrir.
// (T4) OS TÓPICOS E A FOFOCA DOS GOSTOS (spec 3.3; os tópicos e as falas moram em topicos.js):
//   - `topico`: a linha vale enquanto G.topicos[id] >= hoje, e cada pessoa comenta UMA vez a cada abertura (a chave leva o dia em
//     que o tópico acaba: reaberto, a Vila comenta de novo);
//   - `descobre: { zelia: 'flor' | ['flor', 'cocada'] }`: dita a fala, o gosto da pessoa fica descoberto (G.gostosDescobertos; a aba
//     Gente mostra; o presente da T5 também descobre). Vale em qualquer caminho da conversa (abrir, paginas do quintal, comentario);
//   - quem conversa fora do motor (o Mestre Bira, pela obra) usa Conversas.comentario(p): só o tópico ou a fofoca ainda não ditos.
//   - AS EXCEÇÕES À ORDEM 3.2 (escritas como `se` nas linhas do topicos.js, não aqui no motor):
//     · a festa da própria pessoa passa na frente do tópico: com a festa dela marcada (o convite, `encomenda: true`) ou que acabou
//       de sair (`'depois'`), a regra 4 vale antes da 2 só para ela. A festa que não saiu (`'deixa'`) não passa: os tópicos voltam;
//     · a fofoca (regra 5) cede à pendência: quando uma linha de estado de guia de quem fala casa (as da Rosa; as com
//       `pendencia: true`), a dica espera, em vez de empatar e tapar a linha que guia a reforma ou a casa.
//   - "N dias" de um tópico contam o dia em que ele abre: G.topicos[id] = hoje + N − 1 (o último dia em que vale).
// A ORDEM (3.2): os ganchos de hoje (ANTES_DE_CONVERSAR, p.aoConversar) vêm na frente de tudo; depois
//   1 primeira · 2 topico · 3 aniversario · 4 festa · 5 se/ato · 6 lugar (+coracoes) · 7 estacao+dia · 8 chuva ·
//   9 semana (+coracoes) · 10 estacao · 11 coracoes · 12 a fala geral.
// Dentro da mesma regra ganha quem tem mais corações pedidos e depois quem tem mais condições; o empate sorteia pelo dia (como o
// _porDia de antes: a linha G.dia % n). `uma: true` sai uma vez só (G.falasVistas). Quem conversa de novo no mesmo dia ouve a
// mesma fala (G.conversaHoje) — a amizade já conta 1 vez por dia (amizade.js) —, a não ser que o estado do jogo tenha mudado
// (uma linha de `se`/`ato` diferente): aí vale a fala nova (a Rosa da reforma acompanha a etapa).
// Quem não tem tabela usa o FALAS antigo (mapas.js) ou "Bom dia, Jocelino!".

const CONVERSAS = {};
const FESTAS_DO_DIA = [];    // () => 'id' | ['id'...] | null: as festas de hoje (a regra 4)
const LUGAR_ESPECIAL = [];   // (mapaId, x, y) => 'obra' | 'gremio' | null: um pedaço de mapa que é outro lugar

const Conversas = {
  REGRAS: { primeira: 1, topico: 2, aniversario: 3, festa: 4, se: 5, lugar: 6, data: 7, chuva: 8, semana: 9, estacao: 10, coracoes: 11, geral: 12 },
  CHAVES: ['topico', 'aniversario', 'festa', 'encomenda', 'se', 'ato', 'resposta', 'lugar', 'estacao', 'dia', 'chuva', 'semana', 'coracoes', 'ano'],
  LUGAR_DO_MAPA: { quintal: 'quintal', vila: 'vila', praia: 'praia', alto_mar: 'praia', pensao_dentro: 'pensao', pensao_palco: 'pensao',
    bairro: 'bairro', mata: 'mata', serra: 'mata', pedreira: 'pedreira', bancada: 'pedreira' },
  DIAS_ANO: 112,   // 4 estações de 28 dias; o ano começa no Outono

  // ---------- o dia de hoje ----------
  _norm: s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(),
  estacao(d = G.dia) { return Math.floor((d - 1) / 28) % 4; },
  noEstacao(d = G.dia) { return (d - 1) % 28 + 1; },
  semana(d = G.dia) { return (d - 1) % 7; },   // 0 = segunda ... 6 = domingo (o dia 1 é uma segunda)
  ano(d = G.dia) { return Math.floor((d - 1) / Conversas.DIAS_ANO) + 1; },
  chove(d = G.dia) { return typeof Clima !== 'undefined' && !!Clima.chove(d); },
  // A chance de 50% da chuva, fixa pelo dia e pela pessoa (conversar de novo não sorteia outra vez).
  sorteChuva(id, d = G.dia) { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0; return mulberry(d * 7919 + h)() < 0.5; },
  festas() {
    const r = [];
    for (const f of FESTAS_DO_DIA) { try { const v = f(); if (v) r.push(...[].concat(v)); } catch (e) { console.error(e); } }
    return r;
  },
  topicoAberto(t) { return !!G.topicos && G.topicos[t] >= G.dia; },
  // (E3 das encomendas de festa) A festa que a pessoa marcou na pensão (p.agenda, tipo 'encomenda'), na fase pedida: true = marcada
  // (do dia do aviso até a noite dela); 'depois' = feita (ontem, ou hoje depois da janta); 'deixa' = não saiu (a despensa não deu, a
  // pensão não abriu). Devolve a entrada da agenda (a fala usa o prato, a turma e o dia) ou null.
  encomenda(id, fase = true) {
    const p = G.pensao, d = G.dia;
    return ((p && p.agenda) || []).find(e => e.tipo === 'encomenda' && e.quem === id && (fase === true
      ? !e.fim && e.avisado <= d && e.dia >= d
      : (e.dia === d || e.dia === d - 1) && (fase === 'depois' ? e.fim === 'feita' : fase === 'deixa' && (e.fim === 'deixa' || e.fim === 'passou')))) || null;
  },
  // O lugar da conversa: o mapa de quem fala (ou do Jocelino), com os pedaços especiais (o canteiro da obra, o Grêmio).
  lugar(p) {
    const mapa = G.mapaId || (G.mapa && G.mapa.id) || '', x = p && p.x != null ? p.x : G.jog && G.jog.x, y = p && p.y != null ? p.y : G.jog && G.jog.y;
    for (const f of LUGAR_ESPECIAL) { try { const l = f(mapa, x, y); if (l) return l; } catch (e) { console.error(e); } }
    return Conversas.LUGAR_DO_MAPA[mapa] || mapa;
  },
  aniversarioHoje(id) { const a = (CONVERSAS[id] || {}).aniversario; return !!a && a[0] === Conversas.estacao() && a[1] === Conversas.noEstacao(); },
  coracoes(id) { return typeof Amizade !== 'undefined' ? Amizade.coracoes(id) : 0; },
  contexto(id, p) {
    return { id, dia: G.dia, estacao: Conversas.estacao(), noEstacao: Conversas.noEstacao(), semana: Conversas.semana(), ano: Conversas.ano(),
      ato: G.ato || 1, chove: Conversas.chove(), sorteChuva: Conversas.sorteChuva(id), lugar: Conversas.lugar(p), festas: Conversas.festas(),
      aniversario: Conversas.aniversarioHoje(id), coracoes: Conversas.coracoes(id), respostas: G.respostas || {} };
  },

  // ---------- as regras ----------
  regraDe(q) {
    if (!q) return 12;
    if ('topico' in q) return 2; if ('aniversario' in q) return 3; if ('festa' in q || 'encomenda' in q) return 4; if ('se' in q || 'ato' in q || 'resposta' in q) return 5;
    if ('lugar' in q) return 6; if ('estacao' in q && 'dia' in q) return 7; if ('chuva' in q) return 8; if ('semana' in q) return 9;
    if ('estacao' in q) return 10; if ('coracoes' in q) return 11; return 12;
  },
  _semanaIdx(v) { if (typeof v === 'number') return v; const n = Conversas._norm(v).slice(0, 3); return SEMANA.findIndex(s => Conversas._norm(s) === n); },
  _estacaoIdx(v) { if (typeof v === 'number') return v; const n = Conversas._norm(v); return ESTACOES.findIndex(s => Conversas._norm(s) === n); },
  _lista: v => [].concat(v),
  casa(q, ctx) {
    if (!q) return true;
    for (const k in q) {
      const v = q[k];
      switch (k) {
        case 'topico': if (!Conversas.topicoAberto(v)) return false; break;
        case 'aniversario': if (!!v !== ctx.aniversario) return false; break;
        case 'festa': if (v === true ? !ctx.festas.length : v === false ? ctx.festas.length : !Conversas._lista(v).some(f => ctx.festas.includes(f))) return false; break;
        case 'encomenda': if (!Conversas.encomenda(ctx.id, v)) return false; break;
        case 'se': { let ok = false; try { ok = !!v(ctx); } catch (e) { console.error(e); } if (!ok) return false; break; }
        case 'ato': if (!Conversas._lista(v).includes(ctx.ato)) return false; break;
        case 'resposta': if (!Conversas.casaResposta(v)) return false; break;
        case 'lugar': if (!Conversas._lista(v).includes(ctx.lugar)) return false; break;
        case 'estacao': if (Conversas._estacaoIdx(v) !== ctx.estacao) return false; break;
        case 'dia': if (v !== ctx.noEstacao) return false; break;
        case 'chuva': if (v ? !(ctx.chove && ctx.sorteChuva) : ctx.chove) return false; break;
        case 'semana': if (!Conversas._lista(v).some(s => Conversas._semanaIdx(s) === ctx.semana)) return false; break;
        case 'coracoes': if (ctx.coracoes < v) return false; break;
        case 'ano': if (v >= 2 ? ctx.ano < 2 : ctx.ano !== v) return false; break;
        default: console.warn(`conversas: condição desconhecida "${k}" (${ctx.id})`); return false;
      }
    }
    return true;
  },
  // A chave do `uma` (e a do tópico, que cada pessoa comenta uma vez enquanto ele está aberto).
  _texto: t => String(t).replace(/^@[a-z_]+\s+/, '').slice(0, 60),
  chaveUma(id, l, i) { return l.id || id + ':' + (Array.isArray(l.fala) && l.fala.length ? Conversas._texto(l.fala[0]) : 'linha' + i); },
  chaveTopico(id, l) { return id + '|topico:' + l.quando.topico + ':' + (G.topicos || {})[l.quando.topico]; },

  // ---------- quem fala ----------
  idDe(p) {
    const pid = String((p && p.id) || p || '');
    if (CONVERSAS[pid]) return pid;
    const a = typeof Amizade !== 'undefined' ? Amizade.idDe(typeof p === 'string' ? { id: p } : p) : pid;
    return CONVERSAS[a] ? a : pid;
  },
  conhece(id) { return !!G.conhecidos && id in G.conhecidos; },
  conhecer(id) { (G.conhecidos || (G.conhecidos = {}))[id] = id in (G.conhecidos || {}) ? G.conhecidos[id] : G.dia; },
  _paginas(f, ctx) { let pg = typeof f === 'function' ? f(ctx) : f; if (pg == null) return []; if (!Array.isArray(pg)) pg = [pg]; return pg.filter(t => t != null && t !== '').map(String); },

  // Escolhe a fala de hoje. Com `espiar`, não marca nada (nem o "conhece", nem o `uma`) e trata o que foi visto HOJE como não visto
  // (para conferir se a fala de agora é a mesma da conversa anterior do dia). Devolve { regra, chave, paginas, depois, linha }.
  escolher(p, espiar = false) {
    const id = Conversas.idDe(p), C = CONVERSAS[id];
    if (!C) {   // o FALAS antigo (uma lista, uma lista de conversas ou uma função), ou o bom dia
      const f = typeof FALAS !== 'undefined' && FALAS[id], pg = (typeof f === 'function' ? f() : f) || [];
      const pgs = Conversas._paginas(Array.isArray(pg[0]) ? pg[0] : pg);
      return { regra: 12, chave: f ? 'falas' : 'bomdia', paginas: pgs.length ? pgs : ['Bom dia, Jocelino!'], depois: null, linha: null };
    }
    const vistas = G.falasVistas || {}, visto = k => k in vistas && !(espiar && vistas[k] === G.dia);
    const ctx = Conversas.contexto(id, p);
    if (C.primeira && (!Conversas.conhece(id) || (espiar && G.conhecidos[id] === G.dia)))
      return Conversas._marca(id, { regra: 1, chave: 'primeira', paginas: Conversas._paginas(C.primeira, ctx), depois: C.depois || null, linha: null }, espiar);
    let melhor = null, empate = [];
    (C.linhas || []).forEach((l, i) => {
      const q = l.quando || null;
      if (l.uma && visto(Conversas.chaveUma(id, l, i))) return;
      if (Conversas.perguntaFeita(l.pergunta)) return;   // (a pergunta com id é feita uma vez só)
      if (q && 'topico' in q && visto(Conversas.chaveTopico(id, l))) return;
      if (!Conversas.casa(q, ctx)) return;
      const nota = [Conversas.regraDe(q), -((q && q.coracoes) || 0), -Object.keys(q || {}).length];
      const cmp = melhor ? nota[0] - melhor[0] || nota[1] - melhor[1] || nota[2] - melhor[2] : -1;
      if (cmp < 0) { melhor = nota; empate = [i]; } else if (cmp === 0) empate.push(i);
    });
    if (!empate.length) return Conversas._marca(id, { regra: 12, chave: 'bomdia', paginas: ['Bom dia, Jocelino!'], depois: C.depois || null, linha: null }, espiar);
    const i = empate[((G.dia % empate.length) + empate.length) % empate.length], l = C.linhas[i];
    let pg = Conversas._paginas(l.fala, ctx);
    if (!pg.length && !(l.pergunta && l.pergunta.texto)) {   // (a fala-função que veio vazia não abre placa vazia)
      console.warn(`conversas: a fala da linha ${i} de ${id} veio vazia; vale a fala padrão`); pg = Conversas.padrao(id, ctx);
    }
    return Conversas._marca(id, { regra: melhor[0], chave: 'l' + i, paginas: pg, depois: l.depois || C.depois || null, linha: l, i }, espiar);
  },
  // A fala padrão curta da pessoa: a 1ª linha geral (sem `quando`, escrita, não função, sem `uma` nem pergunta) ou o bom dia.
  padrao(id, ctx) {
    const l = ((CONVERSAS[id] || {}).linhas || []).find(l => !l.quando && !l.uma && !l.pergunta && Array.isArray(l.fala) && l.fala.length);
    return l ? Conversas._paginas(l.fala, ctx) : ['Bom dia, Jocelino!'];
  },
  _marca(id, r, espiar) {
    if (espiar) return r;
    Conversas.conhecer(id);
    const l = r.linha, v = G.falasVistas || (G.falasVistas = {});
    if (l && l.uma) v[Conversas.chaveUma(id, l, r.i)] = G.dia;
    if (l && l.quando && 'topico' in l.quando) v[Conversas.chaveTopico(id, l)] = G.dia;
    if (l && l.descobre) for (const alvo in l.descobre) for (const it of [].concat(l.descobre[alvo])) Conversas.descobrir(alvo, it);
    return r;
  },
  // (T4) O que a pessoa tem a COMENTAR hoje, para quem conversa fora do motor (o Mestre Bira, pela obra): as páginas do tópico aberto
  // (a regra 2) ou da fofoca de um gosto (`descobre`) que ela ainda não disse; [] se não tem. Marca como dito, igual à conversa.
  comentario(p) {
    const id = Conversas.idDe(p); if (!CONVERSAS[id]) return [];
    const r = Conversas.escolher(p, true), l = r.linha, v = G.falasVistas || {};
    if (!l || !(r.regra === 2 || l.descobre)) return [];
    if ((r.regra === 2 && Conversas.chaveTopico(id, l) in v) || (l.uma && Conversas.chaveUma(id, l, r.i) in v)) return [];   // (já disse hoje)
    Conversas._marca(id, r, false);
    return r.paginas.slice();
  },

  // ---------- (T4) os gostos descobertos: G.gostosDescobertos = { zelia: { flor: dia } } (no save) ----------
  // Os gostos de cada um ficam na tabela (CONVERSAS[id].gostos = { ama, gosta, naoGosta, odeia }: listas de itens; falas.js). A dica
  // da fofoca e o presente (T5) descobrem; a aba Gente (T6) lê Conversas.descobertos(id).
  GOSTOS: ['ama', 'gosta', 'naoGosta', 'odeia'],
  gosto(id, item) { const g = (CONVERSAS[id] || {}).gostos || {}; return Conversas.GOSTOS.find(k => (g[k] || []).includes(item)) || 'neutro'; },
  descobriu(id, item) { return !!(G.gostosDescobertos && G.gostosDescobertos[id] && item in G.gostosDescobertos[id]); },
  descobrir(id, item) {
    if (Conversas.descobriu(id, item)) return false;
    const D = G.gostosDescobertos || (G.gostosDescobertos = {}); (D[id] || (D[id] = {}))[item] = G.dia || 1;
    return true;
  },
  // { ama: [itens], gosta: [...], naoGosta: [...], odeia: [...], neutro: [...] }, só os descobertos, na ordem em que foram descobertos.
  descobertos(id) {
    const r = { ama: [], gosta: [], naoGosta: [], odeia: [], neutro: [] }, d = (G.gostosDescobertos || {})[id] || {};
    for (const it of Object.keys(d).sort((a, b) => d[a] - d[b])) r[Conversas.gosto(id, it)].push(it);
    return r;
  },
  // A fala de hoje, com a regra do mesmo dia: conversou de novo, ouve a mesma (se o estado do jogo não mudou).
  doDia(p) {
    const id = Conversas.idDe(p), hoje = G.conversaHoje || (G.conversaHoje = {}), mem = hoje[id];
    const C0 = CONVERSAS[id], l0 = mem && C0 && C0.linhas && /^l\d+$/.test(mem.chave) ? C0.linhas[+mem.chave.slice(1)] : null;
    if (mem && mem.dia === G.dia && !Conversas.perguntaFeita(l0 && l0.pergunta)) {   // (a pergunta já respondida não repete: vale outra fala)
      const agora = Conversas.escolher(p, true), igual = agora.chave === mem.chave && agora.paginas.join('\n') === mem.paginas.join('\n');
      if (igual || (agora.regra !== 5 && mem.regra !== 5)) {
        const C = CONVERSAS[id] || {}, l = /^l\d+$/.test(mem.chave) && C.linhas ? C.linhas[+mem.chave.slice(1)] : null;
        return { regra: mem.regra, chave: mem.chave, paginas: mem.paginas.slice(), depois: (l && l.depois) || C.depois || null, linha: l, repetida: true };
      }
    }
    const r = Conversas.escolher(p);
    hoje[id] = { dia: G.dia, regra: r.regra, chave: r.chave, paginas: r.paginas.slice() };
    return r;
  },
  paginas(p) { return Conversas.doDia(p).paginas; },
  // O retrato da pessoa com a emoção (sem a arte, o _normal; sem nenhum dos dois, o _normal mesmo, como antes).
  temArte: nome => typeof ARTE_LISTA !== 'undefined' && ARTE_LISTA.includes(nome),
  retrato(id, emo = 'normal') {
    const n = 'retratos/' + id + '_' + emo;
    return urlArte(Conversas.temArte(n) ? n : 'retratos/' + id + '_normal');
  },
  // Abre a conversa do dia com a moldura do retrato. opc: { nome, retrato, mais: [páginas no fim], depois }.
  // A linha com `pergunta` (ainda não respondida): as páginas, depois a escolha com o retrato, a resposta e, no fim, o `depois`.
  abrir(p, opc = {}) {
    if (typeof p === 'string') p = { id: p };
    const id = Conversas.idDe(p), r = Conversas.doDia(p);
    const nome = Conversas.nomeDe(p, opc), retrato = opc.retrato || Conversas.retratoDe(p);
    const depois = 'depois' in opc ? opc.depois : r.depois;
    const perg = r.linha && r.linha.pergunta;
    if (perg && !Conversas.perguntaFeita(perg)) {
      const fala = r.paginas.slice(), texto = perg.texto || fala.pop() || '', pgs = fala.concat(opc.mais || []);   // (o `mais` vem antes da pergunta)
      const pergunta = () => Conversas.perguntar(p, perg, { nome, retrato, texto, rapida: !perg.id, depois: depois ? () => depois() : null });
      if (pgs.length) abrirConversa(nome, retrato, pgs, pergunta); else pergunta();
      return true;
    }
    const pgs = r.paginas.concat(opc.mais || []);
    abrirConversa(nome, retrato, pgs.length ? pgs : Conversas.padrao(id), depois || undefined);
    return true;
  },
  nomeDe(p, opc = {}) {
    const id = Conversas.idDe(p);
    return opc.nome || (p && p.nome) || (CONVERSAS[id] || {}).nome || (typeof Amizade !== 'undefined' ? Amizade.nome(id) : id);
  },
  // O retrato _normal de quem fala (o do morador do mapa, se tem arte; senão o da tabela).
  retratoDe(p) {
    if (typeof p === 'string') p = { id: p };
    const id = Conversas.idDe(p), rid = [p.id, id].find(x => x && Conversas.temArte('retratos/' + x + '_normal')) || p.id || id;
    return Conversas.retrato(rid);
  },

  // ---------- as perguntas (3.4; o $q, o $r e o $p do Stardew) ----------
  // G.respostas = { 'id da pergunta': valor, 'marca': dia em que respondeu } — vai no save; volta nas falas (`resposta` no quando),
  // nos eventos e nas cartas (Conversas.respondeu / Conversas.resposta).
  respondeu(marca) { return !!G.respostas && marca in G.respostas; },
  resposta(id) { return (G.respostas || {})[id]; },
  perguntaFeita(pg) { return !!(pg && pg.id) && Conversas.respondeu(pg.id); },
  casaResposta(v) {
    if (typeof v === 'string') return v[0] === '!' ? !Conversas.respondeu(v.slice(1)) : Conversas.respondeu(v);
    if (Array.isArray(v)) return v.some(m => Conversas.casaResposta(m));
    if (v && typeof v === 'object') return Object.keys(v).every(k => Conversas.respondeu(k) && [].concat(v[k]).includes(G.respostas[k]));
    return false;
  },
  _opcao: o => typeof o === 'string' ? { t: o } : o,
  // Grava a escolha `i` e dá a amizade (só na 1ª vez de uma pergunta com id; a rápida não dá). Devolve quanto a amizade mudou.
  responder(quem, pergunta, i, opc = {}) {
    const o = Conversas._opcao((pergunta.opcoes || [])[i]) || {}, R = G.respostas || (G.respostas = {});
    const ja = Conversas.perguntaFeita(pergunta), id = Conversas.idDe(quem);
    let mudou = 0;
    if (o.amizade && !ja && !opc.rapida && typeof Amizade !== 'undefined') {
      const pts = typeof o.amizade === 'object' ? o.amizade : { [id]: o.amizade };
      for (const k in pts) {
        let n = +pts[k] || 0;
        if (n < -20) { console.warn(`conversas: a resposta "${o.t}" tira ${n} de amizade; o máximo é −20 (3.4)`); n = -20; }
        mudou += Amizade.ganhar(Amizade.id(k), n, 'resposta');
      }
    }
    if (pergunta.id) R[pergunta.id] = 'valor' in o ? o.valor : emocaoDaPagina(String(o.t)).texto;
    for (const m of o.marca ? [].concat(o.marca) : []) R[m] = G.dia || 1;
    return mudou;
  },
  // Abre a pergunta com o retrato de quem fala. opc: { nome, retrato, texto, rapida, depois(i, opção) }. Ao escolher: grava
  // (responder), mostra a `resposta` da opção (as páginas com emoção, com o mesmo retrato) e chama o `depois`.
  perguntar(p, pergunta, opc = {}) {
    if (typeof p === 'string') p = { id: p };
    const id = Conversas.idDe(p), nome = Conversas.nomeDe(p, opc), retrato = 'retrato' in opc ? opc.retrato : Conversas.retratoDe(p);
    const ops = (pergunta.opcoes || []).map(Conversas._opcao);
    if (!ops.length) { console.warn(`conversas: a pergunta de ${id} não tem opções`); if (opc.depois) opc.depois(-1, null); return; }
    perguntarCom(nome, retrato, opc.texto || pergunta.texto || '', ops, i => {
      const o = ops[i];
      Conversas.responder(p, pergunta, i, opc);
      const fim = () => { if (opc.depois) opc.depois(i, o); };
      const pg = Conversas._paginas(o.resposta, Conversas.contexto(id, p));
      if (pg.length) abrirConversa(nome, retrato, pg, fim); else fim();
    }, { definitiva: !!pergunta.id && !opc.rapida });   // (a pergunta com id: E e X não fecham; só o Esc, que vale a última)
  },
  // Todas as páginas escritas de uma pessoa (as falas que são função ficam de fora); para os testes e a aba Gente.
  textos(id) {
    const C = CONVERSAS[id]; if (!C) return [];
    const lista = v => Array.isArray(v) ? v : typeof v === 'string' ? [v] : [];
    return [].concat(lista(C.primeira), ...(C.linhas || []).map(l => [].concat(lista(l.fala), l.pergunta ? lista(l.pergunta.texto) : [],
      ...(l.pergunta && l.pergunta.opcoes || []).map(o => o && typeof o === 'object' ? lista(o.resposta) : []))));
  },

  // ---------- o save ----------
  iniciar(s) {
    G.falasVistas = Object.assign({}, s.falasVistas || {});
    G.respostas = Object.assign({}, s.respostas || {});
    G.gostosDescobertos = {}; for (const k in s.gostosDescobertos || {}) G.gostosDescobertos[k] = Object.assign({}, s.gostosDescobertos[k]);
    G.conversaHoje = {};
    for (const k in s.conversaHoje || {}) if (s.conversaHoje[k] && s.conversaHoje[k].dia === s.dia) G.conversaHoje[k] = s.conversaHoje[k];
    if (s.conhecidos) { G.conhecidos = Object.assign({}, s.conhecidos); return; }
    // O save de antes do motor: quem já tem amizade ou já conversou é conhecido; depois de 2 semanas, a Vila inteira; e a família
    // depois da chegada. Assim ninguém se apresenta de novo a quem já mora aqui.
    G.conhecidos = {};
    const conhece = k => { G.conhecidos[typeof Amizade !== 'undefined' ? Amizade.id(k) : k] = 0; };
    Object.keys(s.amizade || {}).forEach(conhece); Object.keys(s.amizadeConversa || {}).forEach(conhece);
    if (s.boasVindas) for (const k of ['rosa', 'juca', 'ritinha', 'zezinho']) G.conhecidos[k] = 0;
    if ((s.dia || 1) > 14) for (const k in CONVERSAS) G.conhecidos[k] = 0;
  },
  salvar(s) {
    s.falasVistas = Object.assign({}, G.falasVistas || {}); s.respostas = Object.assign({}, G.respostas || {}); s.conhecidos = Object.assign({}, G.conhecidos || {});
    s.gostosDescobertos = {}; for (const k in G.gostosDescobertos || {}) s.gostosDescobertos[k] = Object.assign({}, G.gostosDescobertos[k]);
    s.conversaHoje = {}; for (const k in G.conversaHoje || {}) if (G.conversaHoje[k].dia === G.dia) s.conversaHoje[k] = G.conversaHoje[k];
  },
};
INICIADORES.push(s => Conversas.iniciar(s));
COLETORES.push(s => Conversas.salvar(s));

// As festas que o jogo já tem (a regra 4): a festa do Bairro Novo, a noite de festa da agenda da pensão e o Concurso da Rádio.
FESTAS_DO_DIA.push(() => G.bairro && G.bairro.festa && G.bairro.festa.dia && G.bairro.festa.dia <= G.dia && !G.bairro.festa.feita ? 'bairro' : null);   // (como o festaHoje: espera o Jocelino)
FESTAS_DO_DIA.push(() => G.pensao && (G.pensao.agenda || []).some(x => x.tipo === 'festa' && x.dia === G.dia && !x.fim) ? 'pensao' : null);
FESTAS_DO_DIA.push(() => typeof Concurso !== 'undefined' && G.pensao && Concurso.temNoDia(G.pensao, G.dia) ? 'concurso' : null);
// Os pedaços da Vila que são outro lugar: o canteiro da obra da vez e a frente do Grêmio.
LUGAR_ESPECIAL.push((mapa, x, y) => {
  if (mapa !== 'vila' || x == null || typeof canteiroDaVez !== 'function') return null;
  const R = canteiroDaVez().ret, tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  return tx >= R.x - 1 && tx < R.x + R.w + 1 && ty >= R.y - 1 && ty < R.y + R.h + 1 ? 'obra' : null;
});
LUGAR_ESPECIAL.push((mapa, x, y) => {
  if (mapa !== 'vila' || x == null || typeof GREMIO_PE === 'undefined') return null;
  const [gx, gy, gw, gh] = GREMIO_PE, tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  return tx >= gx - 3 && tx < gx + gw + 3 && ty >= gy - 3 && ty < gy + gh + 3 ? 'gremio' : null;
});
