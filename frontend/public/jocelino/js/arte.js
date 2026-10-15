// Jocelino — arte.js — carrega a arte (a/<nome>.webp) sob demanda, decodificada antes de desenhar, com cache.
// A arte cartoon foi gerada a 48 px por ladrilho: aqui ela é desenhada no tamanho original (sem encolher).
// Arte que falta vira um retângulo magenta (e um aviso no console), sem quebrar o jogo.

// A versão da publicação (o ?v= deste script, trocado pelo hash do commit): vai no endereço de toda arte e som, para o
// navegador não ficar com a arte velha do cache (a Vercel deixa a imagem guardada por até um dia).
const VERSAO_ARTE = (() => { try { return new URL(document.currentScript.src, location.href).searchParams.get('v') || '1'; } catch (e) { return '1'; } })();
const urlArte = nome => 'a/' + nome + '.webp?v=' + VERSAO_ARTE;
const SPR = new Map();
const ARTE_FALTANDO = new Set();
// Devolve a imagem pronta, ou null enquanto carrega / se faltar.
function spr(nome) {
  let r = SPR.get(nome);
  if (!r) {
    const img = new Image();
    r = { img, pronta: false, erro: false };
    SPR.set(nome, r);
    img.onload = () => { img.densidade = densidadeDe(nome, img); img.decode().catch(() => {}).finally(() => { r.pronta = true; }); };   // (densidade: abaixo)
    img.onerror = () => { r.erro = true; if (!ARTE_FALTANDO.has(nome)) { ARTE_FALTANDO.add(nome); console.warn('arte faltando: ' + nome); } };
    img.src = urlArte(nome);
  }
  return r.pronta ? r.img : null;
}
// Depois que o jogo começa, carrega o resto da arte aos poucos (porVez por vez), para nada ser baixado no meio do jogo (teste de
// 12/10: as travadas e o cursor de "pensando" vinham da arte baixada na primeira vez que aparecia na tela).
function precarregarArtes(nomes, porVez = 4) {
  const fila = nomes.filter(n => !SPR.has(n)); let ativos = 0;
  const proximo = () => {
    while (ativos < porVez && fila.length) {
      const n = fila.shift(); spr(n); ativos++; const r = SPR.get(n);
      const t = setInterval(() => { if (r.pronta || r.erro) { clearInterval(t); ativos--; setTimeout(proximo, 30); } }, 50);
    }
  };
  proximo();
}
// Espera uma lista de artes carregarem (tela de carregando, testes).
function carregarArtes(nomes) {
  return Promise.all(nomes.map(n => new Promise(ok => {
    spr(n);
    const r = SPR.get(n);
    const t = setInterval(() => { if (r.pronta || r.erro) { clearInterval(t); ok(r.pronta); } }, 20);
  })));
}
// (15/10, o dono: "os personagens aparecem embaçados no restaurante") As folhas de gente (a/personagens/...) foram ampliadas no
// Higgsfield e têm ARTE_GENTE vezes os pixels do desenho original (ferramentas_arte/produzir_nitidez.sh). Todo tamanho e coordenada
// de quadro do jogo continua medido no desenho original (o quadro de 66x114 do adulto, o de 132x204 do golpe, as mãos, o pé): quem
// recorta a folha divide o tamanho do arquivo por fatorGente(img), e o mundo fica do mesmo tamanho, só mais nítido. Vale 3 só para
// a folha com exatamente 3x uma das larguras de antes; a que não foi ampliada (ou uma nova, de outro tamanho) vale 1.
const ARTE_GENTE = 3;
const LARGURAS_GENTE_ANTES = new Set([264, 384, 240, 216, 528, 90]);   // andar (adulto, Caramelo, Ritinha, Zezinho), golpe, pose antiga
// (15/10, 2ª etapa) A DENSIDADE de toda arte ampliada, num lugar só: a arte solta do salão (pacotes A e B da auditoria
// .superpowers/sdd/2026-10-14-guia-abc/nitidez-salao-auditoria.md) e os fundos das cenas também foram ampliados, cada um no seu
// fator. A tabela guarda a LARGURA DE ANTES de cada uma (o desenho original): a densidade é a largura do arquivo dividida por ela
// (2, 3, 4) quando a conta dá inteira; senão 1 (a arte antiga, ou trocada por outra de outro tamanho, continua igual). spr() mede
// ao carregar (img.densidade); desenhaPe, desenhaFx, camadaPalco e os drawImage diretos usam larguraArte/alturaArte (o tamanho no
// mundo) — o mundo fica do mesmo tamanho, só mais nítido. As folhas de gente seguem a regra delas (LARGURAS_GENTE_ANTES).
// Quem desenha um pedaço da arte por px (sx, sy) multiplica pela densidade (o copo do minijogo, as folhas de gente).
// (Ficaram as de antes: salao/fundo_noite — a ampliação inventou detalhe: o alho, a flâmula, rachaduras na parede — e
// fx/barra_moldura — falhou no servidor; não refeita para não passar do teto de créditos.)
const LARGURA_ANTES = {
  'salao/moedas_balcao': 40, 'fx/coracao': 22, 'fx/exclamacao': 15,
  // (16/10, T8 das conversas) os 6 balões de emoção que faltavam: 72 px no arquivo, 24 no mundo (o tamanho do coração)
  'fx/interrogacao': 24, 'fx/nota_musical': 24, 'fx/gota_suor': 24, 'fx/raiva': 24, 'fx/sono': 24, 'fx/reticencias': 24,
  'salao/copo_cafe': 260, 'salao/copo_guarana': 260, 'salao/copo_caldo': 260, 'salao/liquido_cafe': 260, 'salao/liquido_guarana': 260,
  'salao/liquido_caldo': 260, 'salao/espuma_topo': 260, 'salao/copo_cafe_dentro': 260, 'salao/copo_guarana_dentro': 260, 'salao/copo_caldo_dentro': 260,
  'salao/frente_esquerda': 481, 'salao/frente_direita': 268, 'salao/balcao': 979, 'salao/passa_prato': 720,
  'salao/cozinha': 440, 'salao/passe': 180, 'salao/bacia': 64, 'salao/lixo': 39, 'fx/balao': 53, 'fx/balao_pensamento': 53,
  'ui/carimbo_medida': 140, 'ui/carimbo_quase': 140, 'ui/carimbo_derramou': 140, 'ui/pensao/palmeirinha_giz': 71,
  'cenas/capricho_fundo': 1600, 'cenas/capricho_reacao': 1600, 'cenas/letreiro_fundo': 1600, 'cenas/letreiro_reacao': 1600,
  'cenas/moqueca_fundo': 1600, 'cenas/moqueca_reacao': 1600, 'cenas/peixe_fundo': 1600, 'cenas/peixe_prato': 1600,
  'cenas/peixe_reacao': 1600, 'cenas/pf_fundo': 1600, 'cenas/pf_prato': 1600, 'cenas/pf_reacao': 1600,
};
function densidadeDe(nome, img) {
  if (!img || !img.naturalWidth) return 1;
  if (nome.startsWith('personagens/')) return LARGURAS_GENTE_ANTES.has(img.naturalWidth / ARTE_GENTE) ? ARTE_GENTE : 1;
  const d = LARGURA_ANTES[nome] ? img.naturalWidth / LARGURA_ANTES[nome] : 1;
  return Number.isInteger(d) && d > 1 ? d : 1;
}
const densidade = img => (img && img.densidade) || 1;
const larguraArte = img => img.naturalWidth / densidade(img);    // o tamanho no mundo (o do desenho original)
const alturaArte = img => img.naturalHeight / densidade(img);
const fatorGente = densidade;   // (o nome da 1ª etapa, nas folhas de gente)
// Desenha a imagem com o pé (base, centro) em (x, y) do mundo. `alfa` para transparência.
function desenhaPe(ctx, nome, x, y, alfa = 1, escala = 1) {
  const img = spr(nome);
  if (!img) {
    const r = SPR.get(nome);
    if (r && r.erro) { ctx.fillStyle = 'rgba(255,0,255,.6)'; ctx.fillRect(x - 20, y - 40, 40, 40); }
    return;
  }
  const w = larguraArte(img) * escala, h = alturaArte(img) * escala;
  if (alfa !== 1) { ctx.globalAlpha = alfa; ctx.drawImage(img, x - w / 2, y - h, w, h); ctx.globalAlpha = 1; }
  else ctx.drawImage(img, x - w / 2, y - h, w, h);
}
// Peça de efeito (a/fx/*.webp, gerada no Higgsfield): centrada em (x, y), com escala, giro, espelho e transparência.
// Sem a arte carregada não desenha nada (nada de arte provisória feita por código).
function desenhaFx(ctx, nome, x, y, o = {}) {
  const img = spr('fx/' + nome);
  if (!img) return false;
  const e = o.escala || 1, w = larguraArte(img) * e, h = alturaArte(img) * e;
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
const urlItem = id => urlArte('itens/' + id);
