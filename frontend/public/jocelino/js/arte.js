// Jocelino — arte.js — carrega a arte (a/<nome>.webp) sob demanda, decodificada antes de desenhar, com cache.
// A arte cartoon foi gerada a 48 px por ladrilho: aqui ela é desenhada no tamanho original (sem encolher).
// Arte que falta vira um retângulo magenta (e um aviso no console), sem quebrar o jogo.

const SPR = new Map();
const ARTE_FALTANDO = new Set();
// Devolve a imagem pronta, ou null enquanto carrega / se faltar.
function spr(nome) {
  let r = SPR.get(nome);
  if (!r) {
    const img = new Image();
    r = { img, pronta: false, erro: false };
    SPR.set(nome, r);
    img.onload = () => { img.decode().catch(() => {}).finally(() => { r.pronta = true; }); };
    img.onerror = () => { r.erro = true; if (!ARTE_FALTANDO.has(nome)) { ARTE_FALTANDO.add(nome); console.warn('arte faltando: ' + nome); } };
    img.src = 'a/' + nome + '.webp';
  }
  return r.pronta ? r.img : null;
}
// Espera uma lista de artes carregarem (tela de carregando, testes).
function carregarArtes(nomes) {
  return Promise.all(nomes.map(n => new Promise(ok => {
    spr(n);
    const r = SPR.get(n);
    const t = setInterval(() => { if (r.pronta || r.erro) { clearInterval(t); ok(r.pronta); } }, 20);
  })));
}
// Desenha a imagem com o pé (base, centro) em (x, y) do mundo. `alfa` para transparência.
function desenhaPe(ctx, nome, x, y, alfa = 1, escala = 1) {
  const img = spr(nome);
  if (!img) {
    const r = SPR.get(nome);
    if (r && r.erro) { ctx.fillStyle = 'rgba(255,0,255,.6)'; ctx.fillRect(x - 20, y - 40, 40, 40); }
    return;
  }
  const w = img.naturalWidth * escala, h = img.naturalHeight * escala;
  if (alfa !== 1) { ctx.globalAlpha = alfa; ctx.drawImage(img, x - w / 2, y - h, w, h); ctx.globalAlpha = 1; }
  else ctx.drawImage(img, x - w / 2, y - h, w, h);
}
// Peça de efeito (a/fx/*.webp, gerada no Higgsfield): centrada em (x, y), com escala, giro, espelho e transparência.
// Sem a arte carregada não desenha nada (nada de arte provisória feita por código).
function desenhaFx(ctx, nome, x, y, o = {}) {
  const img = spr('fx/' + nome);
  if (!img) return false;
  const e = o.escala || 1, w = img.naturalWidth * e, h = img.naturalHeight * e;
  ctx.save();
  if (o.alfa != null) ctx.globalAlpha *= o.alfa;
  ctx.translate(x, y);
  if (o.ang) ctx.rotate(o.ang);
  if (o.espelho) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, o.base ? -h : -h / 2, w, h);
  ctx.restore();
  return true;
}
// Ícone de item (para o HTML).
const urlItem = id => 'a/itens/' + id + '.webp';
