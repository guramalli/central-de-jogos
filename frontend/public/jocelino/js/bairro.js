// Jocelino — bairro.js — o Bairro Novo (o bairro em crescimento), as regras: 14 terrenos; 8 donos que chegam aos poucos
// com o tipo de casa deles; a casa em 6 fases, cada fase uma empreita longa (o laço da etapa 6); a padaria e o bar em
// 5 fases; quem ganha a casa se muda no dia seguinte e traz o próximo dono. O mundo está em bairro_jogo.js.

const BAIRRO = { LARG: 56, ALT: 36 };
// Os terrenos (canto de cima à esquerda): 6 linhas — o prédio com a base em y+4, o recuo em y+5 (varanda, muro, a
// plaquinha da obra) — e a calçada da rua logo na frente, em y+6 (o padrão da cidade: toda frente dá para uma calçada).
// Casa: 5 de largura; comércio e público: 6. Três ruas paralelas (pistas em y 9–10, 20–21 e 31–32, calçadas dos dois
// lados) ligadas pela rua do fundo (pista em x 48–49, calçadas em x 47 e 50).
const RUAS_BAIRRO = { linhas: [9, 20, 31], coluna: 48, fim: 49 };
const TERRENOS = {
  t1: { tipo: 'casa', x: 4, y: 2 }, t2: { tipo: 'casa', x: 11, y: 2 }, t3: { tipo: 'casa', x: 18, y: 2 }, t4: { tipo: 'casa', x: 25, y: 2 },
  t5: { tipo: 'casa', x: 4, y: 13 }, t6: { tipo: 'casa', x: 11, y: 13 }, t7: { tipo: 'casa', x: 18, y: 13 }, t8: { tipo: 'casa', x: 25, y: 13 },
  padaria: { tipo: 'comercio', x: 33, y: 2 }, bar: { tipo: 'comercio', x: 41, y: 2 },
  escola: { tipo: 'publico', x: 33, y: 13 }, posto: { tipo: 'publico', x: 41, y: 13 }, capela: { tipo: 'publico', x: 33, y: 24 }, praca: { tipo: 'publico', x: 41, y: 24 },
};
// Os donos, na ordem de chegada (os 2 primeiros já estão quando o bairro abre).
const DONOS = [
  { id: 'nena', nome: 'Dona Nena', casa: 'simples', terreno: 't1' }, { id: 'tonhao', nome: 'Tonhão', casa: 'simples', terreno: 't5' },
  { id: 'neide', nome: 'Neide', casa: 'simples', terreno: 't2' }, { id: 'valdir', nome: 'Valdir Baiano', casa: 'boa', terreno: 't6' },
  { id: 'rosinete', nome: 'Rosinete', casa: 'boa', terreno: 't3' }, { id: 'lurdes', nome: 'Dona Lurdes', casa: 'boa', terreno: 't7' },
  { id: 'tonha', nome: 'Tonha', casa: 'sobrado', terreno: 't4' }, { id: 'nenem', nome: 'Neném', casa: 'sobrado', terreno: 't8' },
];
const TIPOS_CASA = {
  simples: { arte: 'objetos/casa_simples_', fundacao: { material: { tijolo: 20, cimento: 2 } }, varanda: { cimento: 6, pigmento: 2 } },
  boa: { arte: 'objetos/casa_boa_', fundacao: { material: { cimento: 4, pedra: 10, vergalhao: 4 }, hab: { h: 'alvenaria', n: 2 } }, varanda: { cimento: 4, ladrilho: 30 } },
  sobrado: { arte: 'objetos/sobrado_', fundacao: { material: { cimento: 8, pedra: 20, vergalhao: 8 }, hab: { h: 'alvenaria', n: 5 } }, varanda: { cimento: 6, pigmento: 2 } },
};
ecoCampo(TIPOS_CASA, 'fator', ECO.bairro.tipos);
const FASES_CASA = [
  { nome: 'Fundação', etapas: ['pa', 'pa', 'colher', 'regador'], concreto: true },
  { nome: 'Paredes', etapas: ['pa', 'colher', 'colher', 'colher', 'regador'], material: { tijolo: 80, cimento: 6 } },
  { nome: 'Telhado', etapas: ['machado', 'machado', 'colher'], material: { madeira: 20, telha: 40 } },
  { nome: 'Reboco e pintura', etapas: ['colher', 'colher', 'regador', 'colher'], material: { cimento: 6, cal: 2, tinta: 2 }, pintura: true, reforma: true },
  { nome: 'Varanda', etapas: ['pa', 'colher', 'regador'], concreto: true },
  { nome: 'Muro da frente', etapas: ['pa', 'colher', 'colher', 'regador'], material: { tijolo: 30, cimento: 4, pedra: 6 } },
];
ecoCampo(FASES_CASA, 'paga', ECO.bairro.casa);
const COMERCIOS = {
  padaria: { dono: 'cida', nome: 'Padaria da Dona Cida', arte: 'objetos/padaria', libera: 1, abre: 6 * 60, fecha: 12 * 60, folga: 0, vende: { pao: 4, cafe: 2, rabanada: 6, bolo: 8 } },
  bar: { dono: 'orlando', nome: 'Bar do Seu Orlando', arte: 'objetos/bar_orlando', libera: 2, abre: 15 * 60, fecha: 23 * 60, folga: 1, vende: { suco_caju: 5, cocada: 5, peixe_frito: 8, caldo_caranguejo: 12 } },
};
const FASES_COMERCIO = [
  { nome: 'Fundação', etapas: ['pa', 'pa', 'colher', 'regador'], material: { cimento: 6, pedra: 15, vergalhao: 6 }, concreto: true },
  { nome: 'Paredes', etapas: ['pa', 'colher', 'colher', 'colher', 'regador'], material: { tijolo: 120, cimento: 8 } },
  { nome: 'Telhado', etapas: ['machado', 'machado', 'colher'], material: { madeira: 30, telha: 60 } },
  { nome: 'Acabamento e balcão', etapas: ['colher', 'colher', 'machado', 'colher'], material: { cimento: 6, cal: 2, tinta: 3, madeira: 10 }, pintura: true },
  { nome: 'Entrada', etapas: ['pa', 'colher', 'regador'], material: { cimento: 4, pedra: 10 }, concreto: true },
];
ecoCampo(FASES_COMERCIO, 'paga', ECO.bairro.comercio);
Object.assign(CLIENTE_NOME, { nena: 'Dona Nena', neide: 'Neide', valdir: 'Valdir Baiano', rosinete: 'Rosinete', lurdes: 'Dona Lurdes', tonha: 'Tonha', nenem: 'Neném', orlando: 'Seu Orlando', tonhao: 'Tonhão' });
const idFase = (t, f) => (TERRENOS[t].tipo === 'comercio' ? 'loja_' : 'casa_') + t + '_' + f;
// As fases viram empreitas longas (o laço da etapa 6): a plaquinha fica na frente do terreno (x+1, y+5).
for (const d of DONOS) {
  const T = TERRENOS[d.terreno], C = TIPOS_CASA[d.casa];
  FASES_CASA.forEach((F, i) => {
    const f = i + 1, material = f === 1 ? C.fundacao.material : f === 5 ? C.varanda : F.material;
    EMPREITAS_EXTRAS[idFase(d.terreno, f)] = { nome: `${F.nome} da casa ${d.nome.startsWith('Dona') ? 'da ' : 'de '}${d.nome}`, cliente: d.id, mapa: 'bairro', x: T.x + 1, y: T.y + 5,
      material: Object.assign({}, material), etapas: F.etapas.slice(), paga: Math.round(F.paga * C.fator), funcaoMin: 2, hab: f === 1 ? C.fundacao.hab : undefined,
      concreto: !!F.concreto, pintura: !!F.pintura, reforma: !!F.reforma, tipo: 'longa', dias: F.etapas.length, vezesDia: 3, ferramenta: F.etapas[0], artes: ['objetos/vala', 'objetos/alicerce'], bairro: { t: d.terreno, f } };
  });
}
for (const t in COMERCIOS) {
  const T = TERRENOS[t], K = COMERCIOS[t];
  FASES_COMERCIO.forEach((F, i) => {
    const f = i + 1;
    EMPREITAS_EXTRAS[idFase(t, f)] = { nome: `${F.nome} da ${K.nome}`, cliente: K.dono, mapa: 'bairro', x: T.x + 1, y: T.y + 5, material: Object.assign({}, F.material), etapas: F.etapas.slice(),
      paga: F.paga, funcaoMin: 2, concreto: !!F.concreto, pintura: !!F.pintura, tipo: 'longa', dias: F.etapas.length, vezesDia: 3, ferramenta: F.etapas[0], artes: ['objetos/vala', 'objetos/alicerce'], bairro: { t, f } };
  });
}

const Bairro = {
  iniciar(s) {
    const b = s.bairro || {}, c = x => JSON.parse(JSON.stringify(x));
    G.bairro = { aberto: !!b.aberto, chegados: b.chegados || 0, terrenos: {}, comercios: {}, missa: b.missa || 0, festa: c(b.festa || { dia: 0, feita: false }) };
    for (const t in TERRENOS) {
      if (TERRENOS[t].tipo === 'casa') G.bairro.terrenos[t] = Object.assign({ fase: 0, quals: [], mudaDia: 0, mudou: false }, c((b.terrenos || {})[t] || {}));
      if (TERRENOS[t].tipo === 'comercio') G.bairro.comercios[t] = Object.assign({ fase: 0, abreDia: 0 }, c((b.comercios || {})[t] || {}));
    }
  },
  salvar(s) { s.bairro = JSON.parse(JSON.stringify(G.bairro)); },
  donoDe(t) { const i = DONOS.findIndex(d => d.terreno === t); return i >= 0 && i < G.bairro.chegados ? DONOS[i] : null; },
  // A casa toda caprichada (as 6 fases com qualidade 1,5 ou mais): ganha a placa "Construída por Jocelino".
  caprichada(t) { const x = G.bairro.terrenos[t]; return !!x && x.fase >= 6 && x.quals.length >= 6 && x.quals.slice(0, 6).every(q => q >= 1.5); },
  comercioPronto(t) { const c = G.bairro.comercios[t]; return !!c && c.fase >= 5; },
  // Aberto: pronto, já no dia de abrir, fora da folga (dia da semana) e no horário.
  aberto(t, dia = G.dia, minutos = G.minutos) {
    const c = G.bairro.comercios[t], K = COMERCIOS[t]; if (!c || c.fase < 5 || dia < c.abreDia) return false;
    return (dia - 1) % 7 !== K.folga && minutos >= K.abre && minutos < K.fecha;
  },
  casasProntas() { return Object.values(G.bairro.terrenos).filter(x => x.mudou).length; },
  // A próxima fase de cada terreno com dono e de cada comércio liberado (se não está aceita nem acabou).
  pedidos() {
    if (!G.bairro.aberto) return [];
    const r = [], aceita = id => !!G.empreitas.aceitas[id];
    for (const t in G.bairro.terrenos) { const x = G.bairro.terrenos[t]; if (Bairro.donoDe(t) && x.fase < 6 && !FASES_CASA.some((F, i) => aceita(idFase(t, i + 1)))) r.push(idFase(t, x.fase + 1)); }
    for (const t in G.bairro.comercios) { const x = G.bairro.comercios[t]; if (Bairro.casasProntas() >= COMERCIOS[t].libera && x.fase < 5 && !FASES_COMERCIO.some((F, i) => aceita(idFase(t, i + 1)))) r.push(idFase(t, x.fase + 1)); }
    return r;
  },
  // Uma fase entregue: a casa (ou o comércio) sobe; a última marca a mudança (ou a abertura) para o dia seguinte.
  faseEntregue(id, q) {
    const E = dadosEmpreita(id); if (!E || !E.bairro || !G.bairro.terrenos && !G.bairro.comercios) return '';
    const { t, f } = E.bairro;
    if (G.bairro.terrenos[t]) { const x = G.bairro.terrenos[t]; x.fase = Math.max(x.fase, f); x.quals[f - 1] = q; if (f === 6) { x.mudaDia = G.dia + 1; return `A casa ${Bairro.donoDe(t) ? 'de ' + Bairro.donoDe(t).nome : ''} ficou pronta! A mudança é amanhã.`; } return ''; }
    if (G.bairro.comercios[t]) { const x = G.bairro.comercios[t]; x.fase = Math.max(x.fase, f); if (f === 5) { x.abreDia = G.dia + 1; return `A ${COMERCIOS[t].nome} ficou pronta! Abre amanhã.`; } }
    return '';
  },
  // De manhã: quem tem mudança marcada se muda (uma vez) e o próximo dono chega.
  manha() {
    const linhas = [];
    for (const t in G.bairro.terrenos) {
      const x = G.bairro.terrenos[t];
      if (x.mudaDia && !x.mudou && G.dia >= x.mudaDia) { x.mudou = true; const d = Bairro.donoDe(t); linhas.push(`${d.nome} se mudou para a casa nova no Bairro Novo!`); if (G.bairro.chegados < DONOS.length) { G.bairro.chegados++; linhas.push(`${DONOS[G.bairro.chegados - 1].nome} comprou um terreno no Bairro Novo.`); } }
    }
    return linhas;
  },
};
INICIADORES.push(s => Bairro.iniciar(s));
COLETORES.push(s => Bairro.salvar(s));
AO_ENTREGAR.push((id, q) => Bairro.faseEntregue(id, q));
MANHA.push(() => { if (G.bairro) for (const l of Bairro.manha()) G.feitosHoje.push(l); });

// As ruas do Bairro Novo (pedidos da Prefeitura, na ordem): abrir as ruas já com as calçadas, a arborização, os postes.
Object.assign(PREFEITURA_OBRAS, {
  pref_rua_1: { nome: 'Abrir as ruas do Bairro Novo', texto: 'O loteamento ainda é só mato: abrir as ruas, cascalhar e fazer as calçadas dos dois lados.', material: { pedra: 50, cimento: 10 }, etapas: ['pa', 'pa', 'colher', 'regador'], paga: 2400, premio: { itens: { cimento: 5 } }, x: 6, y: 11, bairro: { rua: 1 }, libera: () => !!(G.bairro && G.bairro.aberto) },
  pref_rua_2: { nome: 'Arborização do Bairro Novo', texto: 'Mudas de árvore nas calçadas, para dar sombra.', material: { madeira: 10, esterco: 6 }, etapas: ['pa', 'pa', 'regador', 'regador'], paga: 2200, premio: { itens: { cal: 4 } }, x: 14, y: 11, bairro: { rua: 2 }, libera: () => !!(G.bairro && G.bairro.aberto) && G.empreitas.prefeitura.feitos.includes('pref_rua_1') },
  pref_rua_3: { nome: 'Postes de luz do Bairro Novo', texto: 'De noite o bairro é um breu: postes de madeira com luminária.', material: { madeira: 20, vergalhao: 6 }, etapas: ['machado', 'machado', 'colher'], paga: 2000, premio: { itens: { impermeabilizante: 2 } }, x: 22, y: 11, bairro: { rua: 3 }, libera: () => !!(G.bairro && G.bairro.aberto) && G.empreitas.prefeitura.feitos.includes('pref_rua_2') },
});
for (const id of ['pref_rua_1', 'pref_rua_2', 'pref_rua_3']) Object.assign(PREFEITURA_OBRAS[id], { cliente: 'prefeitura', mapa: 'bairro', funcaoMin: 0, tipo: 'longa', dias: PREFEITURA_OBRAS[id].etapas.length, vezesDia: 3, ferramenta: PREFEITURA_OBRAS[id].etapas[0], artes: ['objetos/vala', 'objetos/alicerce'] });
Object.assign(EMPREITAS_EXTRAS, { pref_rua_1: PREFEITURA_OBRAS.pref_rua_1, pref_rua_2: PREFEITURA_OBRAS.pref_rua_2, pref_rua_3: PREFEITURA_OBRAS.pref_rua_3 });
Bairro.ruas = () => ['pref_rua_1', 'pref_rua_2', 'pref_rua_3'].filter(id => G.empreitas && G.empreitas.prefeitura && G.empreitas.prefeitura.feitos.includes(id)).length;

// Os prédios públicos do bairro (Prefeitura): 2 pedidos cada (estrutura; telhado e acabamento), liberados pelas casas.
const PUBLICOS = { escola: { nome: 'Escola', arte: 'objetos/escola', casas: 4 }, posto: { nome: 'Posto de saúde', arte: 'objetos/posto_saude', casas: 5 }, capela: { nome: 'Capela', arte: 'objetos/capela', casas: 6 }, praca: { nome: 'Praça do coreto', arte: 'objetos/coreto', casas: 0 } };
Bairro.publico = t => [1, 2].filter(n => G.empreitas && G.empreitas.prefeitura && G.empreitas.prefeitura.feitos.includes(`pref_${t}_${n}`)).length;
const liberaPublico = t => () => !!(G.bairro && G.bairro.aberto) && (t === 'praca' ? ['escola', 'posto', 'capela'].every(u => Bairro.publico(u) >= 2) : Bairro.casasProntas() >= PUBLICOS[t].casas);
for (const t in PUBLICOS) {
  const T = TERRENOS[t], P = PUBLICOS[t];
  PREFEITURA_OBRAS[`pref_${t}_1`] = { nome: `${P.nome} do Bairro Novo: a estrutura`, texto: `A fundação e as paredes ${t === 'praca' ? 'da praça e do coreto' : 'do prédio'}.`, material: { tijolo: 120, cimento: 10, pedra: 15 }, etapas: ['pa', 'pa', 'colher', 'colher', 'colher', 'regador'], paga: 3600, premio: { itens: { cimento: 4 } }, x: T.x + 1, y: T.y + 5, bairro: { publico: t, n: 1 }, libera: liberaPublico(t) };
  PREFEITURA_OBRAS[`pref_${t}_2`] = { nome: `${P.nome} do Bairro Novo: o acabamento`, texto: 'O telhado, o reboco e a pintura.', material: { telha: 60, madeira: 30, tinta: 3, cal: 2 }, etapas: ['machado', 'machado', 'colher', 'colher', 'regador', 'colher'], paga: 3600, premio: { itens: { tinta: 2 } }, pintura: true, x: T.x + 1, y: T.y + 5, bairro: { publico: t, n: 2 }, libera: () => liberaPublico(t)() && G.empreitas.prefeitura.feitos.includes(`pref_${t}_1`) };
  for (const n of [1, 2]) { const id = `pref_${t}_${n}`; Object.assign(PREFEITURA_OBRAS[id], { cliente: 'prefeitura', mapa: 'bairro', funcaoMin: 0, tipo: 'longa', dias: PREFEITURA_OBRAS[id].etapas.length, vezesDia: 3, ferramenta: PREFEITURA_OBRAS[id].etapas[0], artes: ['objetos/vala', 'objetos/alicerce'] }); EMPREITAS_EXTRAS[id] = PREFEITURA_OBRAS[id]; }
}
