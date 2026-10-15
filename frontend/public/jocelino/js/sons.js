// Jocelino — sons.js — efeitos e músicas com WebAudio (como o audio.js do Lenda): quatro barramentos (música, ambiente,
// efeitos, interface) com o volume das opções; cada efeito sorteia uma das gravações (golpe_1..3: um golpe nunca soa
// igual ao outro, como no Stardew) e varia o tom; música do dia e da noite com troca suave; passos pelo piso.
// O navegador só libera o som depois do primeiro clique ou tecla.

// O rodízio das músicas (14/10: "a que está no jogo é muito agradável mas cansa rápido"). Fora da pensão, como no Stardew:
// toca uma faixa inteira, depois um silêncio de música (só o ambiente) de MUSICA_PAUSA_MIN a MUSICA_PAUSA_MAX segundos, depois
// outra sorteada, nunca a mesma em seguida. Na pensão, como no sushi bar do Dave: uma emenda na outra, sem silêncio.
const MUSICA_PAUSA_MIN = 20, MUSICA_PAUSA_MAX = 45;   // s de silêncio de música entre uma faixa e a próxima (fora da pensão)
const MUSICA_TROCA = 2;                               // s da troca suave (uma some enquanto a outra entra)
const MUSICAS = {
  dia: ['musica_dia', 'musica_dia_2', 'musica_dia_3', 'musica_dia_4'],   // bossa de violão; bossa da manhã; choro; baião
  noite: ['musica_noite', 'musica_noite_2', 'musica_noite_3'],            // violão e flauta; violão e flauta de bambu; seresta
  pensao: ['pensao_animada_1', 'pensao_animada_2', 'pensao_animada_3'],   // samba-choro (o escolhido); forró-xote; gafieira
  festa: ['musica_festa'],                                                // (guardada para a festa; hoje nada a chama)
};
const VOLUME_EFEITO = { passo_grama: -12, passo_chao: -14, passo_madeira: -12, letra: -6, cursor: -4, golpe: -4, foice: -2, dinheiro: -2 };
const SONS_INTERFACE = ['cursor', 'abrir', 'fechar', 'letra', 'feito', 'erro', 'dinheiro', 'contagem_dinheiro', 'estrela_1', 'estrela_2', 'estrela_3', 'estrela_4', 'estrela_5'];
// (14/10, o jogador: "os sons do restaurante estão muito calmos") A pensão barulhenta do sushi bar do Dave: campainha do pedido,
// chapa chiando, caixa registradora, reação do cliente, burburinho do salão, vinheta nas cenas de prato e a comemoração do fim
// da noite. Os arquivos vêm de um pacote de sons (ainda por escolher): enquanto um deles não existe, toca o som antigo que fazia
// o papel dele (a reserva: [nome, tom, dB a mais]); sem reserva, simplesmente não toca (nunca dá erro).
const SONS_RESERVA = {
  caixa_registradora: ['moedas', 1.1, 0], gorjeta: ['moedas', 1.25, -2], contagem_dinheiro: ['moedas', 1.15, -2],
  cliente_delicia: ['cliente_hmm', 1.05, 0], cliente_bravo: ['cliente_hmpf', 1, 0],
  cena_ploft: ['quica', 1, 0], cena_faca: ['golpe', 1.2, 0], cena_tchan: ['prato_tchan', 1, 0], cena_plateia: ['fanfarra', 1, 0],
  estrela_1: ['na_medida', 1, -4], estrela_2: ['na_medida', 1.12, -4], estrela_3: ['na_medida', 1.26, -4], estrela_4: ['na_medida', 1.41, -4], estrela_5: ['na_medida', 1.59, -4],
  degrau_fanfarra: ['fanfarra', 1, 0], festa_rojao: ['fanfarra', 1, 0],
};
// A moderação: o mesmo som não volta antes deste intervalo (s; o padrão é SOM_INTERVALO_PADRAO) e nunca há mais de SONS_MAX_VOZES
// efeitos soando juntos (o que passar disso fica de fora: nada tocando por cima de tudo).
const SONS_INTERVALO = { pedido_campainha: 0.5, caixa_registradora: 0.3, gorjeta: 0.4, cliente_delicia: 1.2, cliente_hmm: 0.8, cliente_bravo: 0.8,
  cliente_eca: 0.8, chapa_chiado: 2, prato_tchan: 0.3, noite_comemora: 5, festa_rojao: 3, degrau_fanfarra: 2,
  // (14/10, o pacote de cozinha da Gravity Sound: sons_cozinha.py)
  rosa_corta: 2, prato_pronto: 0.25, item_pega: 0.1, item_pousa: 0.1, pedido_certo: 0.8, pedido_errado: 0.8, louca_recolhe: 0.2,
  lavando: 1.5, acao_erro: 0.4, fogo_ruim: 5, copo_ajudante: 0.5, cena_fogo: 1, noite_boa: 3, noite_ruim: 3 };
const SOM_INTERVALO_PADRAO = 0.06, SONS_MAX_VOZES = 7;
const sons = {
  ctx: null, bus: {}, abafo: {}, buffers: new Map(), musicaAtual: '', _fonteMusica: null, _ganhoMusica: null,
  volumes: { musica: 70, ambiente: 80, efeitos: 80, interface: 60 },
  _quando: {}, _vozes: 0,
  iniciar() {
    if (!MODO_TESTE.som) return;   // modo de teste (?test=1): sem áudio nenhum (nada toca, nada é baixado)
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const mestre = this.ctx.createGain(); mestre.connect(this.ctx.destination);
    // música e ambiente passam por um "abafo" (abafar(): a vinheta do fim da noite e a cena de prato baixam o resto)
    for (const b of ['musica', 'ambiente', 'efeitos', 'interface']) {
      const g = this.ctx.createGain(); this.bus[b] = g;
      if (b === 'musica' || b === 'ambiente') { const a = this.ctx.createGain(); g.connect(a); a.connect(mestre); this.abafo[b] = a; } else g.connect(mestre);
    }
    this.aplicarVolumes();
  },
  aplicarVolumes() { for (const b in this.bus) this.bus[b].gain.value = (this.volumes[b] / 100) ** 2; },
  // As gravações de um efeito: nome_1, nome_2... (ou o arquivo único com o nome).
  variacoes(nome) {
    if (typeof SONS_LISTA === 'undefined') return [];
    const v = SONS_LISTA.filter(s => s.startsWith(nome + '_') && /^\d+$/.test(s.slice(nome.length + 1)));
    return v.length ? v : (SONS_LISTA.includes(nome) ? [nome] : []);
  },
  // O que de fato toca para um nome: as gravações dele; sem nenhuma, as da reserva (com o tom e o volume dela); sem as duas, null.
  resolver(nome) {
    const vs = this.variacoes(nome);
    if (vs.length) return { arqs: vs, tom: 1, db: 0, nome };
    const r = SONS_RESERVA[nome], rv = r ? this.variacoes(r[0]) : [];
    return rv.length ? { arqs: rv, tom: r[1], db: r[2], nome: r[0] } : null;
  },
  async buffer(arq) {
    if (!this.buffers.has(arq)) this.buffers.set(arq, fetch('a/som/' + arq + '.mp3?v=' + VERSAO_ARTE).then(r => r.arrayBuffer()).then(b => this.ctx.decodeAudioData(b)).catch(() => null));
    return this.buffers.get(arq);
  },
  // Já baixa (sem tocar) os sons de uma lista: a janta não espera o arquivo chegar na hora do "ka-ching".
  preparar(nomes) { if (!this.ctx) return; for (const n of nomes) { const r = this.resolver(n); if (r) for (const a of r.arqs) this.buffer(a); } },
  // Toca um efeito; devolve a duração (s) do que tocou, ou 0 (sem som, sem arquivo, repetido cedo demais, vozes demais).
  // Cada vez varia um pouco o tom (variacao) e o volume (±1,5 dB), para não cansar.
  async tocar(nome, tom = 1, variacao = 0.08, db = 0) {
    if (!this.ctx || !G.somLigado) return 0;
    const r = this.resolver(nome);
    if (!r) return 0;
    const agora = this.ctx.currentTime, ult = this._quando[nome];
    if (ult != null && agora - ult < (SONS_INTERVALO[nome] ?? SOM_INTERVALO_PADRAO)) return 0;
    if (this._vozes >= SONS_MAX_VOZES) return 0;
    this._quando[nome] = agora;
    const buf = await this.buffer(sorteio(r.arqs));
    if (!buf) return 0;
    const f = this.ctx.createBufferSource(); f.buffer = buf;
    f.playbackRate.value = tom * r.tom * (1 + rnd(-variacao, variacao));
    const g = this.ctx.createGain(); g.gain.value = Math.pow(10, (db + r.db + (VOLUME_EFEITO[r.nome] || 0) + (variacao > 0 ? rnd(-1.5, 1.5) : 0)) / 20);
    f.connect(g); g.connect(this.bus[SONS_INTERFACE.includes(nome) ? 'interface' : 'efeitos']);
    this._vozes++; f.onended = () => { this._vozes = Math.max(0, this._vozes - 1); };
    f.start();
    return buf.duration / f.playbackRate.value;
  },
  // Baixa a música e o ambiente para `nivel` durante `seg` segundos (entra em 0,3 s, volta em 1,2 s): a vinheta passa por cima.
  // abafar(0): devolve já (a cena pulada no meio).
  // vinhetaResta(): quantos segundos faltam da vinheta do fim da noite (0 sem áudio): a fanfarra do degrau espera ela acabar.
  _vinhetaAte: 0,
  vinhetaResta() { return this.ctx ? Math.max(0, this._vinhetaAte - this.ctx.currentTime) : 0; },
  abafar(seg, nivel = 0.25) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    for (const b in this.abafo) { const p = this.abafo[b].gain;
      p.cancelScheduledValues(t0); p.setValueAtTime(p.value, t0);
      if (!(seg > 0)) { p.linearRampToValueAtTime(1, t0 + 0.6); continue; }
      p.linearRampToValueAtTime(nivel, t0 + 0.3); p.setValueAtTime(nivel, t0 + 0.3 + seg); p.linearRampToValueAtTime(1, t0 + 1.5 + seg); }
  },
  // Uma faixa inteira (sem laço), com troca suave (MUSICA_TROCA s): a anterior some enquanto esta entra. fadeFim: a faixa
  // some sozinha nos 3 s finais (fora da pensão, antes do silêncio). nome vazio: só apaga a que está tocando.
  // Quem escolhe a faixa é o rodízio (lá embaixo); se ela não carregar, o rodízio a deixa de lado e nada trava.
  _vezMusica: 0, _durMusica: 0, _posMusica: 0, _tMusica: 0, rodizio: null,
  async musica(nome, fadeFim = false) {
    if (!this.ctx) return;
    const vez = ++this._vezMusica;
    this.musicaAtual = nome; this._durMusica = 0;                           // enquanto a nova carrega, o rodízio não conta a velha
    const buf = nome ? await this.buffer(nome) : null;                      // ... e a velha segue tocando (sem buraco na pensão)
    if (vez !== this._vezMusica) return;                                    // outra troca chegou enquanto esta carregava
    const t0 = this.ctx.currentTime, velha = this._fonteMusica, gv = this._ganhoMusica;
    if (velha) {
      gv.gain.cancelScheduledValues(t0); gv.gain.setValueAtTime(gv.gain.value, t0); gv.gain.linearRampToValueAtTime(0, t0 + MUSICA_TROCA);
      setTimeout(() => { try { velha.stop(); } catch (e) {} }, MUSICA_TROCA * 1000 + 100);
    }
    this._fonteMusica = null;
    if (!nome) return;
    if (!buf) { if (this.rodizio) this.rodizio.falhou(nome, t0); return; }  // não carregou: o rodízio pula para outra
    const f = this.ctx.createBufferSource(); f.buffer = buf;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.55, t0 + MUSICA_TROCA);
    if (fadeFim && buf.duration > 8) { g.gain.setValueAtTime(0.55, t0 + buf.duration - 3); g.gain.linearRampToValueAtTime(0, t0 + buf.duration); }
    f.connect(g); g.connect(this.bus.musica); f.start();
    this._fonteMusica = f; this._ganhoMusica = g; this._durMusica = buf.duration; this._posMusica = 0; this._tMusica = t0;
    // Cada faixa aberta ocupa uns 35 MB: guarda só a que toca (a próxima vem do cache do navegador, o mp3 já baixado).
    for (const n of Object.values(MUSICAS).flat()) if (n !== nome) this.buffers.delete(n);
  },
  // Quanto falta da faixa, em segundos de verdade (anda com a velocidade: a "Última rodada" acelera a da pensão).
  // null enquanto nada toca ou a faixa ainda carrega.
  restanteMusica() {
    const f = this._fonteMusica;
    if (!f || !this._durMusica) return null;
    const t = this.ctx.currentTime, r = f.playbackRate.value || 1;
    this._posMusica += (t - this._tMusica) * r; this._tMusica = t;
    return Math.max(0, (this._durMusica - this._posMusica) / r);
  },
  // Ambiente em laço (pássaros, vento, o burburinho da pensão, a chapa, o copo enchendo): cada um com o próprio volume, que
  // muda devagar (rampa, em s). Laço que não existe na SONS_LISTA não toca (nem é baixado).
  _amb: {},
  async ambiente(nome, alvo, rampa = 1) {
    if (!this.ctx) return;
    let a = this._amb[nome];
    if (!a) {
      if (alvo <= 0 || typeof SONS_LISTA === 'undefined' || !SONS_LISTA.includes(nome)) return;
      a = this._amb[nome] = { g: this.ctx.createGain(), carregando: true, tom: 1, alvo, rampa };
      a.g.gain.value = 0; a.g.connect(this.bus.ambiente);
      const buf = await this.buffer(nome);
      if (!buf) return;
      const f = this.ctx.createBufferSource(); f.buffer = buf; f.loop = true; f.playbackRate.value = a.tom; f.connect(a.g); f.start();
      a.f = f; a.carregando = false;
      alvo = a.alvo; rampa = a.rampa;   // o pedido mais novo (o copo pode ter sido solto enquanto o laço carregava)
    } else { a.alvo = alvo; a.rampa = rampa; }
    a.g.gain.cancelScheduledValues(this.ctx.currentTime);
    a.g.gain.setValueAtTime(a.g.gain.value, this.ctx.currentTime);
    a.g.gain.linearRampToValueAtTime(Math.max(0, alvo), this.ctx.currentTime + rampa);
  },
  // O tom de um laço que já toca (o copo enchendo sobe de tom conforme enche, como o copo de verdade).
  // (revisão) Desliza até o tom novo (constante de 0,05 s) em vez de pular a cada quadro; mudança mínima, nada é agendado.
  ambienteTom(nome, tom) {
    const a = this._amb[nome];
    if (!a || !(tom > 0) || Math.abs(tom - a.tom) < 0.003) return;
    a.tom = tom;
    if (a.f) { const p = a.f.playbackRate, t0 = this.ctx.currentTime; p.cancelScheduledValues(t0); p.setTargetAtTime(tom, t0, 0.05); }
  },
  // Som avulso do ambiente (um canto, uma rajada), num lado sorteado da tela: quebra a repetição do laço de fundo.
  async avulso(nome, lado = 0, db = -6) {
    if (!this.ctx || !G.somLigado || !this.variacoes(nome).length) return;
    const buf = await this.buffer(sorteio(this.variacoes(nome)));
    if (!buf) return;
    const f = this.ctx.createBufferSource(); f.buffer = buf; f.playbackRate.value = 1 + rnd(-0.04, 0.04);
    const g = this.ctx.createGain(); g.gain.value = Math.pow(10, db / 20);
    const p = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (p) { p.pan.value = clamp(lado, -1, 1); f.connect(g); g.connect(p); p.connect(this.bus.ambiente); } else { f.connect(g); g.connect(this.bus.ambiente); }
    f.start();
  },
};
for (const ev of ['pointerdown', 'keydown', 'click', 'touchend']) addEventListener(ev, () => sons.iniciar(), { once: false, capture: true });

// ---------- o rodízio das músicas ----------
// Lógica pura: o relógio (agora) e quanto falta da faixa (restante) chegam de fora, então a s36 testa sem áudio nenhum.
// passo(momento, agora, restante) devolve o que fazer: null (nada), { tocar: nome } (troca suave para essa faixa;
// '' = calar) ou { parar: true } (a faixa acabou e começa o silêncio).
//  - mudou o momento (18h, entrar ou sair da pensão): troca na hora para uma faixa da lista nova;
//  - fora da pensão: a faixa acabou -> silêncio de MUSICA_PAUSA_MIN..MAX s -> outra sorteada;
//  - na pensão: a MUSICA_TROCA + 1 s do fim já entra a próxima (emenda, sem silêncio).
// Nunca a mesma em seguida (nem a última daquele momento, quando a lista deixa). Faixa que não carregou fica de fora.
function criarRodizio(listas = MUSICAS, rand = Math.random) {
  return {
    momento: '', faixa: '', estado: 'parado', pausaAte: 0, ultimaDo: {}, ruins: new Set(),
    sortear(momento) {
      const l = (listas[momento] || []).filter(n => !this.ruins.has(n));
      if (!l.length) return '';
      const nova = l.filter(n => n !== this.faixa && n !== this.ultimaDo[momento]), outra = l.filter(n => n !== this.faixa);
      const c = nova.length ? nova : (outra.length ? outra : l);
      return c[Math.min(c.length - 1, Math.floor(rand() * c.length))];
    },
    _tocar(momento) {
      const n = this.sortear(momento);
      this.estado = n ? 'tocando' : 'parado';
      if (n) { this.faixa = n; this.ultimaDo[momento] = n; }
      return { tocar: n };
    },
    passo(momento, agora, restante) {
      if (momento !== this.momento) { this.momento = momento; return this._tocar(momento); }
      if (this.estado === 'pausa') return agora >= this.pausaAte ? this._tocar(momento) : null;
      if (this.estado !== 'tocando' || restante == null) return null;
      if (momento === 'pensao') return restante <= MUSICA_TROCA + 1 ? this._tocar(momento) : null;
      if (restante > 0) return null;
      this.estado = 'pausa'; this.pausaAte = agora + MUSICA_PAUSA_MIN + rand() * (MUSICA_PAUSA_MAX - MUSICA_PAUSA_MIN);
      return { parar: true };
    },
    // A faixa não carregou: sai do sorteio e, no próximo passo, entra outra (sem silêncio extra).
    falhou(nome, agora) { this.ruins.add(nome); if (nome === this.faixa && this.estado === 'tocando') { this.estado = 'pausa'; this.pausaAte = agora; } },
  };
}
sons.rodizio = criarRodizio();
// O momento da música: o salão da pensão; fora dela, a noite a partir das 18h; senão o dia.
function momentoMusica() { return noSalaoDaPensao() ? 'pensao' : (G.minutos >= 18 * 60 ? 'noite' : 'dia'); }

let _proxCanto = 8;
setInterval(() => {
  if (!G.comecou || !sons.ctx) return;
  const momento = momentoMusica(), resta = sons.restanteMusica();
  const ac = sons.rodizio.passo(momento, sons.ctx.currentTime, resta);
  if (ac) sons.musica(ac.tocar || '', !!ac.tocar && momento !== 'pensao');
  // (13/10, o Dave: a música acelera perto de fechar) Na "Última rodada!", a música da pensão anda mais ligeira.
  if (sons._fonteMusica) { const r = momento === 'pensao' && G.turno && G.turno._ultima ? 1.1 : 1; if (sons._fonteMusica.playbackRate.value !== r) sons._fonteMusica.playbackRate.value = r; }
  // Fora de casa: o fundo do dia (passarinhos) ou da noite (grilos, sapos), e a brisa acompanhando o vento (vida.js).
  // Os fundos são laços longos emendados sem pausa (produzir_ambiente.sh); dentro de casa, só um fio do lado de fora.
  const fora = G.mapa && !G.mapa.dentro && !G.mapa.cenario && !G.mapa.subsolo, dia = G.minutos >= 5 * 60 + 30 && G.minutos < 18 * 60 + 30;
  const vento = typeof VIDA !== 'undefined' ? VIDA.vento : 0.5;
  sons.ambiente('amb_dia', fora && dia ? 0.45 : (dia ? 0.06 : 0));
  sons.ambiente('amb_noite', fora && !dia ? 0.5 : (!dia ? 0.07 : 0));
  sons.ambiente('amb_vento', fora ? 0.1 + 0.25 * vento : 0);
  sincronizarMao();   // (revisão) também aqui: com menu, modal ou cena aberta os atualizadores param, e a mão cala
  atualizarAmbientePensao();
  // Cantos avulsos de dia, em horas sorteadas e de lados diferentes (nunca o mesmo desenho do laço).
  _proxCanto -= 1;
  if (fora && dia && _proxCanto <= 0) { _proxCanto = Math.round(rnd(6, 18)); sons.avulso(sorteio(['avulso_bemtevi', 'avulso_sabia', 'avulso_rolinha']), rnd(-0.85, 0.85), rnd(-12, -5)); }
}, 1000);
// ---------- a pensão barulhenta (14/10, o Dave: o sushi bar é barulhento e divertido) ----------
// O som de cada evento da janta, como um plano: [[atraso s, nome, tom, variação, dB], ...]. Lógica pura (a s38 confere sem áudio).
// ev.semSom: o evento já foi contado de outro jeito (o cliente foi embora com o prato na mão do Jocelino).
// (14/10, o pacote de cozinha da Gravity Sound) rand: o sorteio do corte da Rosa (a s38 passa um fixo).
const ROSA_CORTA_CHANCE = 0.3;   // de cada 10 pratos que entram no fogo, uns 3 começam com o "tchac" da faca da Rosa
function somDoEvento(ev, rand = Math.random) {
  if (!ev || ev.semSom) return [];
  switch (ev.tipo) {
    // o pedido novo (New Order) e, logo depois, a panela entrando no fogo (Cooking Stir); às vezes a Rosa corta algo antes (Chop)
    case 'pediu': { const p = [[0, 'pedido_campainha', 1, 0.04, -6], [0.6, 'chapa_chiado', 1, 0.06, -12]];
      if (rand() < ROSA_CORTA_CHANCE) p.push([1.2, 'rosa_corta', 1, 0.08, -12]);
      return p; }
    case 'pronto': return [[0, 'prato_pronto', 1, 0.04, -8]];                          // o prato pronto no passe (Finish Action)
    case 'maquina_serviu': return [[0, 'servir', 1.3, 0.05, -10]];                     // (Tarefa D1) a máquina de refresco serviu um copo
    // o prato chegou: o cliente prova (a cena de prato tem a plateia dela: aí não há reação por cima). Gostou (4★ ou mais): o
    // "acertou!" (Correct Order) e o "hmm, delícia"; prato errado: o "errou!" (Incorrect Order) e o "eca"
    case 'servido': if (ev.cena) return [];
      if (ev.certo === false) return [[0.1, 'pedido_errado', 1, 0.03, -9], [0.45, 'cliente_eca', 1, 0.1, -4]];
      if (ev.reacao === 'nojo') return [[0.45, 'cliente_eca', 1, 0.1, -4]];
      return ev.estrelas >= 4 ? [[0.15, 'pedido_certo', 1, 0.03, -10], [0.45, 'cliente_delicia', 1, 0.1, -4]] : [[0.45, 'cliente_hmm', 1, 0.1, -4]];
    // pagou: a caixa registradora; no salão antigo a gorjeta entra junto (no balcão ela fica em moedas até o Jocelino recolher)
    case 'pagou': return ev.modo === 'antigo' && ev.gorjeta > 0 ? [[0, 'caixa_registradora', 1, 0.05, -6], [0.35, 'gorjeta', 1, 0.08, -6]] : [[0, 'caixa_registradora', 1, 0.05, -6]];
    case 'gorjeta': return [[0, 'gorjeta', 1, 0.08, -6]];                               // as moedinhas do balcão recolhidas
    case 'embora': return [[0, 'pedido_errado', 0.94, 0.03, -10], [0.3, 'cliente_bravo', 1, 0.08, -4]];   // foi embora bravo
    case 'vip_faltou': return [[0, 'pedido_errado', 0.9, 0, -8], [0.3, 'cliente_bravo', 0.9, 0.05, -2]];
    case 'louca': return [[0, 'cliente_eca', 1, 0.08, -6]];
    case 'farinha_baixa': return [[0, 'rosa_resmunga', 1.15, 0.05, -6]];             // (Tarefa C) a Rosa chama: a farinheira no fim
    case 'farinha': return [[0, 'fogo_ruim', 1, 0.05, -6]];                            // a farinheira acabou e a cozinha parou: deu ruim no fogo (uma vez)
    case 'ultima_rodada': return SONS_LISTA.includes('sino_ultima_rodada') ? [[0, 'sino_ultima_rodada', 1, 0, -2]] : [[0, 'fanfarra', 1.4, 0, -10]];
    case 'favorito': return [[0, 'rosa_animada', 1.2, 0.05, -8]];
    case 'zezinho_cocada': return [[0, 'cliente_hmpf', 1.4, 0.05, -8]];
    case 'vip_servido': return [[0, 'fanfarra', 1.1, 0, -6]];
    case 'inauguracao': return [[0, 'festa_rojao', 1, 0.03, -2]];                      // a janta da inauguração começou
    case 'fim_janta': return [[0, 'noite_comemora', 1, 0, -3]];                        // a vinheta de samba antes do fechamento
  }
  return [];
}
// Toca o plano de um evento (o atraso por setTimeout). A vinheta do fim da noite abafa a música e o ambiente enquanto toca.
function tocarSomDoEvento(ev) {
  for (const [atraso, nome, tom, vari, db] of somDoEvento(ev)) {
    const vai = () => { const p = sons.tocar(nome, tom, vari, db);
      if (nome === 'noite_comemora') Promise.resolve(p).then(d => { if (d > 0 && sons.ctx) { sons.abafar(d); sons._vinhetaAte = sons.ctx.currentTime + d; } }); };
    if (atraso > 0) setTimeout(vai, atraso * 1000); else vai();
  }
}
// Os sons que a janta usa: já baixados no "Abrir a pensão".
const SONS_DA_JANTA = ['pedido_campainha', 'prato_tchan', 'servir', 'cliente_delicia', 'cliente_hmm', 'cliente_eca', 'caixa_registradora', 'gorjeta',
  'cliente_bravo', 'chapa_chiado', 'noite_comemora', 'contagem_dinheiro', 'estrela_1', 'estrela_2', 'estrela_3', 'estrela_4', 'estrela_5', 'degrau_fanfarra',
  'cena_entrada', 'cena_tchan', 'cena_ploft', 'cena_faca', 'cena_borbulha', 'cena_plateia', 'festa_rojao',
  // (14/10, o pacote de cozinha)
  'rosa_corta', 'prato_pronto', 'item_pega', 'item_pousa', 'pedido_certo', 'pedido_errado', 'louca_recolhe', 'lavando', 'acao_erro', 'fogo_ruim',
  'copo_ajudante', 'cena_fogo', 'noite_boa', 'noite_ruim', 'chapa_laco', 'copo_enchendo', 'cerveja_enchendo', 'peneira_laco'];
// (14/10, o pacote de cozinha) Os laços da mão do Jocelino no palco: o copo enchendo enquanto ele segura (a cerveja num despejo
// mais grave) e a peneira enquanto peneira. Um de cada vez (as duas coisas nunca acontecem juntas). Lógica pura: o nome ou ''.
const LACOS_MAO = { copo_enchendo: 0.5, cerveja_enchendo: 0.5, peneira_laco: 0.35 };   // o volume de cada um (canal de ambiente)
// (revisão) Com o jogo parado (menu, modal como o fechamento da janta, cena de prato) a mão não toca nada.
function lacoDaMao() {
  if (!G.turno || typeof noPalco !== 'function' || !noPalco() || (typeof menuAberto === 'function' && menuAberto())) return '';
  const c = G.copo;
  if (c && c.segurando) return c.cerveja ? 'cerveja_enchendo' : 'copo_enchendo';
  return G.peneira ? 'peneira_laco' : '';
}
// O fundo da janta: o burburinho do salão (mais gente, mais alto) e a chapa chiando de leve enquanto a Rosa cozinha (prato no
// fogo, farinha na farinheira e a cozinha montada: o fogo parou, a chapa some). Com um laço da mão tocando, a chapa cala (nunca
// três laços juntos: o burburinho, a chapa e a mão). Fora da janta (ou fora do salão), tudo a 0. Lógica pura: { laço: volume }.
// A Rosa está cozinhando? (prato no fogo, farinha na farinheira, a cozinha montada e o Jocelino no salão; a mão não conta)
function fogoDaRosa() {
  const t = G.turno, sal = !!t && typeof noSalaoDaPensao === 'function' && noSalaoDaPensao();
  const cozinha = typeof cozinhaPronta !== 'function' || cozinhaPronta();
  return sal && cozinha && t.farinha > 0 && ((t.fogo && t.fogo.length > 0) || (t.mesas || []).some(m => m.estado === 'prato' && m.modo === 'antigo' && !m.pronto));
}
function ambientePensao() {
  const t = G.turno, sal = !!t && typeof noSalaoDaPensao === 'function' && noSalaoDaPensao();
  const gente = sal ? (t.mesas || []).filter(m => ['pedido', 'prato', 'comendo'].includes(m.estado)).length : 0;
  const mao = sal ? lacoDaMao() : '', a = { salao_burburinho: sal ? Math.min(0.4, 0.18 + 0.04 * gente) : 0, chapa_laco: fogoDaRosa() && !mao ? 0.22 : 0 };
  for (const n in LACOS_MAO) a[n] = n === mao ? LACOS_MAO[n] : 0;
  return a;
}
let _chapaAcesa = false;
// Leva o fundo da janta ao volume certo (entra em 2 s; no fim da janta some devagar, em 4 s; calada pela mão, em 0,3 s). A chapa
// que acende dá um chiado: só quando o FOGO acende (revisão: calar a chapa pela mão e soltar o copo não chia de novo). Os laços
// da mão ficam com o sincronizarMao (ligam e desligam na hora).
function atualizarAmbientePensao() {
  const a = ambientePensao(), mao = Object.keys(LACOS_MAO).some(n => a[n] > 0), fogo = fogoDaRosa();
  for (const n of ['salao_burburinho', 'chapa_laco']) sons.ambiente(n, a[n], a[n] > 0 ? 2 : (n === 'chapa_laco' && mao ? 0.3 : 4));
  if (fogo && !_chapaAcesa) sons.tocar('chapa_chiado', 1, 0.08, -10);
  _chapaAcesa = fogo;
}
// A mão do Jocelino: segurou o copo, o despejo entra em 0,06 s; soltou, some em 0,15 s; o tom sobe com o nível (1 vazio, 1,25
// cheio). A peneira do mesmo jeito. Muda só quando o laço da mão muda (a chapa cala ou volta junto). Roda a cada quadro e também
// no relógio de 1 s e a cada 250 ms (os atualizadores param com menu, modal ou cena: o fechamento da janta não pode ficar com o
// copo despejando por baixo) e no fim da janta (encerrarJanta).
let _maoAntes = '';
function sincronizarMao() {
  const m = lacoDaMao(), c = G.copo;
  if (m !== _maoAntes) {
    _maoAntes = m;
    for (const n in LACOS_MAO) sons.ambiente(n, n === m ? LACOS_MAO[n] : 0, n === m ? 0.06 : 0.15);
    atualizarAmbientePensao();
  }
  if (m && c && c.segurando) sons.ambienteTom(m, 1 + 0.25 * clamp(c.nivel, 0, 1));
}
ATUALIZADORES.push(sincronizarMao);
setInterval(() => { if (sons.ctx && _maoAntes) sincronizarMao(); }, 250);
// (Tarefa D1) A máquina de refresco começou um copo (um t._maq novo): o despejo curto e baixo, como o do ajudante (Fill Drink).
let _maqAntes = null;
ATUALIZADORES.push(() => {
  const t = G.turno, M = t ? t._maq : null;
  if (M && M !== _maqAntes && typeof noSalaoDaPensao === 'function' && noSalaoDaPensao()) sons.tocar('copo_ajudante', 1.05, 0.05, -14);
  _maqAntes = M || null;
});

// Passos pelo piso (grama, chão de terra/calçada, madeira dentro da pensão).
let _passoT = 0;
ATUALIZADORES.push(dt => {
  const j = G.jog;
  if (!j || !j.andando) { _passoT = 0.2; return; }
  _passoT -= dt;
  if (_passoT > 0) return;
  _passoT = G.teclas.has(TECLAS.correr) ? 0.24 : 0.32;
  const t = j.ladrilho();
  const piso = G.mapa.dentro ? 'passo_madeira' : (G.mapa.chaoEm(t.x, t.y) === CH.GRAMA ? 'passo_grama' : 'passo_chao');
  sons.tocar(piso, 1, 0.1, 0);
});
