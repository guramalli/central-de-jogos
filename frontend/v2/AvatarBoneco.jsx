import { useEffect, useState } from "react";
import { useCatalogoAvatar, ENQUADRAMENTO } from "./avatarCatalogo.js";
import { buscarPerfil, perfilEmCache } from "./perfil.js";
import "./avatar.css";

// Avatar montado: empilha as camadas (todas do mesmo tamanho de tela,
// 900×1200) na ordem do catálogo. Três jeitos:
//   - corpo inteiro: <AvatarBoneco config={...} altura={240} />
//   - cabeça (bolinhas pequenas: chat, listas): <AvatarBoneco config={...} busto="cabeca" tamanho={32} />
//   - busto (bolinhas grandes: pódio, cartão do nick): <AvatarBoneco config={...} busto tamanho={76} />
//   Cabeça e busto são o MESMO empilhamento, ampliado e deslocado — os
//   recortes vêm do catálogo (tela.cabeca / tela.busto), sem arte separada.
// `recorte` ({ x, y, lado } em pixels da tela) troca o enquadramento — o
// editor usa pra mostrar cada peça de perto.
//
// Arte que falta (ainda não desenhada, ou falhou ao baixar) é só pulada; se
// faltar o corpo, entra uma silhueta tracejada no lugar dele.

// Usado só enquanto o catálogo não chegou (pra caixa já nascer do tamanho
// certo, sem a página pular).
const TELA_PADRAO = {
  largura: 900,
  altura: 1200,
  cabeca: { x: 225, y: 265, lado: 450 },
  busto: { x: 140, y: 220, lado: 620 },
};

// Arquivos que já deram erro nesta aba: os outros bonecos nem tentam de novo
// (numa lista com 30 jogadores, seriam 30 pedidos pro mesmo arquivo que falta).
const arteQueFalhou = new Set();

// Regra das bolinhas, num lugar só (Avatar da v2, AvatarImp do Impostor,
// Tribunal): o perfil sempre traz um avatar (o montado ou o padrão sorteado
// do id). Ele aparece:
//   - nos lugares grandes (`sempre`: pódio, perfil, cartão do nick);
//   - nas bolinhas de quem escolheu "Avatar";
//   - nas bolinhas de quem NÃO tem foto (no lugar das iniciais).
// Quem tem foto e escolheu "Foto" continua com a foto nas bolinhas.
// null = mostra a foto (ou as iniciais, se nem perfil houver — bots).
export function montagemNaBolinha(perfil, sempre = false, temFoto = !!perfil?.avatarUrl) {
  if (!perfil?.avatar?.pele) return null;
  return sempre || perfil.mostrarAvatar || !temFoto ? perfil.avatar : null;
}

// Perfil do jogador pelo cache da v2 (não custa busca extra onde o
// Avatar/hover já pediram o mesmo perfil).
function usePerfil(userId) {
  const [perfil, setPerfil] = useState(() => perfilEmCache(userId));
  useEffect(() => {
    let vivo = true;
    buscarPerfil(userId).then((p) => vivo && p && setPerfil(p));
    return () => { vivo = false; };
  }, [userId]);
  return perfil;
}

// A regra das bolinhas pra quem só tem o id.
export function useBonecoNaBolinha(userId, sempre = false) {
  return montagemNaBolinha(usePerfil(userId), sempre);
}

// Corpo inteiro de um jogador pelo id (pódios de sala, Tribunal). Sem
// perfil (bot, falha de rede): mostra `reserva`.
// `semFundo`: no meio de uma cena (pódio de sala, Tribunal) o retângulo do
// fundo escolhido brigaria com o cenário — só o personagem aparece.
export function BonecoDoJogador({ userId, altura = 120, reserva = null, className = "", rotulo, semFundo = false }) {
  const config = useBonecoNaBolinha(userId, true);
  return config ? <AvatarBoneco config={config} altura={altura} className={className} rotulo={rotulo} semFundo={semFundo} /> : reserva;
}

// Miniatura redonda de UMA peça (editor, coleção do perfil, aviso de peça
// nova), no enquadramento da parte do corpo dela.
export function MiniaturaPeca({ item, tamanho = 64 }) {
  return <AvatarBoneco config={{ [item.slot]: item.id }} busto tamanho={tamanho} recorte={ENQUADRAMENTO[item.slot]} />;
}

// Lista das camadas (na ordem de desenho) de uma montagem — o cartão de
// compartilhar usa pra desenhar no canvas.
export function camadasDaMontagem(catalogo, config) {
  const lista = [];
  for (const slot of catalogo?.camadas || []) {
    const item = catalogo.porId.get(config?.[slot]);
    if (item && item.slot === slot) lista.push(item);
  }
  return lista;
}

export default function AvatarBoneco({ config, altura = 240, busto = false, tamanho = 40, preencher = false, recorte, className = "", rotulo, semFundo = false }) {
  const catalogo = useCatalogoAvatar();
  const [, setFalhas] = useState(0);
  const tela = { ...TELA_PADRAO, ...(catalogo?.tela || {}) };

  let caixa, palco;
  if (busto) {
    // Em PORCENTAGEM da caixa (que é quadrada): várias telas forçam o
    // tamanho da bolinha no CSS (!important), e o recorte acompanha.
    const r = recorte || (busto === "cabeca" ? tela.cabeca : tela.busto);
    const pct = (v) => `${(v / r.lado) * 100}%`;
    const esc = tamanho / r.lado;
    caixa = preencher ? { width: "100%", height: "100%" } : { width: tamanho, height: tamanho };
    palco = { width: pct(tela.largura), height: pct(tela.altura), left: pct(-r.x), top: pct(-r.y), px: [tela.largura * esc, tela.altura * esc] };
  } else {
    const esc = altura / tela.altura;
    caixa = { width: Math.round(tela.largura * esc), height: altura };
    palco = { width: tela.largura * esc, height: altura, left: 0, top: 0, px: [tela.largura * esc, altura] };
  }
  const { px, ...estiloPalco } = palco;

  // Cor da pele de quem veste: pinta as máscaras de pele (braço que a
  // regata descobre, mão que segura o objeto...).
  const corDaPele = catalogo?.porId.get(config?.pele)?.cor;
  const camadas = [];
  for (const slot of catalogo?.camadas || []) {
    if (semFundo && slot === "fundo") continue;
    const item = catalogo.porId.get(config?.[slot]);
    const ok = item && item.slot === slot && !arteQueFalhou.has(item.arquivo);
    if (ok) {
      // Máscara logo ABAIXO da peça (dentro do mesmo slot: máscara, peça).
      if (item.mascaraPele && corDaPele) camadas.push({ slot: `${slot}-pele`, mascara: item.mascaraPele });
      camadas.push({ slot, item });
    } else if (slot === "pele" && config?.pele) camadas.push({ slot, silhueta: true });
  }

  // width/height nos <img> reservam o espaço antes da arte chegar.
  const larg = Math.round(px[0]);
  const alt = Math.round(px[1]);
  return (
    <span
      className={`v2-boneco ${busto ? "busto" : ""} ${className}`}
      style={caixa}
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
    >
      <span className="v2-boneco-palco" style={estiloPalco}>
        {camadas.map((c) =>
          c.silhueta ? (
            <Silhueta key={c.slot} />
          ) : c.mascara ? (
            // Branco sobre transparente, usado como máscara de um bloco da
            // cor da pele: do mesmo tamanho das camadas, então encaixa.
            <span
              key={c.slot}
              className="v2-boneco-mascara"
              style={{
                backgroundColor: corDaPele,
                maskImage: `url("${c.mascara}")`,
                WebkitMaskImage: `url("${c.mascara}")`,
              }}
            />
          ) : (
            <img
              key={c.slot}
              src={c.item.arquivo}
              alt=""
              width={larg}
              height={alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={() => { arteQueFalhou.add(c.item.arquivo); setFalhas((n) => n + 1); }}
            />
          )
        )}
      </span>
    </span>
  );
}

// Corpo provisório (sem arte): cabeçona chibi + corpo, em tracejado discreto,
// embaixo e centralizado como a arte final. Mesmas coordenadas da tela
// (900×1200), então cabeça e busto recortam igual.
function Silhueta() {
  return (
    <svg className="v2-boneco-silhueta" viewBox="0 0 900 1200" preserveAspectRatio="none" aria-hidden="true">
      <circle cx="450" cy="495" r="205" />
      <rect x="290" y="700" width="320" height="240" rx="80" />
      <rect x="320" y="920" width="100" height="175" rx="45" />
      <rect x="480" y="920" width="100" height="175" rx="45" />
    </svg>
  );
}
