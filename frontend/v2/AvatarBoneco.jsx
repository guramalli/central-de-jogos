import { useEffect, useState } from "react";
import { useCatalogoAvatar } from "./avatarCatalogo.js";
import { buscarPerfil, perfilEmCache } from "./perfil.js";
import "./avatar.css";

// Avatar montado: empilha as camadas (todas do mesmo tamanho de tela,
// 900×1200) na ordem do catálogo. Dois jeitos:
//   - corpo inteiro: <AvatarBoneco config={...} altura={240} />
//   - busto (cabeça e ombros, pras bolinhas): <AvatarBoneco config={...} busto tamanho={40} />
//     O busto é o MESMO empilhamento, ampliado e deslocado — o recorte vem
//     do catálogo (tela.busto), não há arte separada.
// `recorte` ({ x, y, lado } em pixels da tela) troca o enquadramento do
// busto — o editor usa pra mostrar cada peça de perto.
//
// Arte que falta (ainda não desenhada, ou falhou ao baixar) é só pulada; se
// faltar o corpo, entra uma silhueta tracejada no lugar dele.

// Usado só enquanto o catálogo não chegou (pra caixa já nascer do tamanho
// certo, sem a página pular).
const TELA_PADRAO = { largura: 900, altura: 1200, busto: { x: 225, y: 70, lado: 450 } };

// Arquivos que já deram erro nesta aba: os outros bonecos nem tentam de novo
// (numa lista com 30 jogadores, seriam 30 pedidos pro mesmo arquivo que falta).
const arteQueFalhou = new Set();

// Regra das bolinhas, num lugar só (Avatar da v2 e AvatarImp do Impostor):
// nas pequenas (chat, listas) vale a escolha da pessoa (`mostrarAvatar`);
// nos lugares grandes (`sempre`: pódio, perfil, cartão do nick) o avatar
// aparece sempre que existir. Sem avatar montado: null (fica a foto/iniciais).
export function montagemNaBolinha(perfil, sempre = false) {
  return perfil?.avatar?.pele && (sempre || perfil.mostrarAvatar) ? perfil.avatar : null;
}

// A mesma regra pra quem só tem o id (usa o cache de perfis da v2, então não
// custa busca extra onde o Avatar/hover já pediram o perfil).
export function useBonecoNaBolinha(userId, sempre = false) {
  const [perfil, setPerfil] = useState(() => perfilEmCache(userId));
  useEffect(() => {
    let vivo = true;
    buscarPerfil(userId).then((p) => vivo && p && setPerfil(p));
    return () => { vivo = false; };
  }, [userId]);
  return montagemNaBolinha(perfil, sempre);
}

export default function AvatarBoneco({ config, altura = 240, busto = false, tamanho = 40, preencher = false, recorte, className = "", rotulo }) {
  const catalogo = useCatalogoAvatar();
  const [, setFalhas] = useState(0);
  const tela = catalogo?.tela || TELA_PADRAO;

  let caixa, palco;
  if (busto) {
    // Em PORCENTAGEM da caixa (que é quadrada): várias telas forçam o
    // tamanho da bolinha no CSS (!important), e o recorte acompanha.
    const r = recorte || tela.busto;
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

  const camadas = [];
  for (const slot of catalogo?.camadas || []) {
    const item = catalogo.porId.get(config?.[slot]);
    const ok = item && item.slot === slot && !arteQueFalhou.has(item.arquivo);
    if (ok) camadas.push({ slot, item });
    else if (slot === "pele" && config?.pele) camadas.push({ slot, silhueta: true });
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

// Corpo provisório (sem arte): cabeçona chibi + corpo, em tracejado discreto.
// Mesmas coordenadas da tela (900×1200), então o busto recorta igual.
function Silhueta() {
  return (
    <svg className="v2-boneco-silhueta" viewBox="0 0 900 1200" preserveAspectRatio="none" aria-hidden="true">
      <circle cx="450" cy="330" r="210" />
      <rect x="300" y="560" width="300" height="360" rx="90" />
      <rect x="320" y="900" width="110" height="230" rx="50" />
      <rect x="470" y="900" width="110" height="230" rx="50" />
    </svg>
  );
}
