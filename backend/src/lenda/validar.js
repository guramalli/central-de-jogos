// ===== Lenda do Campinho — validação do que o jogo manda pro servidor =====
//
// O jogo roda inteiro no navegador. O servidor só guarda duas coisas:
//   - o SAVE (comprimido pelo próprio jogo: gzip em base64). O servidor não
//     abre o conteúdo — só confere tamanho e formato;
//   - a CASA publicada (móveis e itens expostos), que os outros jogadores
//     veem ao passar na porta e ao visitar.
//
// Tudo aqui é função pura (sem banco), pra ser testado em test/lenda/.
// Os limites são folgados pro jogo normal e apertados pra quem tentar
// mandar lixo.

export const LIMITES = {
  saveMaxChars: 90_000, // save comprimido em base64 (o express.json aceita até 100 kB)
  nivelMax: 999,
  moveisMax: 150,
  itensMax: 150,
  vitrineMax: 3,
  coordMax: 40,
  refinoMax: 10,
  prestigioMax: 100_000,
};

const RE_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const RE_MAPA = /^[a-z]{2,12}$/;
const RE_CASA = /^casa_([a-z]{2,12})_(\d{1,2})$/;
const RE_MOVEL = /^mv_[a-z_]{2,30}$/;
const RE_ITEM = /^[a-z0-9_]{2,40}$/;

const inteiro = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

export function validarSave(body) {
  const { dados, nivel } = body || {};
  if (typeof dados !== "string" || !dados.length) return { erro: "Save vazio." };
  if (dados.length > LIMITES.saveMaxChars) return { erro: "Save grande demais." };
  if (!RE_BASE64.test(dados)) return { erro: "Save em formato inválido." };
  if (!inteiro(nivel, 1, LIMITES.nivelMax)) return { erro: "Nível inválido." };
  return { ok: true, dados, nivel };
}

function coordOk(o) {
  return o && inteiro(o.x, 0, LIMITES.coordMax) && inteiro(o.y, 0, LIMITES.coordMax);
}

export function validarCasa(body) {
  const { casaId, mapa, moveis, itens, vitrine, prestigio } = body || {};
  const m = typeof casaId === "string" ? casaId.match(RE_CASA) : null;
  if (!m) return { erro: "Casa inválida." };
  if (typeof mapa !== "string" || !RE_MAPA.test(mapa) || m[1] !== mapa) return { erro: "Lugar da casa inválido." };
  if (!Array.isArray(moveis) || moveis.length > LIMITES.moveisMax) return { erro: "Móveis inválidos." };
  if (!Array.isArray(itens) || itens.length > LIMITES.itensMax) return { erro: "Itens inválidos." };
  if (!Array.isArray(vitrine) || vitrine.length > LIMITES.vitrineMax) return { erro: "Vitrine inválida." };
  if (!inteiro(prestigio, 0, LIMITES.prestigioMax)) return { erro: "Prestígio inválido." };

  const ocupado = new Set();
  const moveisOk = [];
  for (const mv of moveis) {
    if (!coordOk(mv) || typeof mv.id !== "string" || !RE_MOVEL.test(mv.id)) return { erro: "Móvel inválido." };
    const k = mv.x + "," + mv.y;
    if (ocupado.has(k)) return { erro: "Dois móveis no mesmo lugar." };
    ocupado.add(k);
    moveisOk.push({ x: mv.x, y: mv.y, id: mv.id });
  }
  const itemNoLugar = new Set();
  const itensOk = [];
  for (const it of itens) {
    if (!coordOk(it) || typeof it.id !== "string" || !RE_ITEM.test(it.id)) return { erro: "Item inválido." };
    const r = it.r == null ? 0 : it.r;
    if (!inteiro(r, 0, LIMITES.refinoMax)) return { erro: "Refino inválido." };
    const k = it.x + "," + it.y;
    if (itemNoLugar.has(k)) return { erro: "Dois itens no mesmo lugar." };
    itemNoLugar.add(k);
    itensOk.push({ x: it.x, y: it.y, id: it.id, r });
  }
  const vitrineOk = [];
  for (const v of vitrine) {
    if (!v || typeof v.id !== "string" || !RE_ITEM.test(v.id)) return { erro: "Vitrine inválida." };
    const r = v.r == null ? 0 : v.r;
    if (!inteiro(r, 0, LIMITES.refinoMax)) return { erro: "Vitrine inválida." };
    vitrineOk.push({ id: v.id, r });
  }
  return { ok: true, casa: { casaId, mapa, moveis: moveisOk, itens: itensOk, vitrine: vitrineOk, prestigio } };
}

// Resumo do progresso pro ranking online. Só números e nomes curtos; o nome
// mostrado vem da conta (apelido), então o do personagem nem é aceito aqui.
const FASES_VALIDAS = new Set(["Criança", "Juvenil", "Sub-20", "Profissional", "Lenda"]);
const RE_POSICAO = /^[a-z_]{2,20}$/;
export function validarRanking(body) {
  const { nivel, xp, posicao, fase, time, chefes = 0, figs = 0 } = body || {};
  if (!inteiro(nivel, 1, LIMITES.nivelMax)) return { erro: "Nível inválido." };
  if (!inteiro(xp, 0, 2_000_000_000)) return { erro: "XP inválido." };
  if (posicao != null && (typeof posicao !== "string" || !RE_POSICAO.test(posicao))) return { erro: "Posição inválida." };
  if (!FASES_VALIDAS.has(fase)) return { erro: "Fase inválida." };
  if (!inteiro(chefes, 0, 100_000) || !inteiro(figs, 0, 100_000)) return { erro: "Números inválidos." };
  let timeOk = null;
  if (time != null) {
    const nome = typeof time.nome === "string" ? time.nome.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 30) : "";
    if (!nome || !inteiro(time.div, 0, 50) || !inteiro(time.titulos ?? 0, 0, 100_000)) return { erro: "Time inválido." };
    timeOk = { nome, div: time.div, titulos: time.titulos ?? 0 };
  }
  return { ok: true, ranking: { nivel, xp, posicao: posicao ?? null, fase, time: timeOk, chefes, figs } };
}

// Quais casas mostrar num lugar: algumas das mais prestigiadas (as "vitrines"
// que valem a visita) + um sorteio entre as outras, pra todo mundo ter chance
// de ser visto. `lista` já vem do banco; `sortear` é injetável pra teste.
export function escolherCasas(lista, { excluir = null, limite = 6, topo = 2, sortear = Math.random } = {}) {
  const candidatas = lista.filter((c) => c.userId !== excluir);
  const porPrestigio = [...candidatas].sort((a, b) => b.prestigio - a.prestigio);
  const escolhidas = porPrestigio.slice(0, Math.min(topo, limite));
  const resto = porPrestigio.slice(escolhidas.length);
  while (escolhidas.length < limite && resto.length) {
    const i = Math.floor(sortear() * resto.length) % resto.length;
    escolhidas.push(resto.splice(i, 1)[0]);
  }
  return escolhidas;
}
