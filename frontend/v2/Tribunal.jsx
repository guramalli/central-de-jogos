import { versaoTexto } from "./versoes.js";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { api, novoSocket, ehSessaoMorta } from "./api.js";
import Avatar from "./Avatar.jsx";
import {
  ativarSons, somCampeao, carregarSons, somMarteloUma, somPlateia, somTambor, somCulpado, somInocente,
  somVinheta, somOrdem, somCarimbo, somSuspense, somRelogio, somVaia, pararSons,
} from "./sons.js";
import Juiz from "./tribunal/Juiz.jsx";
import * as T from "./tribunal/tempos.js";
import { Moldura, Relogio, Confete, ReacoesFlutuando, ChatMentira, ControleSom } from "./Mentira.jsx";
import { BotaoConvidar } from "./Convites.jsx";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import ChatAmigosFlutuante from "./ChatAmigosFlutuante.jsx";
import { PartidaRapida } from "./FilaNoCard.jsx";

// O TRIBUNAL — tela (EM TESTE, com selo "em testes" nos cards do Início, da
// página pública e da versão clássica).
// A conexão segue o mesmo modelo do Mentira Sincera (volta sozinha pra sala
// depois de uma queda). O motor fica em backend/src/tribunal/.

const REACOES = ["😂", "⚖️", "😱", "🔥", "👏", "🤡"];
// Limite dos campos de texto (acusação, defesa, depoimento, última palavra).
// Igual ao MAX_TEXTO de backend/src/tribunal/TribunalRoom.js (era 200).
const MAX_TEXTO = 250;
const PAPEL = {
  promotor: { nome: "Promotor", icone: "🧑‍💼", classe: "promotor",
    missao: (reu, k) => (k === 1 ? `Convença o júri de que ${reu} é CULPADO.` : `Rebata a defesa: mostre que ${reu} continua CULPADO.`),
    dica: (k) => (k === 1 ? "Acuse sem dó. Quanto mais absurdo e convincente, melhor." : "Use o que o advogado disse contra ele. Nova prova? Testemunha surpresa?") },
  advogado: { nome: "Advogado", icone: "🧑‍⚖️", classe: "advogado",
    missao: (reu, k) => (k === 1 ? `Defenda ${reu}: prove que é INOCENTE.` : `Rebata a acusação: salve ${reu} de novo.`),
    dica: (k) => (k === 1 ? "Álibi, desculpa esfarrapada, teoria da conspiração: vale tudo." : "Desmonte a última acusação. Objeção!") },
  // Réu em causa própria (rodada com 3 jogadores): escreve como advogado de si mesmo.
  causaPropria: { nome: "Réu em causa própria", icone: "🙋", classe: "acusado",
    missao: (_reu, k) => (k === 1 ? "Defenda-se! Convença o júri de que você é INOCENTE." : "Rebata a acusação: salve a própria pele de novo."),
    dica: (k) => (k === 1 ? "Você é seu próprio advogado. Álibi, desculpa esfarrapada: vale tudo." : "Desmonte a última acusação. Objeção!") },
  acusado: { nome: "Réu", icone: "🙋", classe: "acusado", missao: () => "Sua última palavra ao júri (uma frase só).", dica: () => "Seja convincente — ou pelo menos engraçado." },
  // Testemunha (zip 585): só quando sobra gente (5+ na rodada). Depõe uma
  // vez, na 1ª rodada do debate — não fala de novo nas réplicas.
  testemunha: { nome: "Testemunha", icone: "🧑", classe: "testemunha",
    missao: () => "Seu depoimento sobre o crime (uma frase). Você fala só uma vez.",
    dica: () => "Pode confirmar, negar ou complicar a vida de todo mundo — a escolha é sua." },
  jurado: { nome: "Júri", icone: "🧑‍🤝‍🧑", classe: "jurado" },
};
// Nome do argumento conforme a rodada do debate.
const NOME_ARG = {
  promotor: ["Acusação", "Réplica da acusação", "Tréplica da acusação"],
  advogado: ["Defesa", "Réplica da defesa", "Tréplica da defesa"],
  testemunha: ["Depoimento da testemunha"],
};
// Retratos dos papéis (bustos 320×320, fundo escuro). Nome versionado:
// trocar a arte = arquivo novo (-v2), e o cache do service worker nunca
// serve a velha. Réu em causa própria usa o retrato do réu.
const RETRATO = { promotor: "promotor", advogado: "advogado", causaPropria: "reu", acusado: "reu", testemunha: "testemunha", jurado: "jurado" };
// Humor do juiz 3D por fase (veredito e sala de espera têm juiz próprio).
const HUMOR_JUIZ = { escrever: "atento", julgamento: "leitura", deliberar: "atento", ultima: "ouvindo", palavraFinal: "ouvindo", votar: "votar", escolhaPapeis: "atento", fim: "lobby" };
// Fases com prazo pra quem joga: o relógio tiquetaqueia nos últimos 10s.
const FASES_RELOGIO = ["escrever", "deliberar", "ultima", "votar", "escolhaPapeis"];
// A fase acabou de começar? (o servidor manda o estado com o tempo cheio e
// depois 1 a cada segundo). Quem entra no meio não ouve a abertura de novo
// nem espera o suspense do veredito.
const faseFresca = (e) => e.tempo >= e.tempoTotal - 1;

export default function Tribunal({ usuario, salaDoLink }) {
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState("");
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [caiu, setCaiu] = useState(false);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const codigoRef = useRef(salaDoLink || null);
  useEffect(() => { ativarSons(); carregarSons("tribunal"); }, []);

  useEffect(() => {
    const s = novoSocket();
    socketRef.current = s;
    setSocket(s);
    let etapa = "";
    s.on("tribunal-estado", (e) => {
      const agora = `${e.fase}-${e.rodada}`;
      if (agora !== etapa) { etapa = agora; setErro(""); }
      codigoRef.current = e.codigo;
      setEstado(e);
    });
    s.on("connect", () => {
      setCaiu(false);
      setErro("");
      if (codigoRef.current) s.emit("tribunal-entrar", { codigo: codigoRef.current }, (r) => r?.erro && setErro(r.erro));
    });
    s.on("disconnect", () => setCaiu(true));
    // Conexão recusada (login que não vale neste servidor, servidor fora do
    // ar): sem isto, os botões não faziam nada e não aparecia aviso nenhum.
    // Mesmo aviso do Impostor.
    s.on("connect_error", (err) => {
      setErro(ehSessaoMorta(err)
        ? "Seu login não vale mais neste servidor. Saia da conta (botão no topo) e entre de novo."
        : "Não foi possível conectar ao servidor do jogo. Tentando de novo…");
    });
    s.connect();
    return () => { s.emit("tribunal-sair"); s.disconnect(); };
  }, [salaDoLink]);

  // Sons, cenas e gestos do juiz, um por momento (a chave inclui a rodada do
  // debate, pra tocar de novo a cada réplica). Um som por vez — nada empilha:
  //   1º caso da sessão → vinheta (o juiz bate o martelo no "toc" final, 3,45s)
  //                        + carimbo do caso em 0,7s
  //   casos seguintes    → "Ordem no tribunal!" com a cena de tela cheia (o juiz
  //                        e o martelo da cena batem nos tocs, 1,70s e 1,97s)
  //                        + carimbo do caso quando a cena some (2,6s)
  //   júri delibera → burburinho · júri pronto (última palavra) → o juiz bate
  //   1 vez (som no toc) · última palavra na tela → tambor
  //   veredito → suspense enquanto os votos sobem (3,2s); na revelação o
  //   suspense some, entra culpado/inocente e, se culpado, a vaia depois (1,8s)
  //   campeão → fanfarra do site · últimos 10s com prazo → relógio (outro efeito)
  const somRef = useRef("");
  const [cena, setCena] = useState(null); // { variante, cor } — martelo de tela cheia, some sozinho
  const [gestoJuiz, setGestoJuiz] = useState(""); // "tipo:performance.now()" (ver tribunal/Juiz3D.jsx)
  const [revelouCaso, setRevelouCaso] = useState(0); // rodada cujo veredito já foi revelado na tela
  useEffect(() => {
    if (!estado) { somRef.current = ""; return undefined; }
    const chave = `${estado.fase}-${estado.rodada}-${estado.rodadaDebate}`;
    if (somRef.current === chave) return undefined;
    somRef.current = chave;
    const timers = [];
    const depois = (seg, fn) => timers.push(setTimeout(fn, seg * 1000));
    const gesto = (tipo) => setGestoJuiz(`${tipo}:${performance.now()}`);
    const fresca = faseFresca(estado);
    let suspense = null;
    if (estado.fase !== "veredito") setRevelouCaso(0); // o próximo veredito começa escondido
    if (estado.fase === "escrever" && estado.rodadaDebate === 1) {
      if (fresca && estado.rodada === 1) {
        somVinheta(); gesto("vinheta");
        depois(T.CARIMBO_VINHETA, somCarimbo);
      } else if (fresca) {
        somOrdem(); gesto("ordem");
        setCena({ variante: "ordem" }); depois(T.CENA_ORDEM, () => setCena(null));
        depois(T.CARIMBO_ORDEM, somCarimbo);
      }
    }
    else if (estado.fase === "deliberar") somPlateia();
    else if (estado.fase === "ultima" || (estado.fase === "votar" && estado.causaPropria)) { gesto("batida"); depois(T.ATRASO_MARTELO_UMA, somMarteloUma); }
    else if (estado.fase === "palavraFinal") somTambor();
    else if (estado.fase === "veredito") {
      const culpado = estado.resultado?.veredito === "culpado";
      const rodada = estado.rodada;
      const revelar = () => {
        suspense?.parar(250);
        setRevelouCaso(rodada);
        (culpado ? somCulpado : somInocente)();
        setCena({ variante: "veredito", cor: culpado ? "#d8392c" : "#0b9a72" }); depois(1.3, () => setCena(null));
        if (culpado) depois(T.ATRASO_VAIA, somVaia);
      };
      if (fresca && (estado.resultado?.culpado || 0) + (estado.resultado?.inocente || 0) > 0) {
        suspense = somSuspense(T.SUSPENSE_INICIO);
        // o juiz arma o golpe antes, pra o martelo bater junto da revelação
        if (culpado) depois(T.REVELAR - T.IMPACTO, () => gesto("condena"));
        else depois(T.REVELAR, () => gesto("absolve"));
        depois(T.REVELAR, revelar);
      } else {
        gesto(culpado ? "condena" : "absolve");
        revelar();
      }
    }
    else if (estado.fase === "fim" && estado.jogadores[0]?.id === usuario.id && estado.jogadores[0].pontos > 0) somCampeao();
    return () => { timers.forEach(clearTimeout); suspense?.parar(150); };
  }, [estado?.fase, estado?.rodada, estado?.rodadaDebate]);

  // Relógio tiquetaqueando nos últimos 10s das fases com prazo. Para quando a
  // fase acaba (inclusive antes da hora, quando todo mundo entrega/vota).
  const chaveFase = estado ? `${estado.fase}-${estado.rodada}-${estado.rodadaDebate}` : "";
  const apertado = !!estado && FASES_RELOGIO.includes(estado.fase) && estado.tempo > 0 && estado.tempo <= T.RELOGIO_ULTIMOS;
  useEffect(() => {
    if (!apertado) return undefined;
    const som = somRelogio();
    return () => som.parar(150);
  }, [apertado, chaveFase]);

  // Saiu da página do jogo: nenhum som do tribunal continua tocando.
  useEffect(() => () => pararSons("tribunal"), []);

  const pedir = (evento, dados = {}) => new Promise((ok) => socketRef.current?.emit(evento, dados, (r) => { if (r?.erro) setErro(r.erro); ok(r); }));
  async function entrarEm(codigo) {
    const r = await pedir("tribunal-entrar", { codigo });
    if (r?.codigo) { codigoRef.current = r.codigo; window.history.replaceState(null, "", `/v2/?pagina=tribunal&mesa=${r.codigo}`); }
  }
  async function criar() {
    const r = await pedir("tribunal-criar");
    if (r?.codigo) { codigoRef.current = r.codigo; window.history.replaceState(null, "", `/v2/?pagina=tribunal&mesa=${r.codigo}`); }
  }
  function sairDaSala() {
    socketRef.current?.emit("tribunal-sair");
    codigoRef.current = null;
    pararSons("tribunal");
    setEstado(null);
    window.history.replaceState(null, "", "/v2/?pagina=tribunal");
  }

  // ---------- lobby ----------
  if (!estado) {
    return (
      <Moldura usuario={usuario} classe="v2-mentira v2-tribunal">
        {/* Tela inicial: um jeito claro de desistir e voltar pro lobby. */}
        <a
          className="v2-voltar-lobby"
          href={linkDaPagina("inicio")}
          onClick={(e) => { e.preventDefault(); irParaPagina("inicio"); }}
        >
          ← Voltar ao lobby
        </a>
        <section className="v2-cartao v2-tribunal-entrada">
          <img src="/tribunal-logo.png" alt="" className="v2-tribunal-logo" />
          <Juiz className="v2-juiz-lobby" humor="lobby" />
          <h1 className="v2-oculto">O Tribunal</h1>
          <span className="v2-versao-jogo v2-versao-jogo-lobby" title="Quantas entregas já mexeram neste jogo">{versaoTexto("tribunal")}</span>
          <p className="v2-cartao-nota">Um jogador é acusado de um crime absurdo. O promotor tenta condenar, o advogado tenta salvar, o réu tem a última palavra — e o júri decide: <b>culpado</b> ou <b>inocente</b>?</p>
          <span className="v2-mentira-teste">em testes</span>
          {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}
          {salaDoLink && !erro && <div className="v2-carregando">Entrando na sala…</div>}
        </section>
        <PartidaRapida jogo="tribunal" />
        <SalasAbertas aoEntrar={entrarEm} />
        <section className="v2-cartao v2-mentira-amigos">
          <div>
            <span className="v2-mentira-modo-tag amigos">entre amigos</span>
            <h2>🫵 Sala com amigos</h2>
            <p className="v2-cartao-nota">Crie uma sala e mande o convite. Precisa de pelo menos 3 pessoas (ou complete com bots). Com 3, o réu se defende sozinho; com 4 ou mais, tem advogado.</p>
          </div>
          <button className="v2-botao v2-botao-amarelo" onClick={criar}>Criar sala com amigos</button>
          <form className="v2-mentira-codigo" onSubmit={(e) => { e.preventDefault(); if (codigoDigitado.trim()) entrarEm(codigoDigitado.trim()); }}>
            <label htmlFor="v2-tribunal-cod" className="v2-oculto">Código da sala</label>
            <input id="v2-tribunal-cod" inputMode="numeric" maxLength={6} placeholder="Tem um código? Digite aqui" value={codigoDigitado} onChange={(e) => setCodigoDigitado(e.target.value.replace(/\D/g, ""))} />
            <button className="v2-botao v2-botao-contorno" type="submit">Entrar</button>
          </form>
        </section>
      </Moldura>
    );
  }

  const { fase } = estado;
  // Veredito: até a revelação (3,2s) só aparece a apuração dos votos.
  const revelado = fase !== "veredito" || revelouCaso === estado.rodada;
  // Juiz no cabeçalho em todas as fases menos a espera e o veredito (essas
  // têm um juiz grande dentro do cartão). Sempre no mesmo lugar da árvore:
  // o canvas não remonta a cada estado que chega.
  const juizNoTopo = fase !== "aguardando" && fase !== "veredito";
  return (
    <Moldura usuario={usuario} classe="v2-mentira v2-tribunal">
      <ReacoesFlutuando reacoes={estado.reacoes || []} />
      {cena && <CenaMartelo key={`${cena.variante}-${somRef.current}`} variante={cena.variante} cor={cena.cor} />}
      {(fase === "ultima" || fase === "palavraFinal") && <div className="v2-tribunal-holofote" aria-hidden="true" />}
      <section className="v2-mentira-topo">
        <div className="v2-tribunal-topo-esq">
          {juizNoTopo && <Juiz className={`v2-juiz-topo fase-${fase}`} humor={HUMOR_JUIZ[fase] || "lobby"} gesto={gestoJuiz} />}
          <div>
          <h1>⚖️ O Tribunal</h1>
          {estado.rodada > 0 && fase !== "fim" && (
            <span className="v2-mentira-rodada">Caso {estado.rodada} de {estado.totalRodadas}
              {estado.rodadaDebate > 0 && fase !== "veredito" && fase !== "escolhaPapeis" && <em className="v2-tribunal-debate-selo">debate {estado.rodadaDebate}/{estado.maxDebate}</em>}
              {estado.ultima && <em className="v2-tribunal-dobro">ÚLTIMO ×2</em>}</span>
          )}
          </div>
        </div>
        <div className="v2-mentira-topo-dir">
          <span className="v2-mentira-cod-selo">{estado.publica ? estado.nomeSala : `sala ${estado.codigo}`}</span>
          <BotaoConvidar socket={socket} roomId={estado.codigo} nomeSala={estado.publica ? estado.nomeSala : `sala ${estado.codigo}`} jogo="tribunal" />
          <ChatAmigosFlutuante usuario={usuario} />
          {estado.modoPapeis === "fixo" && fase !== "aguardando" && fase !== "fim" && <span className="v2-mentira-cod-selo v2-tribunal-modo-selo" title="O grupo decide, depois de cada veredito, se sorteia os papéis de novo">📌 fixo</span>}
          <ControleSom aoTestar={somMarteloUma} />
          <button className="v2-botao-pequeno" onClick={sairDaSala}>Sair</button>
        </div>
      </section>
      {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}
      {caiu && <div className="v2-faixa-aviso" role="status">📶 Conexão caiu — reconectando… (seus pontos estão guardados)</div>}

      <div className="v2-mentira-corpo">
        <div className="v2-mentira-palco">
          {(fase === "aguardando") && <Espera estado={estado} aoComecar={() => pedir("tribunal-comecar")} aoBot={(acao) => pedir("tribunal-bot", { acao })} aoModo={(modo) => pedir("tribunal-modo-papeis", { modo })} />}
          {fase === "escrever" && <Escrever key={`${estado.rodada}-${estado.rodadaDebate}`} estado={estado} aoEnviar={(texto) => pedir("tribunal-escrever", { texto })} />}
          {fase === "julgamento" && <Julgamento estado={estado} />}
          {fase === "deliberar" && <Deliberar estado={estado} aoDecidir={(escolha) => pedir("tribunal-deliberar", { escolha })} />}
          {fase === "ultima" && <UltimaPalavra key={`u-${estado.rodada}`} estado={estado} aoEnviar={(texto) => pedir("tribunal-escrever", { texto })} />}
          {fase === "palavraFinal" && <PalavraFinal estado={estado} />}
          {fase === "votar" && <Votacao estado={estado} aoVotar={(voto) => pedir("tribunal-votar", { voto })} aoCurtir={(chave) => pedir("tribunal-curtir", { chave })} />}
          {fase === "escolhaPapeis" && <EscolhaPapeis estado={estado} aoEscolher={(escolha) => pedir("tribunal-escolher-papeis", { escolha })} />}
          {fase === "veredito" && <Veredito key={`v-${estado.rodada}`} estado={estado} meuId={usuario.id} revelado={revelado} gesto={gestoJuiz} />}
          {fase === "fim" && <Fim estado={estado} meuId={usuario.id} aoJogarDeNovo={() => pedir("tribunal-comecar")} aoBot={(acao) => pedir("tribunal-bot", { acao })} />}
        </div>
        <div className="v2-mentira-lateral">
          <Placar estado={estado} meuId={usuario.id} revelado={revelado} />
          <ChatMentira estado={estado} usuario={usuario} pedir={pedir} prefixo="tribunal" reacoes={REACOES} />
        </div>
      </div>
    </Moldura>
  );
}

// ---------- CENAS (imersão): martelo, holofote, júri, grades, pombas ----------
// Tudo desenhado em SVG/CSS, sem imagem. As cenas de tela cheia (martelo)
// somem sozinhas; as outras vivem dentro do cartão da fase.
function MarteloSVG({ className = "" }) {
  return (
    <svg className={`v2-tribunal-martelo-svg ${className}`} viewBox="0 0 200 160" aria-hidden="true">
      <g className="v2-tribunal-martelo-mov">
        <rect x="88" y="62" width="14" height="84" rx="7" fill="#8b4a1c" stroke="#1a0c04" strokeWidth="5" transform="rotate(-38 95 66)" />
        <rect x="52" y="30" width="86" height="42" rx="14" fill="#c8732a" stroke="#1a0c04" strokeWidth="5" transform="rotate(-38 95 51)" />
        <rect x="60" y="36" width="70" height="12" rx="6" fill="#ffd27a" opacity=".7" transform="rotate(-38 95 42)" />
      </g>
      <rect x="20" y="132" width="120" height="18" rx="8" fill="#7a3d14" stroke="#1a0c04" strokeWidth="5" />
      <rect x="34" y="120" width="92" height="16" rx="7" fill="#a55a24" stroke="#1a0c04" strokeWidth="5" />
    </svg>
  );
}

// Cena de tela cheia: `variante` "ordem" (2 batidas nos tocs do "Ordem no
// tribunal!", 1,70s e 1,97s) ou "veredito" (1 batida forte).
function CenaMartelo({ variante, cor }) {
  return (
    <div className={`v2-tribunal-cena v2-tribunal-cena-${variante}`} aria-hidden="true" style={cor ? { "--cena-cor": cor } : undefined}>
      <div className="v2-tribunal-cena-fundo" />
      <div className="v2-tribunal-cena-martelo">
        <MarteloSVG className={variante} />
        <span className="v2-tribunal-onda o1" /><span className="v2-tribunal-onda o2" /><span className="v2-tribunal-onda o3" />
      </div>
      {variante === "ordem" && <div className="v2-tribunal-cena-texto">ORDEM NO TRIBUNAL!</div>}
    </div>
  );
}

// Retrato de um papel (arte chibi). Pequeno e preguiçoso: não atrasa a tela.
function Retrato({ papel, tamanho = 40, className = "" }) {
  const arq = RETRATO[papel];
  if (!arq) return null;
  return <img className={`v2-tribunal-retrato ${className}`} src={`/tribunal/papel-${arq}-v1.webp`} width={tamanho} height={tamanho} alt="" loading="lazy" decoding="async" draggable="false" />;
}

function JuriCochichando({ nomes }) {
  return (
    <div className="v2-tribunal-juri" aria-hidden="true">
      {nomes.map((n, i) => (
        <div key={n} className="v2-tribunal-jurado" style={{ animationDelay: `${i * 0.35}s` }}>
          <span className="v2-tribunal-jurado-balao">…</span>
          <Retrato papel="jurado" tamanho={44} className="v2-tribunal-jurado-cara" />
          <small>{n}</small>
        </div>
      ))}
    </div>
  );
}

function Pombas() {
  return (
    <div className="v2-tribunal-pombas" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ left: `${12 + i * 18}%`, animationDelay: `${i * 0.25}s` }}>🕊️</span>)}
    </div>
  );
}

// ---------- lobby: salas abertas ----------
function SalasAbertas({ aoEntrar }) {
  const [salas, setSalas] = useState(null);
  useEffect(() => {
    let vivo = true;
    const buscar = () => api.get("/tribunal-rooms").then(({ data }) => vivo && setSalas(data || [])).catch(() => vivo && setSalas((s) => s || []));
    buscar();
    const t = setInterval(() => { if (!document.hidden) buscar(); }, 10000);
    return () => { vivo = false; clearInterval(t); };
  }, []);
  return (
    <section className="v2-mentira-abertas" aria-label="Salas abertas">
      <div className="v2-bloco-titulo">Salas abertas</div>
      {salas === null && <div className="v2-carregando">Carregando…</div>}
      {(salas || []).map((s) => (
        <button key={s.codigo} className="v2-mentira-sala-aberta" onClick={() => aoEntrar(s.codigo)}>
          <span className="v2-mentira-sala-icone">{s.permiteBots ? "🤖" : "🎙️"}</span>
          <span className="v2-mentira-sala-texto"><b>{s.nome}</b><small>{s.descricao}</small></span>
          <span className="v2-mentira-sala-info"><b>{s.jogando}</b> jogando{s.emPartida && <em>em sessão</em>}</span>
          <span className="v2-mentira-sala-entrar">Entrar</span>
        </button>
      ))}
    </section>
  );
}

// ---------- espera ----------
function Espera({ estado, aoComecar, aoBot, aoModo }) {
  const [copiado, setCopiado] = useState(false);
  const link = `${window.location.origin}/v2/?pagina=tribunal&mesa=${estado.codigo}`;
  const n = estado.jogadores.filter((j) => j.online).length;
  const faltam = Math.max(0, estado.minJogadores - n);
  return (
    <section className="v2-cartao v2-mentira-fase v2-mentira-espera">
      <div className="v2-tribunal-espera-topo">
        <Juiz className="v2-juiz-espera" humor="lobby" />
        <div className="v2-tribunal-espera-info">
          <h2>Sala de espera</h2>
          {estado.publica ? (
            <p className="v2-cartao-nota">Sala aberta: qualquer pessoa entra pela lista de salas do jogo.</p>
          ) : (
            <div className="v2-mentira-convite">
              <span>Código da sala</span>
              <b>{estado.codigo}</b>
              <button className="v2-botao v2-botao-contorno" onClick={() => { navigator.clipboard?.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}>{copiado ? "Link copiado! ✓" : "Copiar link de convite"}</button>
            </div>
          )}
        </div>
      </div>
      <div className="v2-tribunal-regras">
        <p><b>Como funciona:</b> promotor e advogado escrevem ao mesmo tempo, o réu tem a última palavra e o júri vota. <b>Com 3 jogadores</b>, o réu é o próprio advogado. <b>Com 5+</b>, sobra gente pra uma testemunha depor.</p>
        <p>Vitória no duelo <b>+500</b> · réu absolvido <b>+200</b> · jurado com a maioria <b>+100</b> · curtida <b>+100</b> · última caso vale o <b>dobro</b>. Empate? <i>In dubio pro reo</i>: absolvido.</p>
      </div>
      {estado.souDono && (
        <div className="v2-tribunal-modo" role="group" aria-label="Como os papéis mudam entre os casos">
          <span>Papéis:</span>
          <button className={estado.modoPapeis === "rotativo" ? "ativo" : ""} onClick={() => aoModo("rotativo")}>🔄 Rotativo — cada um é réu uma vez</button>
          <button className={estado.modoPapeis === "fixo" ? "ativo" : ""} onClick={() => aoModo("fixo")}>📌 Fixo — o grupo decide se sorteia de novo</button>
        </div>
      )}
      {!estado.souDono && (
        <p className="v2-cartao-nota">Modo de papéis: <b>{estado.modoPapeis === "fixo" ? "fixo (o grupo decide se sorteia de novo)" : "rotativo (cada um é réu uma vez)"}</b></p>
      )}
      <div className="v2-mentira-quem">
        {estado.jogadores.filter((j) => j.online).map((j) => <span key={j.id} className="pronto">{j.nickname}{j.id === estado.donoId ? " 👑" : ""}{j.bot ? " 🤖" : ""}</span>)}
      </div>
      {estado.souDono && estado.permiteBots && (
        <div className="v2-mentira-bots">
          <button className="v2-botao v2-botao-contorno" onClick={() => aoBot("adicionar")}>+ bot de teste</button>
          {estado.jogadores.some((j) => j.bot) && <button className="v2-link" onClick={() => aoBot("remover")}>remover bots</button>}
        </div>
      )}
      {estado.souDono ? (
        <button className="v2-botao v2-botao-amarelo v2-botao-largo" onClick={aoComecar} disabled={faltam > 0}>
          {faltam > 0 ? `Faltam ${faltam} ${faltam === 1 ? "jogador" : "jogadores"} (mínimo ${estado.minJogadores})` : `Abrir a sessão com ${n} jogadores`}
        </button>
      ) : <p className="v2-cartao-nota">Quem criou a sala abre a sessão.</p>}
    </section>
  );
}

// ---------- o caso (cabeçalho de toda rodada) ----------
// Carimbo do caso: o quadro do crime cai de cima como um carimbo de
// borracha (grande e torto → bate, treme) e o selo "CASO Nº" estala no
// canto — junto do som do carimbo (tocado em `atraso`; a pancada do
// arquivo fica em 0,1s, e é aí que o quadro e o selo batem). Com "reduzir
// movimento", só aparece (fade).
const CARIMBO_TEMPOS = [0, 0.5, 0.63, 0.76, 0.88, 1];
function animCarimbo(atraso, reduzir) {
  if (atraso === null) return {};
  if (reduzir) return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: atraso, duration: 0.35 } };
  return {
    initial: { opacity: 0, scale: 1.3, rotate: -3, x: 0 },
    animate: { opacity: [0, 1, 1, 1, 1, 1], scale: [1.3, 0.98, 1, 1, 1, 1], rotate: [-3, 0, 0, 0, 0, 0], x: [0, 0, -6, 5, -3, 0] },
    transition: { delay: atraso - 0.2, duration: 0.6, times: CARIMBO_TEMPOS, ease: ["easeIn", "easeOut", "easeInOut", "easeInOut", "easeOut"] },
  };
}
function animSelo(atraso, reduzir) {
  if (atraso === null) return {};
  if (reduzir) return { initial: { opacity: 0 }, animate: { opacity: 0.9 }, transition: { delay: atraso, duration: 0.35 } };
  return {
    initial: { opacity: 0, scale: 3, rotate: -24 },
    animate: { opacity: 0.9, scale: 1, rotate: -12 },
    transition: { delay: atraso - 0.04, duration: 0.14, ease: "easeIn" },
  };
}

// carimbo: atraso (s) da batida do carimbo, ou null (sem animação).
function Caso({ estado, relogio = true, carimbo = null }) {
  const reduzir = useReducedMotion();
  const pac = estado.pacote;
  // O álibi é dica de quem escreve a defesa (advogado — ou o réu, em causa
  // própria). Fica PRIVADO até essa pessoa entregar a defesa da 1ª rodada;
  // depois disso, todo mundo vê — inclusive nas rodadas seguintes do mesmo caso.
  const souDefensor = estado.meuPapel === "advogado";
  const defesaRodada1Pronta = estado.fase !== "escrever" || estado.rodadaDebate > 1 || (estado.jaEscreveram || []).includes("advogado");
  const mostraAlibi = pac?.alibi && (defesaRodada1Pronta || souDefensor);
  return (
    <>
      {relogio && <Relogio tempo={estado.tempo} total={estado.tempoTotal} />}
      <motion.div className="v2-tribunal-caso" {...animCarimbo(carimbo, reduzir)}>
        <motion.span className="v2-tribunal-selo" aria-hidden="true" {...animSelo(carimbo, reduzir)}>CASO Nº {estado.rodada}</motion.span>
        <span className="v2-tribunal-caso-rotulo">⚖️ Réu</span>
        <b className="v2-tribunal-reu">{estado.papeis.acusado}</b>
        <span className="v2-tribunal-caso-rotulo">Crime</span>
        <p className="v2-tribunal-crime">{estado.acusacao}</p>
        {pac?.testemunha && (
          <>
            <span className="v2-tribunal-caso-rotulo">📋 Relato no processo</span>
            <p className="v2-tribunal-dossie">“{pac.testemunha}”</p>
          </>
        )}
        {pac?.prova && (
          <>
            <span className="v2-tribunal-caso-rotulo">🔎 Prova</span>
            <p className="v2-tribunal-dossie">{pac.prova}</p>
          </>
        )}
        {mostraAlibi && (
          <>
            <span className="v2-tribunal-caso-rotulo">🙋 Álibi do acusado{!defesaRodada1Pronta ? " (só pra você, defensor)" : ""}</span>
            <p className={`v2-tribunal-dossie v2-tribunal-alibi ${!defesaRodada1Pronta ? "privado" : ""}`}>“{pac.alibi}”</p>
          </>
        )}
      </motion.div>
      <div className="v2-tribunal-elenco">
        <span className="promotor"><Retrato papel="promotor" tamanho={22} /> Promotor: <b>{estado.papeis.promotor}</b></span>
        <span className="advogado">{estado.causaPropria ? <><Retrato papel="causaPropria" tamanho={22} /> Defesa: <b>{estado.papeis.advogado}</b> (em causa própria)</> : <><Retrato papel="advogado" tamanho={22} /> Advogado: <b>{estado.papeis.advogado}</b></>}</span>
        {estado.papeis.testemunha && <span className="testemunha"><Retrato papel="testemunha" tamanho={22} /> Testemunha: <b>{estado.papeis.testemunha}</b></span>}
      </div>
    </>
  );
}

// ---------- um argumento (cartão de fala, com o retrato de quem fala) ----------
// Entrando (leitura): acusação vem da esquerda, defesa da direita, o resto
// sobe; com "reduzir movimento", só aparece. `retrato`: papel da arte
// (réu em causa própria escreve como advogado, mas o retrato é o do réu).
function animFala(papel, reduzir) {
  if (reduzir) return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } };
  const de = papel === "promotor" ? { x: -48 } : papel === "advogado" ? { x: 48 } : { y: 26 };
  return {
    initial: { opacity: 0, scale: 0.94, ...de },
    animate: { opacity: 1, scale: 1, x: 0, y: 0 },
    transition: { type: "spring", stiffness: 380, damping: 26, opacity: { duration: 0.2 } },
  };
}
function Argumento({ papel, texto, titulo, autor, entrada = true, acoes = null, prova = null, retrato = papel }) {
  const reduzir = useReducedMotion();
  if (!texto) return null;
  return (
    <motion.div className={`v2-tribunal-argumento ${papel} ${texto.padrao ? "padrao" : ""}`} {...(entrada ? animFala(papel, reduzir) : {})}>
      {entrada && prova && !texto.padrao && <span className="v2-tribunal-prova">{prova}</span>}
      <Retrato papel={retrato} tamanho={48} className="v2-tribunal-argumento-retrato" />
      <span className="v2-tribunal-argumento-quem">{titulo} · <b>{autor}</b></span>
      <p>{texto.padrao ? <i>{texto.texto}</i> : `“${texto.texto}”`}</p>
      {acoes}
    </motion.div>
  );
}

// Histórico do debate. `ate`: quantas rodadas mostrar; `ultimaEntra`: anima a rodada nova.
function Debate({ estado, ate = estado.debate.length, ultimaEntra = false, curtir = null, visiveis = null }) {
  return (
    <div className="v2-tribunal-debate">
      {estado.debate.slice(0, ate).map((d, i) => {
        const nova = ultimaEntra && i === ate - 1;
        // testemunha só na rodada 0 (ela depõe uma vez); vem primeiro,
        // antes de acusação e defesa — quem argumenta pode usar o depoimento.
        const itens = i === 0 && estado.papeis.testemunha ? ["testemunha", "promotor", "advogado"] : ["promotor", "advogado"];
        return (
          <div key={d.rodada} className="v2-tribunal-rodada">
            {estado.debate.length > 1 && <span className="v2-tribunal-rodada-titulo">Rodada {d.rodada} do debate</span>}
            {itens.map((p, k) => {
              if (nova && visiveis !== null && k >= visiveis) return null;
              if (p === "testemunha") {
                return <Argumento key={p} papel="testemunha" texto={d.testemunha} titulo={NOME_ARG.testemunha[0]} autor={estado.papeis.testemunha} entrada={nova}
                  acoes={curtir ? curtir(`testemunha-${d.rodada}`, d.testemunha) : null} />;
              }
              const provaIdx = p === "promotor" ? 0 : 1;
              return <Argumento key={p} papel={p} retrato={p === "advogado" && estado.causaPropria ? "causaPropria" : p} texto={d[p]} titulo={(NOME_ARG[p][i] || NOME_ARG[p][2]) + (p === "advogado" && estado.causaPropria ? " (em causa própria)" : "")} autor={estado.papeis[p]} entrada={nova}
                prova={`PROVA ${i * 2 + provaIdx + 1}`} acoes={curtir ? curtir(`${p}-${d.rodada}`, d[p]) : null} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

// ---------- faixa "seu papel" (com o retrato do papel) ----------
// revela: segundos até o retrato "virar" (caso começando) ou null.
function BannerPapel({ classe, retrato, revela = null, children }) {
  const reduzir = useReducedMotion();
  const anim = revela === null ? {}
    : reduzir ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: revela, duration: 0.3 } }
      : { initial: { opacity: 0, scale: 0.4, rotate: -20 }, animate: { opacity: 1, scale: 1, rotate: 0 }, transition: { delay: revela, type: "spring", stiffness: 420, damping: 16 } };
  return (
    <div className={`v2-tribunal-papel ${classe}`}>
      <motion.span className="v2-tribunal-papel-retrato" {...anim}><Retrato papel={retrato} tamanho={60} /></motion.span>
      <div className="v2-tribunal-papel-texto">{children}</div>
    </div>
  );
}

// ---------- debate: escrita ----------
function Escrever({ estado, aoEnviar }) {
  const papel = estado.meuPapel;
  const k = estado.rodadaDebate;
  const escrevo = papel === "promotor" || papel === "advogado" || (papel === "testemunha" && k === 1);
  const anteriores = estado.debate.slice(0, -1);
  const meu = escrevo ? estado.debate[k - 1]?.[papel] : null;
  const entregues = estado.jaEscreveram || [];
  // Caso novo começando agora: o quadro do crime entra carimbado (mesmo
  // atraso do som, ver o efeito de sons) e o retrato do seu papel se revela
  // logo depois. Decidido na montagem (o componente remonta a cada rodada).
  const [carimbo] = useState(() => (k === 1 && faseFresca(estado) ? (estado.rodada === 1 ? T.CARIMBO_VINHETA : T.CARIMBO_ORDEM) : null));
  const revela = carimbo === null ? null : carimbo + 0.35;
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Caso estado={estado} carimbo={carimbo} />
      {anteriores.length > 0 && (
        <>
          <p className="v2-tribunal-anuncio">🔍 O júri quer mais provas! Rodada {k} do debate.</p>
          <Debate estado={estado} ate={anteriores.length} />
        </>
      )}
      {escrevo ? (
        <>
          {(() => { const chave = papel === "advogado" && estado.causaPropria ? "causaPropria" : papel; const info = PAPEL[chave]; return (
          <BannerPapel classe={info.classe} retrato={chave} revela={revela}>
            <b>Seu papel: {info.nome.toUpperCase()}{k > 1 ? ` · ${NOME_ARG[papel][k - 1] || NOME_ARG[papel][2]}` : ""}</b>
            <p>{info.missao(estado.papeis.acusado, k)}</p>
            <small>{info.dica(k)}</small>
          </BannerPapel>); })()}
          {meu ? <div className="v2-mentira-enviada">Entregue ao tribunal: <b>“{meu.texto}”</b> ✅</div>
            : <CampoArgumento papel={papel} k={k} aoEnviar={aoEnviar} />}
        </>
      ) : papel === "acusado" ? (
        <BannerPapel classe="acusado" retrato="acusado" revela={revela}>
          <b>Seu papel: RÉU</b>
          <p>Acompanhe o debate. Quando o júri estiver pronto, você terá a última palavra.</p>
        </BannerPapel>
      ) : papel === "testemunha" ? (
        <BannerPapel classe="testemunha" retrato="testemunha" revela={revela}>
          <b>Seu papel: TESTEMUNHA</b>
          <p>Você já deu seu depoimento nesta rodada — agora é a vez da réplica entre promotor e advogado.</p>
        </BannerPapel>
      ) : (
        <BannerPapel classe="jurado" retrato="jurado" revela={revela}>
          <b>Seu papel nesta rodada: JÚRI</b>
          <p>Enquanto os outros escrevem, provoque no chat. Depois você decide se quer mais provas ou se já dá pra votar.</p>
        </BannerPapel>
      )}
      <p className="v2-cartao-nota v2-tribunal-aviso-tempo">Sem pressa: quando {k === 1 && estado.papeis.testemunha ? "todos" : "os dois"} entregarem, a leitura começa na hora.</p>
      <div className="v2-tribunal-status" aria-label="Quem já entregou">
        {["promotor", "advogado"].map((p) => <span key={p} className={entregues.includes(p) ? "ok" : "escrevendo"}>{entregues.includes(p) ? "✓" : <i className="v2-tribunal-caneta">✍️</i>} {PAPEL[p].nome}</span>)}
        {k === 1 && estado.papeis.testemunha && <span className={entregues.includes("testemunha") ? "ok" : "escrevendo"}>{entregues.includes("testemunha") ? "✓" : <i className="v2-tribunal-caneta">✍️</i>} Testemunha</span>}
      </div>
    </section>
  );
}

function CampoArgumento({ papel, k = 1, aoEnviar }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const campoRef = useRef(null);
  useEffect(() => { campoRef.current?.focus(); }, []);
  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    await aoEnviar(texto);
    setEnviando(false);
  }
  const dica = papel === "acusado" ? "Excelência, eu…"
    : papel === "testemunha" ? "Eu vi quando…"
    : papel === "promotor" ? (k === 1 ? "Senhoras e senhores do júri…" : "Objeção! O advogado disse que…")
    : (k === 1 ? "Meritíssimo, meu cliente…" : "Objeção! A acusação esqueceu que…");
  return (
    <form className="v2-tribunal-form" onSubmit={enviar}>
      <label htmlFor="v2-tribunal-texto" className="v2-oculto">Seu argumento</label>
      <textarea id="v2-tribunal-texto" ref={campoRef} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={MAX_TEXTO} rows={3} placeholder={dica}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) enviar(e); }} />
      <div className="v2-tribunal-form-rodape">
        <small>{texto.length}/{MAX_TEXTO}</small>
        <button className="v2-botao v2-botao-amarelo" type="submit" disabled={!texto.trim() || enviando}>{enviando ? "Entregando…" : "Entregar"}</button>
      </div>
    </form>
  );
}

// ---------- debate: leitura (os dois argumentos novos entram, 8s cada) ----------
function Julgamento({ estado }) {
  const rodadaAtual = estado.rodadaDebate - 1;
  const itens = rodadaAtual === 0 && estado.papeis.testemunha ? 3 : 2;
  const total = estado.tempoTotal || itens * 8;
  const porTexto = total / itens;
  const visiveis = Math.min(itens, Math.floor((total - estado.tempo) / porTexto) + 1);
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Caso estado={estado} />
      <p className="v2-tribunal-anuncio">🔨 Ordem no tribunal! {estado.rodadaDebate > 1 ? `Rodada ${estado.rodadaDebate} do debate.` : "Ouçam as partes."}</p>
      <Debate estado={estado} ultimaEntra visiveis={visiveis} />
    </section>
  );
}

// ---------- o júri delibera: mais provas ou prontos? ----------
function Deliberar({ estado, aoDecidir }) {
  const souJurado = estado.meuPapel === "jurado";
  const restam = estado.maxDebate - estado.rodadaDebate;
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Caso estado={estado} />
      {souJurado ? (
        <>
          <p className="v2-tribunal-anuncio">O júri já ouviu o bastante?</p>
          <div className="v2-tribunal-votos v2-tribunal-deliberar" role="group" aria-label="Decisão do júri">
            <button className={`mais ${estado.minhaDeliberacao === "mais" ? "ativo" : ""}`} onClick={() => aoDecidir("mais")} aria-pressed={estado.minhaDeliberacao === "mais"}>🔍 Mais provas</button>
            <button className={`prontos ${estado.minhaDeliberacao === "prontos" ? "ativo" : ""}`} onClick={() => aoDecidir("prontos")} aria-pressed={estado.minhaDeliberacao === "prontos"}>✅ Prontos pra votar</button>
          </div>
          <small className="v2-cartao-nota">Se a maioria pedir mais provas, {estado.causaPropria ? "promotor e réu" : "promotor e advogado"} escrevem de novo ({restam === 1 ? "última rodada possível" : `até mais ${restam} rodadas`}). Empate: prontos.</small>
        </>
      ) : (
        <p className="v2-tribunal-anuncio">🧑‍🤝‍🧑 O júri está deliberando… ({estado.jaDeliberaram} de {estado.totalJurados})</p>
      )}
      <JuriCochichando nomes={estado.jogadores.filter((j) => j.papel === "jurado").map((j) => j.nickname)} />
      <Debate estado={estado} />
    </section>
  );
}

// ---------- última palavra do réu ----------
// Holofote: o palco escurece em volta e um feixe de luz acende (piscando,
// como refletor ligando) em cima do retrato do réu.
function HolofoteReu({ nome, legenda }) {
  const reduzir = useReducedMotion();
  return (
    <motion.div className="v2-tribunal-palco-reu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <motion.span className="v2-tribunal-feixe" aria-hidden="true"
        initial={reduzir ? { opacity: 0 } : { opacity: 0, scaleY: 0.4 }}
        animate={reduzir ? { opacity: 1 } : { opacity: [0, 1, 0.3, 1, 0.75, 1], scaleY: 1 }}
        transition={{ delay: 0.15, duration: reduzir ? 0.3 : 0.9 }} />
      <motion.span className="v2-tribunal-palco-retrato"
        initial={reduzir ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduzir ? { delay: 0.3, duration: 0.3 } : { delay: 0.35, type: "spring", stiffness: 300, damping: 18 }}>
        <Retrato papel="acusado" tamanho={104} />
      </motion.span>
      <b>{nome}</b>
      <small>{legenda}</small>
    </motion.div>
  );
}

function UltimaPalavra({ estado, aoEnviar }) {
  const souReu = estado.meuPapel === "acusado";
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Caso estado={estado} />
      <p className="v2-tribunal-anuncio">✅ O júri está pronto. A palavra final é do réu.</p>
      <HolofoteReu nome={estado.papeis.acusado} legenda={souReu ? "a palavra é sua" : estado.palavraDoReu ? "já entregou a última palavra" : "está escrevendo a última palavra…"} />
      {souReu && (
        <>
          <BannerPapel classe="acusado" retrato="acusado">
            <b>Seu papel: RÉU · última palavra</b>
            <p>{PAPEL.acusado.missao()}</p>
            <small>{PAPEL.acusado.dica()}</small>
          </BannerPapel>
          {estado.palavraDoReu ? <div className="v2-mentira-enviada">Entregue ao tribunal: <b>“{estado.palavraDoReu.texto}”</b> ✅</div>
            : <CampoArgumento papel="acusado" aoEnviar={aoEnviar} />}
        </>
      )}
      <Debate estado={estado} />
    </section>
  );
}

function PalavraFinal({ estado }) {
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Caso estado={estado} />
      <HolofoteReu nome={estado.papeis.acusado} legenda="tem a palavra final" />
      <Argumento papel="acusado" texto={estado.palavraDoReu} titulo="Última palavra do réu" autor={estado.papeis.acusado} />
      <Debate estado={estado} />
    </section>
  );
}

// ---------- votação ----------
function Votacao({ estado, aoVotar, aoCurtir }) {
  const souJurado = estado.meuPapel === "jurado";
  const curtir = (chave, texto) => (souJurado && texto && !texto.padrao ? (
    <button className={`v2-tribunal-curtir ${estado.minhasCurtidas.includes(chave) ? "ativo" : ""}`} onClick={() => aoCurtir(chave)} aria-pressed={estado.minhasCurtidas.includes(chave)} title="Curtir: +100 pra quem escreveu">
      👍 {estado.minhasCurtidas.includes(chave) ? "curtido" : "curtir"}
    </button>
  ) : null);
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Caso estado={estado} />
      {/* O voto vem PRIMEIRO: tudo já foi lido, e no celular ninguém precisa rolar. */}
      {souJurado ? (
        <>
          <p className="v2-tribunal-anuncio">O júri decide: {estado.papeis.acusado} é…</p>
          <div className="v2-tribunal-votos" role="group" aria-label="Seu voto">
            <button className={`culpado ${estado.meuVoto === "culpado" ? "ativo" : ""}`} onClick={() => aoVotar("culpado")} aria-pressed={estado.meuVoto === "culpado"}>⚖️ CULPADO</button>
            <button className={`inocente ${estado.meuVoto === "inocente" ? "ativo" : ""}`} onClick={() => aoVotar("inocente")} aria-pressed={estado.meuVoto === "inocente"}>🕊️ INOCENTE</button>
          </div>
          <small className="v2-cartao-nota">Curta até {estado.maxCurtidas} frases abaixo ({estado.curtidasRestantes} restante{estado.curtidasRestantes === 1 ? "" : "s"}): cada curtida vale +100 pra quem escreveu. Votar com a maioria vale +100.</small>
        </>
      ) : (
        <p className="v2-tribunal-anuncio">🧑‍🤝‍🧑 O júri está decidindo… ({estado.jaVotaram.length} de {estado.totalJurados} votaram)</p>
      )}
      <Argumento papel="acusado" texto={estado.palavraDoReu} titulo="Última palavra do réu" autor={estado.papeis.acusado} entrada={false} acoes={curtir("ultima", estado.palavraDoReu)} />
      <Debate estado={estado} curtir={curtir} />
    </section>
  );
}

// ---------- veredito ----------
// Revelação em dois tempos (o servidor já manda o resultado pronto):
//   apurando (3,2s) → as fichas dos jurados caem, uma a uma, na coluna do
//   voto, com o suspense subindo e o juiz inclinado, batucando o martelo;
//   revelado → carimbo CULPADO/INOCENTE. Culpado: o cartão treme, pisca
//   vermelho, as grades descem e o juiz bate forte e aponta pro réu.
//   Inocente: estouro de papéis picados, pombas e o juiz dá de ombros.
// Quem entra no meio (ou sem votos) já vê revelado. "Reduzir movimento":
// só fades — sem tremida, flash nem papéis.
// A ordem das fichas alterna os lados enquanto dá (segura o suspense).
function ordemDasFichas(culpado, inocente) {
  const fichas = [];
  let c = 0, i = 0;
  while (c < culpado || i < inocente) {
    if (i < inocente && (i <= c || c >= culpado)) fichas.push(["inocente", i++]);
    else fichas.push(["culpado", c++]);
  }
  return fichas;
}

function Apuracao({ r, revelado }) {
  const reduzir = useReducedMotion();
  const [animar] = useState(!revelado); // montou já revelado: fichas no lugar, sem cair
  const fichas = ordemDasFichas(r.culpado, r.inocente);
  const passo = fichas.length ? Math.min(0.55, (T.REVELAR - 0.7) / fichas.length) : 0;
  const coluna = (lado) => fichas.map(([l], n) => [l, n]).filter(([l]) => l === lado).map(([, n]) => (
    <motion.span key={n} className={`v2-tribunal-ficha ${lado}`}
      initial={animar ? (reduzir ? { opacity: 0 } : { opacity: 0, y: -34, scale: 0.4 }) : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduzir ? { delay: 0.3 + n * passo, duration: 0.25 } : { delay: 0.3 + n * passo, type: "spring", stiffness: 520, damping: 17 }}>
      <Retrato papel="jurado" tamanho={30} />
    </motion.span>
  ));
  const venceu = revelado ? r.veredito : null;
  return (
    <div className={`v2-tribunal-apuracao ${revelado ? "fim" : "rufando"}`}>
      {["culpado", "inocente"].map((lado) => (
        <div key={lado} className={`v2-tribunal-apuracao-col ${lado} ${venceu === lado ? "venceu" : ""}`}>
          <span className="v2-tribunal-apuracao-rotulo">{lado === "culpado" ? "⚖️ Culpado" : "🕊️ Inocente"}</span>
          <div className="v2-tribunal-fichas">{coluna(lado)}</div>
          <b className="v2-tribunal-apuracao-num">{revelado ? r[lado] : "?"}</b>
        </div>
      ))}
    </div>
  );
}

// Papéis picados (inocente): estouram do centro e caem girando.
const PAPEIS = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2 + (i % 3) * 0.2;
  const d = 90 + ((i * 37) % 70);
  return { x: Math.cos(a) * d * 1.5, y: Math.sin(a) * d - 60, gira: ((i * 53) % 540) - 270, cor: ["#fff8e1", "#ffd23f", "#0b9a72", "#ffffff", "#b98cff"][i % 5], atraso: (i % 4) * 0.03 };
});
function PapeisPicados() {
  return (
    <div className="v2-tribunal-papeis" aria-hidden="true">
      {PAPEIS.map((p, i) => (
        <motion.span key={i} style={{ background: p.cor }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.6 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 150], rotate: p.gira, opacity: [1, 1, 0], scale: 1 }}
          transition={{ duration: 1.6, delay: p.atraso, ease: "easeOut", y: { duration: 1.6, delay: p.atraso, times: [0, 0.35, 1], ease: ["easeOut", "easeIn"] } }} />
      ))}
    </div>
  );
}

function Veredito({ estado, meuId, revelado, gesto }) {
  const reduzir = useReducedMotion();
  const r = estado.resultado;
  if (!r) return null;
  const culpado = r.veredito === "culpado";
  const ganhos = estado.jogadores.filter((j) => j.ganhou > 0).sort((a, b) => b.ganhou - a.ganhou);
  const euGanhei = ganhos.some((j) => j.id === meuId && j.ganhou >= 500);
  const tremer = revelado && culpado && !reduzir;
  return (
    <motion.section className={`v2-cartao v2-mentira-fase v2-tribunal-veredito ${revelado ? (culpado ? "culpado" : "inocente") : "apurando"}`}
      animate={tremer ? { x: [0, -12, 11, -8, 6, -3, 0] } : { x: 0 }} transition={{ duration: 0.5 }}>
      {revelado && euGanhei && <Confete quantidade={40} duracao={2500} />}
      {revelado && (culpado
        ? <div className="v2-tribunal-grades" aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} style={{ animationDelay: `${0.5 + i * 0.05}s` }} />)}</div>
        : <Pombas />)}
      {revelado && !reduzir && (culpado
        ? <motion.div className="v2-tribunal-flash" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.55, 0] }} transition={{ duration: 0.7, times: [0, 0.15, 1] }} />
        : <PapeisPicados />)}
      <Juiz className="v2-juiz-veredito" humor={revelado ? (culpado ? "culpado" : "inocente") : "suspense"} gesto={gesto} />
      <span className="v2-tribunal-caso-rotulo">Veredito · {estado.papeis.acusado}</span>
      {!revelado && <p className="v2-tribunal-anuncio" role="status">O júri decidiu… contando os votos!</p>}
      <Apuracao r={r} revelado={revelado} />
      {revelado && (
        <>
          <div className={`v2-tribunal-carimbo ${culpado ? "culpado" : "inocente"}`} role="status">{culpado ? "⚖️ CULPADO!" : "🕊️ INOCENTE!"}</div>
          <p className="v2-tribunal-placar-votos">
            {r.empate ? "Empate: absolvido por falta de provas." : culpado ? `${r.culpado} a ${r.inocente} pela condenação` : `${r.inocente} a ${r.culpado} pela absolvição`}
            {r.unanime && " · por unanimidade!"}
          </p>
          {culpado && r.sentenca && <p className="v2-tribunal-sentenca">📜 Pena: <b>{r.sentenca}</b>.</p>}
          {ganhos.length > 0 && (
            <ul className="v2-tribunal-ganhos">
              {ganhos.map((j) => (
                <li key={j.id} className={j.id === meuId ? "eu" : ""}>
                  <span><Retrato papel={j.papel === "advogado" && estado.causaPropria ? "causaPropria" : j.papel} tamanho={22} /> {j.nickname}</span><b>+{j.ganhou.toLocaleString("pt-BR")}</b>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </motion.section>
  );
}

// ---------- modo fixo: sortear de novo ou manter os papéis? ----------
function EscolhaPapeis({ estado, aoEscolher }) {
  const ep = estado.escolhaPapeis;
  return (
    <section className="v2-cartao v2-mentira-fase">
      <span className="v2-tribunal-caso-rotulo">Fim do caso · próximo passo</span>
      <p className="v2-tribunal-anuncio">O grupo decide: sortear os papéis de novo ou manter o mesmo elenco?</p>
      <div className="v2-tribunal-votos v2-tribunal-escolha-papeis" role="group" aria-label="Sortear ou manter os papéis">
        <button className={`mais ${ep?.minhaEscolha === "sortear" ? "ativo" : ""}`} onClick={() => aoEscolher("sortear")} aria-pressed={ep?.minhaEscolha === "sortear"}>🎲 Sortear de novo</button>
        <button className={`prontos ${ep?.minhaEscolha === "manter" ? "ativo" : ""}`} onClick={() => aoEscolher("manter")} aria-pressed={ep?.minhaEscolha === "manter"}>🔁 Manter os papéis</button>
      </div>
      <p className="v2-cartao-nota">Todo mundo vota (não só o júri) — a escolha vale pra sessão inteira até a próxima votação. Empate ou sem votos: mantém. {ep && `(${ep.jaVotaram.length} de ${ep.total} já votaram)`}</p>
    </section>
  );
}

// ---------- fim ----------
function Fim({ estado, meuId, aoJogarDeNovo, aoBot }) {
  const ranking = estado.jogadores.filter((j) => j.naPartida);
  const topo = ranking[0]?.pontos || 0;
  const euCampeao = topo > 0 && ranking.some((j) => j.id === meuId && j.pontos === topo);
  const t = estado.trofeus || {};
  const trofeus = [
    ["🗣️", "Melhor de lábia", t.labia, ["vitória", "vitórias"]],
    ["😂", "Mais engraçado", t.engracado, ["curtida", "curtidas"]],
    ["🕊️", "Ficha limpa", t.fichaLimpa, ["absolvição", "absolvições"]],
    ["🔎", "Júri certeiro", t.juri, ["voto certo", "votos certos"]],
  ].filter(([, , v]) => v);
  const juntar = (nomes) => (nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}` : nomes[0]);
  return (
    <section className={`v2-cartao v2-mentira-fase v2-mentira-fim ${euCampeao ? "campeao" : ""}`}>
      {topo > 0 && <Confete quantidade={euCampeao ? 140 : 70} duracao={euCampeao ? 6000 : 4000} />}
      {euCampeao && <div className="v2-mentira-voce-venceu">🎉 VOCÊ VENCEU! 🎉</div>}
      <h2>Sessão encerrada</h2>
      <ol className="v2-tribunal-final">
        {ranking.map((j, i) => (
          <li key={j.id} className={j.id === meuId ? "eu" : ""}>
            <span>{["🥇", "🥈", "🥉"][i] || `${i + 1}º`}</span>
            <Avatar userId={j.id} nickname={j.nickname} tamanho={32} />
            <b>{j.nickname}</b>
            <em>{j.pontos.toLocaleString("pt-BR")}</em>
          </li>
        ))}
      </ol>
      {trofeus.length > 0 && (
        <div className="v2-tribunal-trofeus">
          {trofeus.map(([ic, nome, v, un]) => (
            <div key={nome}><span>{ic}</span><b>{nome}</b><small>{juntar(v.nomes)} · {v.valor} {v.valor === 1 ? un[0] : un[1]}</small></div>
          ))}
        </div>
      )}
      {estado.souDono ? (
        <>
          {estado.permiteBots && <div className="v2-mentira-bots"><button className="v2-botao v2-botao-contorno" onClick={() => aoBot("adicionar")}>+ bot de teste</button></div>}
          <button className="v2-botao v2-botao-amarelo v2-botao-largo" onClick={aoJogarDeNovo}>Nova sessão</button>
        </>
      ) : <p className="v2-cartao-nota">O dono da sala pode abrir uma nova sessão.</p>}
    </section>
  );
}

// ---------- placar lateral ----------
// Durante a apuração do veredito, os pontos novos ficam escondidos (não
// entregam o resultado antes da hora).
function Placar({ estado, meuId, revelado = true }) {
  return (
    <aside className="v2-cartao v2-mentira-placar" aria-label="Placar">
      <div className="v2-bloco-titulo">Placar</div>
      {estado.jogadores.map((j, i) => (
        <div key={j.id} className={`v2-mentira-jogador ${j.id === meuId ? "eu" : ""} ${j.online ? "" : "fora"}`}>
          <span className="v2-mentira-pos">{i + 1}</span>
          <Avatar userId={j.id} nickname={j.nickname} tamanho={30} />
          <span className="v2-mentira-nick">
            {j.nickname}{j.id === estado.donoId ? " 👑" : ""}{j.bot && <em className="v2-tag-bot">bot</em>}
            {j.papel && j.papel !== "fora" && <small className={`v2-tribunal-tag ${j.papel === "advogado" && estado.causaPropria ? "acusado" : j.papel}`}><Retrato papel={j.papel === "advogado" && estado.causaPropria ? "causaPropria" : j.papel} tamanho={16} /> {j.papel === "advogado" && estado.causaPropria ? "Réu (se defende)" : PAPEL[j.papel].nome}</small>}
          </span>
          {j.ganhou > 0 && estado.fase === "veredito" && revelado && <em className="v2-mentira-ganho">+{j.ganhou}</em>}
          <b>{(revelado ? j.pontos : j.pontos - (j.ganhou || 0)).toLocaleString("pt-BR")}</b>
        </div>
      ))}
    </aside>
  );
}
