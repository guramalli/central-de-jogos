import { camadasDaMontagem, corDoCabelo, posicaoDaPlaca } from "./AvatarBoneco.jsx";
import { CHAVE_DO_MES, mesesDeCampeao } from "./avatarCatalogo.js";

// Cartão de "story" (1080×1920) pra compartilhar uma peça nova: o avatar da
// pessoa já vestindo a peça, o nome dela e o convite pro site. Montado no
// navegador, num canvas — nada é gerado nem guardado no servidor.
//
// As camadas são os mesmos arquivos estáticos do boneco (mesma origem, então
// o canvas não fica "contaminado" e dá pra exportar). Camada que não carrega
// é pulada, como no boneco da tela.

const LARGURA = 1080;
const ALTURA = 1920;
const SITE = "www.educacaogamer.com.br";
const FONTE = '"Fredoka", "Trebuchet MS", sans-serif';

function carregar(src) {
  return new Promise((ok) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

// Máscara branca pintada com uma cor: desenha a máscara num canvas à parte e
// preenche com a cor só onde ela tem pixel ("source-in").
function pintar(mascara, cor, largura, altura) {
  const c = document.createElement("canvas");
  c.width = largura;
  c.height = altura;
  const g = c.getContext("2d");
  g.drawImage(mascara, 0, 0, largura, altura);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = cor;
  g.fillRect(0, 0, largura, altura);
  return c;
}

// Cabelo pintado (mesma conta do boneco da tela): o cinza multiplicado pela
// cor e depois recortado pelo contorno do próprio cinza ("destination-in"),
// senão o preenchimento da cor vazaria pela tela inteira.
function pintarCabelo(cinza, cor, largura, altura) {
  const c = document.createElement("canvas");
  c.width = largura;
  c.height = altura;
  const g = c.getContext("2d");
  g.drawImage(cinza, 0, 0, largura, altura);
  g.globalCompositeOperation = "multiply";
  g.fillStyle = cor;
  g.fillRect(0, 0, largura, altura);
  g.globalCompositeOperation = "destination-in";
  g.drawImage(cinza, 0, 0, largura, altura);
  return c;
}

// Quebra um texto em linhas que caibam na largura.
function linhas(ctx, texto, largura) {
  const saida = [];
  let atual = "";
  for (const palavra of texto.split(" ")) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > largura && atual) { saida.push(atual); atual = palavra; }
    else atual = teste;
  }
  if (atual) saida.push(atual);
  return saida;
}

// Desenha uma camada (já pintada ou não) na área do avatar. Espelhada (mão
// esquerda): vira em torno do centro e só a metade esquerda fica, como no
// boneco da tela (.espelhado no avatar.css).
function desenharCamada(ctx, fonte, [ax, ay, aw, ah], espelhado) {
  if (!espelhado) { ctx.drawImage(fonte, ax, ay, aw, ah); return; }
  ctx.save();
  ctx.beginPath();
  ctx.rect(ax, ay, aw / 2, ah);
  ctx.clip();
  ctx.translate(ax + aw, ay);
  ctx.scale(-1, 1);
  ctx.drawImage(fonte, 0, 0, aw, ah);
  ctx.restore();
}

// Mês na plaqueta do troféu (sem espelhar o texto).
function desenharPlaca(ctx, placa, texto, espelhado, [ax, ay, aw, ah], tela) {
  const p = posicaoDaPlaca(placa, espelhado, tela.largura);
  const esc = aw / tela.largura;
  ctx.save();
  ctx.translate(ax + p.x * esc, ay + p.y * (ah / tela.altura));
  ctx.rotate((p.angulo * Math.PI) / 180);
  ctx.fillStyle = "#6b3d06";
  ctx.font = `700 ${p.fonte * esc}px ${FONTE}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, 0, 0);
  ctx.restore();
}

// `campeonatos`: meses de campeão por jogo — troféu recém-ganho sem mês
// escolhido ainda mostra o mais recente na plaqueta.
export async function montarCartaoPeca({ catalogo, config, item, campeonatos }) {
  const canvas = document.createElement("canvas");
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext("2d");

  // Fundo roxo da marca, com um brilho atrás do boneco.
  const fundo = ctx.createLinearGradient(0, 0, 0, ALTURA);
  fundo.addColorStop(0, "#3d2a80");
  fundo.addColorStop(1, "#1d1242");
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  const brilho = ctx.createRadialGradient(LARGURA / 2, 900, 60, LARGURA / 2, 900, 620);
  brilho.addColorStop(0, "rgba(255, 214, 10, .35)");
  brilho.addColorStop(1, "rgba(255, 214, 10, 0)");
  ctx.fillStyle = brilho;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd60a";
  ctx.font = `700 64px ${FONTE}`;
  ctx.fillText("NOVA PEÇA DESBLOQUEADA!", LARGURA / 2, 190);

  // Avatar: a tela de 900×1200 escalada pra 810×1080. Peça com máscara de
  // pele: a máscara pintada com a cor da pele vai logo abaixo dela.
  const montagem = { ...config, [item.slot]: item.id };
  // Troféu novo: se o mês gravado não é de um campeonato desse jogo, vale o
  // mais recente.
  const meses = mesesDeCampeao(item, campeonatos);
  if (item.placa && meses.length && !meses.includes(montagem[CHAVE_DO_MES[item.slot]])) montagem[CHAVE_DO_MES[item.slot]] = meses[0];
  const corDaPele = catalogo.porId.get(montagem.pele)?.cor;
  const corCabelo = corDoCabelo(catalogo, montagem);
  const camadas = camadasDaMontagem(catalogo, montagem);
  const [imagens, mascaras, cinzas] = await Promise.all([
    Promise.all(camadas.map((c) => carregar(c.item.arquivo))),
    Promise.all(camadas.map((c) => (c.item.mascaraPele && corDaPele ? carregar(c.item.mascaraPele) : null))),
    Promise.all(camadas.map((c) => (c.slot === "cabelo" && corCabelo ? carregar(c.item.pintavel) : null))),
  ]);
  const area = [135, 300, 810, 1080];
  const [, , aw, ah] = area;
  const tela = catalogo.tela || { largura: 900, altura: 1200 };
  camadas.forEach((c, i) => {
    if (mascaras[i]) desenharCamada(ctx, pintar(mascaras[i], corDaPele, aw, ah), area, c.espelhado);
    // Cinza que não carregou: fica o cabelo original.
    if (cinzas[i]) desenharCamada(ctx, pintarCabelo(cinzas[i], corCabelo, aw, ah), area, false);
    else if (imagens[i]) desenharCamada(ctx, imagens[i], area, c.espelhado);
    if (imagens[i] && c.placa) desenharPlaca(ctx, c.item.placa, c.placa, c.espelhado, area, tela);
  });

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 84px ${FONTE}`;
  ctx.fillText(item.nome, LARGURA / 2, 1470);

  ctx.fillStyle = "#cfc6f5";
  ctx.font = `600 46px ${FONTE}`;
  linhas(ctx, `Desbloqueei ${item.nome} no Educação Gamer!`, 900).forEach((l, i) => ctx.fillText(l, LARGURA / 2, 1545 + i * 56));

  const logo = await carregar("/educacao-gamer-logo.png");
  if (logo) {
    // Cabe numa caixa de 420×150 (entre o texto e o endereço do site).
    const esc = Math.min(420 / logo.width, 150 / logo.height);
    const w = logo.width * esc;
    const h = logo.height * esc;
    ctx.drawImage(logo, (LARGURA - w) / 2, 1790 - h, w, h);
  }
  ctx.fillStyle = "#ffd60a";
  ctx.font = `700 42px ${FONTE}`;
  ctx.fillText(SITE, LARGURA / 2, 1860);

  return new Promise((ok) => canvas.toBlob(ok, "image/png"));
}

// Compartilha com o arquivo (Web Share, no celular); sem suporte, baixa o PNG.
export async function compartilharPeca({ catalogo, config, item, campeonatos }) {
  const blob = await montarCartaoPeca({ catalogo, config, item, campeonatos });
  if (!blob) return;
  const nome = `educacao-gamer-${item.id}.png`;
  const arquivo = new File([blob], nome, { type: "image/png" });
  const texto = `Desbloqueei ${item.nome} no Educação Gamer! https://${SITE}/`;
  try {
    if (navigator.canShare?.({ files: [arquivo] })) {
      await navigator.share({ files: [arquivo], text: texto });
      return;
    }
  } catch (err) {
    if (err?.name === "AbortError") return; // a pessoa fechou o menu de compartilhar
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
