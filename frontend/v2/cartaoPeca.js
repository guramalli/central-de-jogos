import { camadasDaMontagem } from "./AvatarBoneco.jsx";

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

export async function montarCartaoPeca({ catalogo, config, item }) {
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

  // Avatar: a tela de 900×1200 escalada pra 810×1080.
  const camadas = camadasDaMontagem(catalogo, { ...config, [item.slot]: item.id });
  const imagens = await Promise.all(camadas.map((c) => carregar(c.arquivo)));
  const [ax, ay, aw, ah] = [135, 300, 810, 1080];
  for (const img of imagens) if (img) ctx.drawImage(img, ax, ay, aw, ah);

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
export async function compartilharPeca({ catalogo, config, item }) {
  const blob = await montarCartaoPeca({ catalogo, config, item });
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
