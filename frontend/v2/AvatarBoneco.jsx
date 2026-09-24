import { useEffect, useState } from "react";
import { useCatalogoAvatar, ENQUADRAMENTO, slotDasPecas, CHAVE_DO_MES, textoDaPlaca } from "./avatarCatalogo.js";
import { buscarPerfil, perfilEmCache, ouvirPerfil } from "./perfil.js";
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
// Avatar/hover já pediram o mesmo perfil). Perfil editado nesta aba
// (esquecerPerfil): busca de novo.
function usePerfil(userId) {
  const [perfil, setPerfil] = useState(() => perfilEmCache(userId));
  useEffect(() => {
    let vivo = true;
    const buscar = () => buscarPerfil(userId).then((p) => vivo && p && setPerfil(p));
    buscar();
    const parar = ouvirPerfil(userId, buscar);
    return () => { vivo = false; parar(); };
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
//
// A peça vai VESTIDA no corpo (a pele) da pessoa, sem as outras peças: a
// arte de cada camada traz pedacinhos do contorno do corpo pra fechar as
// frestas, que sozinhos (sem o corpo embaixo) desenhavam um rosto fantasma
// atrás do cabelo. `corpo`: a montagem atual (só a pele e o tipo de corpo
// são usados; sem pele, a primeira do catálogo). Fundo aparece sozinho.
// `corCabelo`: o editor mostra os cabelos pintáveis já na cor escolhida.
// `slot`: onde a peça vai (a aba "Mão esq." mostra a peça da mão espelhada).
export function MiniaturaPeca({ item, tamanho = 64, corCabelo, corpo, slot = item.slot }) {
  const catalogo = useCatalogoAvatar();
  const config = { [slot]: item.id };
  if (slot !== "fundo") {
    if (slot !== "pele") config.pele = corpo?.pele || catalogo?.itens.find((i) => i.slot === "pele")?.id;
    if (corpo?.corpo) config.corpo = corpo.corpo;
  }
  if (corCabelo && slot === "cabelo") config.corCabelo = corCabelo;
  return <AvatarBoneco config={config} busto tamanho={tamanho} recorte={ENQUADRAMENTO[slot] || ENQUADRAMENTO[item.slot]} />;
}

// Cor (hex) do cabelo de uma montagem, ou null pra camada original: sem
// cor escolhida, "original", cabelo que não se pinta, ou catálogo antigo
// (sem paleta) guardado no navegador.
export function corDoCabelo(catalogo, config) {
  const chave = config?.corCabelo;
  if (!chave || chave === "original") return null;
  if (!catalogo?.porId.get(config?.cabelo)?.pintavel) return null;
  return catalogo.coresCabelo?.find((c) => c.chave === chave)?.cor || null;
}

const feminino = (config) => config?.corpo === "feminino";

// Cor da pele de uma montagem (a do corpo feminino é um tiquinho diferente).
export function corDaPeleDe(catalogo, config) {
  const pele = catalogo?.porId.get(config?.pele);
  return (feminino(config) && pele?.corFeminina) || pele?.cor;
}

// Arquivo de uma peça numa montagem: a pele troca pela versão feminina.
export function arquivoDaPeca(item, config) {
  return (item.slot === "pele" && feminino(config) && item.arquivoFeminino) || item.arquivo;
}

// Lista das camadas (na ordem de desenho) de uma montagem — o boneco da
// tela e o cartão de compartilhar desenham a partir dela.
//   camadas: { slot, item, arquivo, espelhado, placa, apagavel }
//     placa    — texto da plaqueta ("SET/26") de troféu com mês escolhido;
//     apagavel — camada recortada pelas máscaras de apagar o braço.
//   apagas: máscaras de apagar o braço das mãos vestidas ({ mascara, espelhado });
//   aura:   alguma peça vestida tem aura (as de ouro do Quiz).
export function camadasDaMontagem(catalogo, config, { semFundo = false } = {}) {
  const camadas = [];
  const apagas = [];
  let aura = false;
  const apagaveis = new Set(catalogo?.camadasApagaveis || []);
  for (const slot of catalogo?.camadas || []) {
    if (semFundo && slot === "fundo") continue;
    const item = catalogo.porId.get(config?.[slot]);
    if (!item || item.slot !== slotDasPecas(catalogo, slot)) continue;
    const espelhado = item.slot !== slot;
    const placa = item.placa && CHAVE_DO_MES[slot] ? textoDaPlaca(config[CHAVE_DO_MES[slot]]) : null;
    camadas.push({ slot, item, arquivo: arquivoDaPeca(item, config), espelhado, placa, apagavel: apagaveis.has(slot) });
    if (item.apagaBraco) apagas.push({ mascara: item.apagaBraco, espelhado });
    if (item.aura) aura = true;
  }
  return { camadas, apagas, aura };
}

// Onde fica a plaqueta de um troféu na tela (900×1200): na mão esquerda,
// espelhada (x e ângulo invertidos) — mas o TEXTO não é espelhado.
export function posicaoDaPlaca(placa, espelhado, largura = 900) {
  return espelhado ? { ...placa, x: largura - placa.x, angulo: -placa.angulo } : placa;
}

// Aura (peça de ouro do Quiz vestida): só onde o boneco aparece grande —
// corpo inteiro e bustos (pódio, cartão do nick); nunca nas bolinhas de
// cabeça nem nas miniaturas das peças (que usam `recorte`).
const AURA_MINIMA_BUSTO = 56;

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
  const corDaPele = corDaPeleDe(catalogo, config);
  const corCabelo = corDoCabelo(catalogo, config);
  const montagem = camadasDaMontagem(catalogo, config, { semFundo });
  const camadas = [];
  const placas = [];
  for (const c of montagem.camadas) {
    const { slot, item, espelhado, apagavel } = c;
    if (arteQueFalhou.has(c.arquivo)) {
      if (slot === "pele") camadas.push({ slot, silhueta: true, apagavel });
      continue;
    }
    // Máscara logo ABAIXO da peça (dentro do mesmo slot: máscara, peça).
    if (item.mascaraPele && corDaPele) camadas.push({ slot: `${slot}-pele`, mascara: item.mascaraPele, espelhado, apagavel });
    // Cabelo pintado: a versão cinza no lugar da colorida (se o cinza
    // falhar ao baixar, volta a original).
    if (slot === "cabelo" && corCabelo && !arteQueFalhou.has(item.pintavel)) camadas.push({ slot, item, cinza: item.pintavel });
    else camadas.push({ slot, item, arquivo: c.arquivo, espelhado, apagavel });
    if (c.placa) placas.push({ slot, texto: c.placa, ...posicaoDaPlaca(item.placa, espelhado, tela.largura) });
  }
  // Pele desconhecida (catálogo velho?): silhueta no lugar do corpo, logo
  // depois do fundo e das costas.
  if (config?.pele && !montagem.camadas.some((c) => c.slot === "pele")) {
    const i = camadas.filter((c) => c.slot === "fundo" || c.slot === "costas").length;
    camadas.splice(i, 0, { slot: "pele", silhueta: true, apagavel: true });
  }

  // width/height nos <img> reservam o espaço antes da arte chegar.
  const larg = Math.round(px[0]);
  const alt = Math.round(px[1]);
  // Texto da plaqueta só onde dá pra ler (some nas bolinhas pequenas).
  const escala = px[0] / tela.largura;
  const pctX = (v) => `${(v / tela.largura) * 100}%`;
  const pctY = (v) => `${(v / tela.altura) * 100}%`;
  const comAura = montagem.aura && (!busto || (busto !== "cabeca" && !recorte && tamanho >= AURA_MINIMA_BUSTO));

  const desenhar = (c) =>
    c.silhueta ? (
      <Silhueta key={c.slot} />
    ) : c.mascara ? (
      // Branco sobre transparente, usado como máscara de um bloco da
      // cor da pele: do mesmo tamanho das camadas, então encaixa.
      <span
        key={c.slot}
        className={`v2-boneco-mascara ${c.espelhado ? "espelhado" : ""}`}
        style={{
          backgroundColor: corDaPele,
          maskImage: `url("${c.mascara}")`,
          WebkitMaskImage: `url("${c.mascara}")`,
        }}
      />
    ) : c.cinza ? (
      // Cinza x cor: o bloco da cor, recortado pelo próprio cinza
      // (máscara), MULTIPLICA o cinza — o sombreado fica, a cor entra.
      // `isolation` no grupo: a multiplicação vale só entre os dois,
      // sem escurecer o corpo e o fundo que estão embaixo.
      <span key={c.slot} className="v2-boneco-pintado">
        <img
          src={c.cinza}
          alt=""
          width={larg}
          height={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => { arteQueFalhou.add(c.cinza); setFalhas((n) => n + 1); }}
        />
        <span
          className="v2-boneco-mascara v2-boneco-tinta"
          style={{ backgroundColor: corCabelo, maskImage: `url("${c.cinza}")`, WebkitMaskImage: `url("${c.cinza}")` }}
        />
      </span>
    ) : (
      <img
        key={c.slot}
        src={c.arquivo}
        className={c.espelhado ? "espelhado" : undefined}
        alt=""
        width={larg}
        height={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => { arteQueFalhou.add(c.arquivo); setFalhas((n) => n + 1); }}
      />
    );

  // Máscaras de apagar o braço: as camadas apagáveis (corpo, calça, roupa,
  // pescoço, que são seguidas na ordem de desenho) vão num grupo, embrulhado
  // numa caixa por máscara — caixas aninhadas = interseção das máscaras. A
  // da mão esquerda é a mesma máscara espelhada: a caixa dela vira
  // (scaleX(-1)) e uma caixa de dentro desvira o conteúdo.
  const apagas = montagem.apagas.filter((a) => !arteQueFalhou.has(a.mascara));
  const primeiraApagavel = camadas.findIndex((c) => c.apagavel);
  let conteudo;
  if (apagas.length && primeiraApagavel >= 0) {
    const grupo = camadas.filter((c) => c.apagavel);
    const antes = camadas.slice(0, primeiraApagavel).filter((c) => !c.apagavel);
    const depois = camadas.slice(primeiraApagavel).filter((c) => !c.apagavel);
    let embrulhado = grupo.map(desenhar);
    for (const a of apagas) {
      const estilo = { maskImage: `url("${a.mascara}")`, WebkitMaskImage: `url("${a.mascara}")` };
      embrulhado = a.espelhado ? (
        <span className="v2-boneco-apaga espelhado-mascara" style={estilo}><span className="v2-boneco-apaga-desvira">{embrulhado}</span></span>
      ) : (
        <span className="v2-boneco-apaga" style={estilo}>{embrulhado}</span>
      );
    }
    conteudo = [...antes.map(desenhar), <span key="apaga" className="v2-boneco-grupo">{embrulhado}</span>, ...depois.map(desenhar)];
  } else {
    conteudo = camadas.map(desenhar);
  }
  // A aura fica logo acima do fundo (atrás do personagem).
  if (comAura) {
    const iFundo = camadas[0]?.slot === "fundo" ? 1 : 0;
    conteudo.splice(iFundo, 0, <span key="aura" className="v2-boneco-aura" aria-hidden="true" />);
  }

  return (
    <span
      className={`v2-boneco ${busto ? "busto" : ""} ${comAura ? "com-aura" : ""} ${className}`}
      style={caixa}
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
    >
      <span className="v2-boneco-palco" style={estiloPalco}>
        {conteudo}
        {/* Mês do campeonato na plaqueta do troféu, por cima da arte (em %
            da tela, então acompanha qualquer tamanho). */}
        {placas.map((p) => (p.fonte * escala >= 4 ? (
          <span
            key={`${p.slot}-placa`}
            className="v2-boneco-placa"
            style={{ left: pctX(p.x), top: pctY(p.y), fontSize: `${p.fonte * escala}px`, transform: `translate(-50%, -50%) rotate(${p.angulo}deg)` }}
          >
            {p.texto}
          </span>
        ) : null))}
        {/* Faíscas da aura, por cima de tudo. */}
        {comAura && <span className="v2-boneco-faiscas" aria-hidden="true"><i /><i /><i /><i /><i /></span>}
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
