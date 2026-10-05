/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   TREINO: deixar o personagem treinando sem perder as reuniões do clube
   (feedback: quem deixava treinando perdia as reuniões, porque o dia do
   jogo continuava passando).
   - MODO TREINO (jogo aberto): o calendário do jogo PARA. Não passa dia,
     então não chega reunião nem acaba prazo de meta (e também não cai
     salário). O resto do jogo funciona normal: bater no boneco, caçar...
   - TREINO OFFLINE: perto de um Boneco de Treino (Vila e CT) ou na sua
     casa, escolhe uma habilidade e sai do jogo. Quando voltar, ganha o
     treino do tempo em que ficou fora — METADE do que renderia com o jogo
     aberto, até 12 horas.
   Carregar DEPOIS de carreira.js e casas.js.
   ============================================================ */
const TREINO = {
  offMin: 10 * 60000, offMax: 12 * 3600000,
  // com o jogo aberto, o boneco dá 1 tentativa a cada 1,5 s (2400/h); offline rende a metade
  porHora: { drible: 1200, chute: 1200, defesa: 1200, visao: 4000 },
};
function treinoLigado() { return !!(G.save && G.save.treinoOn); }

// ---------- modo treino: o calendário fica parado ----------
const _atualizaTreino = atualiza;
atualiza = function (dt) {
  const s = G.save; if (!s || !s.treinoOn) return _atualizaTreino.apply(this, arguments);
  const h = s.hora, d = s.dia; const r = _atualizaTreino.apply(this, arguments);
  s.hora = h; s.dia = d; return r;
};
function alternaModoTreino(ligar) {
  const s = G.save; if (!s) return;
  const novo = ligar == null ? !s.treinoOn : !!ligar;
  // v225: o descanso do time conta até a hora de ligar; o tempo com o Modo Treino ligado não conta (senão dava para
  // "treinar" com o calendário parado e continuar jogando o modo clube com o time sempre descansado)
  if (novo && !s.treinoOn && typeof recuperaEnergia === 'function') recuperaEnergia();
  if (!novo && s.treinoOn && s.time) s.time.ultEnergia = Date.now();
  s.treinoOn = novo;
  log(s.treinoOn ? '🏋️ Modo Treino LIGADO: o calendário do jogo parou (e o seu time não descansa enquanto isso). Pode deixar treinando que nenhuma reunião do clube vai passar.' : '🏋️ Modo Treino desligado: o tempo do jogo voltou a correr.', 'l-xp');
  som('apito'); salvar(); G.uiSujo = true; atualizaChipTreino();
}

// ---------- treino offline ----------
function pertoDeBoneco() {
  const s = G.save;
  if (s.casa && G.mapa && G.mapa.id === s.casa.id) return true;
  return G.mons.some(m => m.d.treino && dist(m, G.p) < 5);
}
// v386 (dono: "deixei treinando Visão de Jogo a noite toda, não subiu nada"): a Visão offline rendia 4.000/h fixos, mas ela
// sobe gastando FOCO e cada nível pede muito mais lá em cima (Visão 66→67 de atacante: ~700 mil) — eram 175 h por nível.
// Agora a Visão offline rende METADE da recuperação de foco do personagem (como as físicas rendem metade do boneco),
// medida na hora de começar e sem as comidas (que acabam durante a noite). Nunca menos que os 4.000/h de antes.
// v390: a metade da recuperação de foco também ficou rápida demais para quem tem muito foco. Agora a Visão offline sobe no
// mesmo ritmo das físicas offline (1 nível de Visão = o tempo de 1 nível de Chute do mesmo número). Nunca menos de 4.000/h.
function porHoraOffline(sk) {
  const base = TREINO.porHora[sk] || 0, s = G.save;
  if (sk !== 'visao' || !s) return base;
  const fis = TREINO.porHora.chute || 1200, lv = (s.sk.visao && s.sk.visao.lv) || 1;
  return Math.max(base, Math.round(fis * (typeof ritmoVisao === 'function' ? ritmoVisao(lv) : 1)));
}
function comecaTreinoOffline(sk) {
  const s = G.save; if (!pertoDeBoneco()) return;
  s.treinoOff = { sk, desde: Date.now(), porHora: porHoraOffline(sk) }; s.treinoOn = false; salvar();
  try { if (typeof enviaSave === 'function') enviaSave(); } catch (e) { }
  abreModal(el('h2', {}, '🌙 Treino offline começou!'),
    el('p', {}, `Seu personagem ficou treinando ${SKILLS[sk].nome}. Pode fechar o jogo tranquilo(a).`),
    el('p', { class: 'dica' }, 'Quando voltar, você recebe o treino do tempo em que ficou fora (até 12 horas). Offline rende a metade do treino com o jogo aberto.'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => { try { salvar(); } catch (e) { } location.reload(); } }, 'Sair do jogo')));
  $('#modal').onclick = null; G.pausado = true;
}
function resgataTreinoOffline() {
  const s = G.save; const t = s && s.treinoOff; if (!t) return;
  s.treinoOff = null;
  const ms = Math.min(TREINO.offMax, Math.max(0, Date.now() - t.desde));
  if (ms < TREINO.offMin || !SKILLS[t.sk]) { log('🌙 O treino offline foi curtinho demais (menos de 10 minutos) e não contou.', 'l-sis'); salvar(); return; }
  const antes = s.sk[t.sk].lv; const n = Math.round(ms / 3600000 * (t.sk === 'visao' ? porHoraOffline('visao') : (t.porHora || porHoraOffline(t.sk)))); // (treino começado antes da v386: a conta nova também; v390: a Visão sempre na conta nova)
  treinaSkill(t.sk, n); const depois = s.sk[t.sk].lv;
  const h = Math.floor(ms / 3600000), min = Math.round(ms % 3600000 / 60000);
  const tempo = h ? `${h}h${min ? String(min).padStart(2, '0') : ''}` : `${min} min`;
  salvar();
  abreModal(el('h2', {}, '🏋️ Bem-vindo(a) de volta!'),
    el('p', {}, `Enquanto você estava fora (${tempo}), seu personagem treinou ${SKILLS[t.sk].nome}.`),
    el('p', { style: 'font-size:18px;font-weight:800' }, depois > antes ? `${SKILLS[t.sk].nome}: ${antes} → ${depois} 🎉` : `${SKILLS[t.sk].nome} ${depois}: a barra de treino encheu mais um pouco!`),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: fechaModal }, 'Bora jogar!')));
}
const _iniciarJogoTreino = iniciarJogo;
iniciarJogo = async function (...a) {
  const r = await _iniciarJogoTreino.apply(this, a);
  if (G.save && G.save.treinoOff) setTimeout(() => { try { resgataTreinoOffline(); } catch (e) { } }, 1800);
  return r;
};

// ---------- janela de treino ----------
function modalTreino() {
  const s = G.save; if (!s) return;
  const on = !!s.treinoOn; const perto = pertoDeBoneco();
  const escolha = el('div', { class: 'opcoes treino-sk' },
    ...['drible', 'chute', 'defesa', 'visao'].map(sk => {
      // quanto falta para o próximo nível, no ritmo offline (até 12 h por vez)
      const falta = Math.max(0, precisaTentativas(sk, s.sk[sk].lv) - s.sk[sk].t), h = falta / Math.max(1, porHoraOffline(sk));
      const quando = h < 1 ? `~${Math.max(1, Math.round(h * 60))} min` : `~${h < 10 ? h.toFixed(1).replace('.', ',') : Math.round(h)} h`;
      return el('button', { class: 'btn', type: 'button', disabled: perto ? null : 'disabled', onclick: () => comecaTreinoOffline(sk), title: `Offline: ${porHoraOffline(sk).toLocaleString('pt-BR')} tentativas por hora` }, `${SKILLS[sk].nome} ${s.sk[sk].lv}`, el('small', { class: 'treino-falta' }, ` · próximo nível ${quando}`));
    }));
  abreModal(el('h2', {}, '🏋️ Treino'),
    el('h3', {}, 'Modo Treino (com o jogo aberto)'),
    el('p', {}, 'Vai deixar o personagem treinando (no boneco ou caçando)? Ligue o Modo Treino: o calendário do jogo para, então nenhuma reunião do clube passa enquanto você está longe da tela. Enquanto ele estiver ligado, também não passa dia de salário e o seu time não descansa.'),
    el('div', { class: 'opcoes' }, el('button', { class: on ? 'btn' : 'btn amarelo', type: 'button', onclick: () => { alternaModoTreino(); modalTreino(); } }, on ? '⏹️ Desligar Modo Treino' : '▶️ Ligar Modo Treino')),
    el('h3', {}, 'Treino offline (jogo fechado)'),
    el('p', {}, 'Escolha uma habilidade e saia do jogo. Quando voltar, ela terá treinado pelo tempo em que você ficou fora (até 12 horas). Offline rende a METADE do treino com o jogo aberto — e nos aparelhos do 🏋️ Centro de Treinamento o treino com o jogo aberto rende ainda mais (2,5x o offline). Quanto mais alta a habilidade, mais tempo leva para subir.'),
    perto ? el('p', { class: 'dica' }, 'Qual habilidade vai treinar?') : el('p', { class: 'vazio' }, '📍 Para treinar offline, fique perto de um Boneco de Treino (na Vila do Campinho ou no CT) ou dentro da sua casa.'),
    escolha);
}
function atualizaChipTreino() {
  let chip = document.getElementById('chipTreino');
  const on = treinoLigado();
  if (!on) { if (chip) chip.remove(); return; }
  if (!chip) {
    const info = document.querySelector('#topo .topo-info'); if (!info) return;
    chip = el('button', { class: 'tag treino-chip', id: 'chipTreino', type: 'button', title: 'O calendário do jogo está parado. Clique para abrir o Treino.', onclick: modalTreino }, '🏋️ Modo Treino · tempo parado');
    info.prepend(chip);
  }
}
(function () {
  const poe = () => {
    const lista = document.querySelector('#topo .tb-lista');
    if (lista && !document.getElementById('btnTreino')) lista.prepend(el('button', { class: 'btn', id: 'btnTreino', type: 'button', role: 'menuitem', onclick: () => { if (G.save) modalTreino(); } }, '🏋️ Treino (modo treino e offline)'));
    const grade = document.querySelector('#celMenu .cm-grade');
    if (grade && !document.getElementById('cmTreino')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmTreino', type: 'button', onclick: () => { if (G.save) modalTreino(); } }, el('span', { class: 'cm-ic' }, '🏋️'), 'Treino'));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poe, 0)); else setTimeout(poe, 0);
  const _iniciarChip = iniciarJogo;
  iniciarJogo = async function (...a) { const r = await _iniciarChip.apply(this, a); poe(); atualizaChipTreino(); return r; };
  const st = document.createElement('style');
  st.textContent = `
  .treino-chip { cursor: pointer; background: #d8f5c0 !important; color: #1a5a2a !important; border: 1px solid #5aa04a; font-weight: 800; }
  .treino-sk .btn { min-width: 110px; }
  `;
  document.head.append(st);
})();
// dica: bateu no boneco pela primeira vez
const _ataqueAutoTreino = ataqueAutomatico;
ataqueAutomatico = function () {
  const a = G.alvo; if (a && a.d && a.d.treino && G.save && !G.save.treinoOn) dica('modo_treino', 'Vai deixar treinando no boneco? Abra ☰ Mais → 🏋️ Treino: o Modo Treino para o calendário (nenhuma reunião do clube passa) e o Treino Offline treina até com o jogo fechado.');
  return _ataqueAutoTreino.apply(this, arguments);
};

/* ---------- ritmo das habilidades (v136) ----------
   Antes: no nível 25, 5 h de boneco davam Drible 67 (quase o mesmo de um nível 91).
   Agora a curva é a mesma para todo mundo, mas cada ponto custa cada vez mais a partir
   do 18 (visão: a partir do 8). Tempo de treino contínuo para chegar em cada valor:
   15 min → 26 · 1 h → 35 · 5 h → 46 · 12 h → 52 · 24 h → 57 · 50 h → 63 · 100 h → 69 · 200 h → 76.
   Ninguém perde o que já tem. */
const _precisaTentativasBase = precisaTentativas;
precisaTentativas = function (sk, lv) {
  const x = Math.max(0, lv - (sk === 'visao' ? 8 : 18)) / 10;
  return Math.max(1, Math.round(_precisaTentativasBase(sk, lv) * (1 + x * x)));
};
/* Experiência de jogo: como as habilidades agora sobem bem mais devagar, quem joga normal
   chegaria nos níveis altos com menos dano/defesa do que o jogo foi equilibrado. Esse bônus
   vem só do nível (aparece como "+X" nas Habilidades) e mantém chefes e cidades no ritmo. */
function bonusExperiencia(nivel) { const n = Math.max(0, nivel - 12); return Math.max(0, Math.round(0.28 * n - 0.0003 * n * n)); }
const _statsTreino = stats;
stats = function () {
  const st = _statsTreino.apply(this, arguments); const B = bonusExperiencia(st.nivel || (G.save && G.save.nivel) || 1);
  if (B) { st.drible += B; st.chute += B; st.defesa += B; st.visao += Math.round(B * 0.8); st.def += B * 0.3; }
  return st;
};

/* ---------- v248: o meio da curva ficou mais rápido; perto de 80/90 continua bem difícil ----------
   Pedido do dono: acima de ~50 cada ponto demorava demais (60→61 levava ~4 h de boneco).
   Multiplica o que era preciso por um fator que cai no meio (até 0,2 perto do 70) e volta a 1 no 90.
   Minutos por ponto no boneco (Drible/Chute/Defesa), antes → agora:
   50: 76 → 30 · 55: 139 → 44 · 60: 247 → 64 · 65: 429 → 94 · 70: 731 → 146 · 75: 1225 → 306 · 80: 2023 → 809 · 85: 3302 → 2311 · 90+: igual.
   A Visão usa a mesma régua deslocada 20 pontos (Visão 30 ≈ Drible 50). Ninguém perde o que já tem. */
const CURVA_V248 = [[35, 1], [40, 0.7], [45, 0.55], [50, 0.4], [55, 0.32], [60, 0.26], [65, 0.22], [70, 0.2], [75, 0.25], [80, 0.4], [85, 0.7], [90, 1]];
function fatorCurvaSkill(sk, lv) {
  const x = sk === 'visao' ? lv + 20 : lv, C = CURVA_V248;
  if (x <= C[0][0]) return 1; if (x >= C[C.length - 1][0]) return 1;
  for (let i = 1; i < C.length; i++) if (x <= C[i][0]) { const [a, fa] = C[i - 1], [b, fb] = C[i]; return fa + (fb - fa) * (x - a) / (b - a); }
  return 1;
}
{
  const _precisaV247 = precisaTentativas;
  precisaTentativas = function (sk, lv) { return Math.max(1, Math.round(_precisaV247(sk, lv) * fatorCurvaSkill(sk, lv))); };
}

/* v250: com a curva nova (v248) o treino já guardado pode passar do que o próximo ponto pede (aparecia "123%").
   Ao entrar no jogo, a habilidade sobe na hora o que já deve. */
{
  const _iniciarCurva = iniciarJogo;
  iniciarJogo = async function (...a) {
    const r = await _iniciarCurva.apply(this, a);
    try { const s = G.save; if (s && s.sk) for (const k of Object.keys(s.sk)) if (s.sk[k].t >= precisaTentativas(k, s.sk[k].lv)) treinaSkill(k, 0); } catch (e) { }
    return r;
  };
}
{ const st = document.createElement('style'); st.textContent = '#skills .sk-bonus { color: #2f9a3f; font-weight: 800; }'; document.head.append(st); }
