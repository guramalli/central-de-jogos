import { versaoTexto } from "./versoes.js";
import { useEffect, useRef, useState } from "react";
import { api, novoSocket } from "./api.js";
import Avatar from "./Avatar.jsx";
import { ativarSons, somCampeao, carregarSons, somMarteloAbertura, somMarteloUma, somPlateia, somTambor, somCulpado, somInocente } from "./sons.js";
import { Moldura, Relogio, Confete, ReacoesFlutuando, ChatMentira, ControleSom } from "./Mentira.jsx";

// O TRIBUNAL — tela (EM TESTE, com selo "em testes" nos cards do Início, da
// página pública e da versão clássica).
// A conexão segue o mesmo modelo do Mentira Sincera (volta sozinha pra sala
// depois de uma queda). O motor fica em backend/src/tribunal/.

const REACOES = ["😂", "⚖️", "😱", "🔥", "👏", "🤡"];
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

export default function Tribunal({ usuario, salaDoLink }) {
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState("");
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [caiu, setCaiu] = useState(false);
  const socketRef = useRef(null);
  const codigoRef = useRef(salaDoLink || null);
  useEffect(() => { ativarSons(); carregarSons("tribunal"); }, []);

  useEffect(() => {
    const s = novoSocket();
    socketRef.current = s;
    let etapa = "";
    s.on("tribunal-estado", (e) => {
      const agora = `${e.fase}-${e.rodada}`;
      if (agora !== etapa) { etapa = agora; setErro(""); }
      codigoRef.current = e.codigo;
      setEstado(e);
    });
    s.on("connect", () => {
      setCaiu(false);
      if (codigoRef.current) s.emit("tribunal-entrar", { codigo: codigoRef.current }, (r) => r?.erro && setErro(r.erro));
    });
    s.on("disconnect", () => setCaiu(true));
    s.connect();
    return () => { s.emit("tribunal-sair"); s.disconnect(); };
  }, [salaDoLink]);

  // Sons do tribunal, um por momento (a chave inclui a rodada do debate,
  // pra tocar de novo a cada réplica):
  //   caso novo → 3 batidas de martelo · júri delibera → burburinho da plateia
  //   júri pronto (última palavra) → 1 batida · última palavra na tela → tambor
  //   veredito → culpado / inocente · campeão → fanfarra do site
  const somRef = useRef("");
  const [cena, setCena] = useState(null); // { variante, cor } — martelo de tela cheia, some sozinho
  useEffect(() => {
    if (!estado) return;
    const chave = `${estado.fase}-${estado.rodada}-${estado.rodadaDebate}`;
    if (somRef.current === chave) return;
    somRef.current = chave;
    let t = null;
    if (estado.fase === "escrever" && estado.rodadaDebate === 1) { somMarteloAbertura(); setCena({ variante: "abertura" }); t = setTimeout(() => setCena(null), 2200); }
    else if (estado.fase === "deliberar") somPlateia();
    else if (estado.fase === "ultima" || (estado.fase === "votar" && estado.causaPropria)) somMarteloUma();
    else if (estado.fase === "palavraFinal") somTambor();
    else if (estado.fase === "veredito") {
      const culpado = estado.resultado?.veredito === "culpado";
      (culpado ? somCulpado : somInocente)();
      setCena({ variante: "veredito", cor: culpado ? "#d8392c" : "#0b9a72" }); t = setTimeout(() => setCena(null), 1300);
    }
    else if (estado.fase === "fim" && estado.jogadores[0]?.id === usuario.id && estado.jogadores[0].pontos > 0) somCampeao();
    return () => { if (t) clearTimeout(t); };
  }, [estado?.fase, estado?.rodada, estado?.rodadaDebate]);

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
    setEstado(null);
    window.history.replaceState(null, "", "/v2/?pagina=tribunal");
  }

  // ---------- lobby ----------
  if (!estado) {
    return (
      <Moldura usuario={usuario} classe="v2-mentira v2-tribunal">
        <section className="v2-cartao v2-tribunal-entrada">
          <img src="/tribunal-logo.png" alt="" className="v2-tribunal-logo" />
          <h1 className="v2-oculto">O Tribunal</h1>
          <span className="v2-versao-jogo v2-versao-jogo-lobby" title="Quantas entregas já mexeram neste jogo">{versaoTexto("tribunal")}</span>
          <p className="v2-cartao-nota">Um jogador é acusado de um crime absurdo. O promotor tenta condenar, o advogado tenta salvar, o réu tem a última palavra — e o júri decide: <b>culpado</b> ou <b>inocente</b>?</p>
          <span className="v2-mentira-teste">em testes</span>
          {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}
          {salaDoLink && !erro && <div className="v2-carregando">Entrando na sala…</div>}
        </section>
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
  return (
    <Moldura usuario={usuario} classe="v2-mentira v2-tribunal">
      <ReacoesFlutuando reacoes={estado.reacoes || []} />
      {cena && <CenaMartelo key={`${cena.variante}-${somRef.current}`} variante={cena.variante} cor={cena.cor} />}
      {(fase === "ultima" || fase === "palavraFinal") && <div className="v2-tribunal-holofote" aria-hidden="true" />}
      <section className="v2-mentira-topo">
        <div>
          <h1>⚖️ O Tribunal</h1>
          {estado.rodada > 0 && fase !== "fim" && (
            <span className="v2-mentira-rodada">Caso {estado.rodada} de {estado.totalRodadas}
              {estado.rodadaDebate > 0 && fase !== "veredito" && fase !== "escolhaPapeis" && <em className="v2-tribunal-debate-selo">debate {estado.rodadaDebate}/{estado.maxDebate}</em>}
              {estado.ultima && <em className="v2-tribunal-dobro">ÚLTIMO ×2</em>}</span>
          )}
        </div>
        <div className="v2-mentira-topo-dir">
          <span className="v2-mentira-cod-selo">{estado.publica ? estado.nomeSala : `sala ${estado.codigo}`}</span>
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
          {fase === "veredito" && <Veredito estado={estado} meuId={usuario.id} />}
          {fase === "fim" && <Fim estado={estado} meuId={usuario.id} aoJogarDeNovo={() => pedir("tribunal-comecar")} aoBot={(acao) => pedir("tribunal-bot", { acao })} />}
        </div>
        <div className="v2-mentira-lateral">
          <Placar estado={estado} meuId={usuario.id} />
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

// Cena de tela cheia: `variante` "abertura" (3 batidas) ou "veredito" (1 batida forte).
function CenaMartelo({ variante, cor }) {
  return (
    <div className={`v2-tribunal-cena v2-tribunal-cena-${variante}`} aria-hidden="true" style={cor ? { "--cena-cor": cor } : undefined}>
      <div className="v2-tribunal-cena-fundo" />
      <div className="v2-tribunal-cena-martelo">
        <MarteloSVG className={variante} />
        <span className="v2-tribunal-onda o1" /><span className="v2-tribunal-onda o2" /><span className="v2-tribunal-onda o3" />
      </div>
      {variante === "abertura" && <div className="v2-tribunal-cena-texto">ORDEM NO TRIBUNAL!</div>}
    </div>
  );
}

function JuriCochichando({ nomes }) {
  return (
    <div className="v2-tribunal-juri" aria-hidden="true">
      {nomes.map((n, i) => (
        <div key={n} className="v2-tribunal-jurado" style={{ animationDelay: `${i * 0.35}s` }}>
          <span className="v2-tribunal-jurado-balao">…</span>
          <span className="v2-tribunal-jurado-cara">🧑‍⚖️</span>
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
function Caso({ estado, relogio = true }) {
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
      <div className="v2-tribunal-caso">
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
      </div>
      <div className="v2-tribunal-elenco">
        <span className="promotor">🧑‍💼 Promotor: <b>{estado.papeis.promotor}</b></span>
        <span className="advogado">{estado.causaPropria ? <>🙋 Defesa: <b>{estado.papeis.advogado}</b> (em causa própria)</> : <>🧑‍⚖️ Advogado: <b>{estado.papeis.advogado}</b></>}</span>
        {estado.papeis.testemunha && <span className="testemunha">🧑 Testemunha: <b>{estado.papeis.testemunha}</b></span>}
      </div>
    </>
  );
}

// ---------- um argumento (cartão) ----------
function Argumento({ papel, texto, titulo, autor, entrada = true, acoes = null, prova = null }) {
  if (!texto) return null;
  return (
    <div className={`v2-tribunal-argumento ${papel} ${entrada ? "entra" : ""} ${texto.padrao ? "padrao" : ""}`}>
      {entrada && prova && !texto.padrao && <span className="v2-tribunal-prova">{prova}</span>}
      <span className="v2-tribunal-argumento-quem">{PAPEL[papel].icone} {titulo} · <b>{autor}</b></span>
      <p>{texto.padrao ? <i>{texto.texto}</i> : `“${texto.texto}”`}</p>
      {acoes}
    </div>
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
              return <Argumento key={p} papel={p} texto={d[p]} titulo={(NOME_ARG[p][i] || NOME_ARG[p][2]) + (p === "advogado" && estado.causaPropria ? " (em causa própria)" : "")} autor={estado.papeis[p]} entrada={nova}
                prova={`PROVA ${i * 2 + provaIdx + 1}`} acoes={curtir ? curtir(`${p}-${d.rodada}`, d[p]) : null} />;
            })}
          </div>
        );
      })}
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
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Caso estado={estado} />
      {anteriores.length > 0 && (
        <>
          <p className="v2-tribunal-anuncio">🔍 O júri quer mais provas! Rodada {k} do debate.</p>
          <Debate estado={estado} ate={anteriores.length} />
        </>
      )}
      {escrevo ? (
        <>
          {(() => { const info = papel === "advogado" && estado.causaPropria ? PAPEL.causaPropria : PAPEL[papel]; return (
          <div className={`v2-tribunal-papel ${info.classe}`}>
            <b>{info.icone} Seu papel: {info.nome.toUpperCase()}{k > 1 ? ` · ${NOME_ARG[papel][k - 1] || NOME_ARG[papel][2]}` : ""}</b>
            <p>{info.missao(estado.papeis.acusado, k)}</p>
            <small>{info.dica(k)}</small>
          </div>); })()}
          {meu ? <div className="v2-mentira-enviada">Entregue ao tribunal: <b>“{meu.texto}”</b> ✅</div>
            : <CampoArgumento papel={papel} k={k} aoEnviar={aoEnviar} />}
        </>
      ) : papel === "acusado" ? (
        <div className="v2-tribunal-papel acusado">
          <b>🙋 Seu papel: RÉU</b>
          <p>Acompanhe o debate. Quando o júri estiver pronto, você terá a última palavra.</p>
        </div>
      ) : papel === "testemunha" ? (
        <div className="v2-tribunal-papel testemunha">
          <b>🧑 Seu papel: TESTEMUNHA</b>
          <p>Você já deu seu depoimento nesta rodada — agora é a vez da réplica entre promotor e advogado.</p>
        </div>
      ) : (
        <div className="v2-tribunal-papel jurado">
          <b>🧑‍🤝‍🧑 Seu papel nesta rodada: JÚRI</b>
          <p>Enquanto os outros escrevem, provoque no chat. Depois você decide se quer mais provas ou se já dá pra votar.</p>
        </div>
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
      <textarea id="v2-tribunal-texto" ref={campoRef} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} rows={3} placeholder={dica}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) enviar(e); }} />
      <div className="v2-tribunal-form-rodape">
        <small>{texto.length}/200</small>
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
function UltimaPalavra({ estado, aoEnviar }) {
  const souReu = estado.meuPapel === "acusado";
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Caso estado={estado} />
      <p className="v2-tribunal-anuncio">✅ O júri está pronto. A palavra final é do réu.</p>
      {souReu ? (
        <>
          <div className="v2-tribunal-papel acusado">
            <b>🙋 Seu papel: RÉU · última palavra</b>
            <p>{PAPEL.acusado.missao()}</p>
            <small>{PAPEL.acusado.dica()}</small>
          </div>
          {estado.palavraDoReu ? <div className="v2-mentira-enviada">Entregue ao tribunal: <b>“{estado.palavraDoReu.texto}”</b> ✅</div>
            : <CampoArgumento papel="acusado" aoEnviar={aoEnviar} />}
        </>
      ) : <p className="v2-cartao-nota v2-centralizado">🙋 {estado.papeis.acusado} está escrevendo a última palavra…</p>}
      <Debate estado={estado} />
    </section>
  );
}

function PalavraFinal({ estado }) {
  return (
    <section className="v2-cartao v2-mentira-fase">
      <Caso estado={estado} />
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
function Veredito({ estado, meuId }) {
  const r = estado.resultado;
  if (!r) return null;
  const culpado = r.veredito === "culpado";
  const ganhos = estado.jogadores.filter((j) => j.ganhou > 0).sort((a, b) => b.ganhou - a.ganhou);
  const euGanhei = ganhos.some((j) => j.id === meuId && j.ganhou >= 500);
  return (
    <section className={`v2-cartao v2-mentira-fase v2-tribunal-veredito ${culpado ? "culpado" : "inocente"}`}>
      {euGanhei && <Confete quantidade={40} duracao={2500} />}
      {culpado ? <div className="v2-tribunal-grades" aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} style={{ animationDelay: `${0.5 + i * 0.05}s` }} />)}</div> : <Pombas />}
      <span className="v2-tribunal-caso-rotulo">Veredito · {estado.papeis.acusado}</span>
      <div className={`v2-tribunal-carimbo ${culpado ? "culpado" : "inocente"}`}>{culpado ? "⚖️ CULPADO!" : "🕊️ INOCENTE!"}</div>
      <p className="v2-tribunal-placar-votos">
        {r.empate ? "Empate: absolvido por falta de provas." : culpado ? `${r.culpado} a ${r.inocente} pela condenação` : `${r.inocente} a ${r.culpado} pela absolvição`}
        {r.unanime && " · por unanimidade!"}
      </p>
      {culpado && r.sentenca && <p className="v2-tribunal-sentenca">📜 Pena: <b>{r.sentenca}</b>.</p>}
      {ganhos.length > 0 && (
        <ul className="v2-tribunal-ganhos">
          {ganhos.map((j) => (
            <li key={j.id} className={j.id === meuId ? "eu" : ""}>
              <span>{PAPEL[j.papel]?.icone || ""} {j.nickname}</span><b>+{j.ganhou.toLocaleString("pt-BR")}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
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
function Placar({ estado, meuId }) {
  return (
    <aside className="v2-cartao v2-mentira-placar" aria-label="Placar">
      <div className="v2-bloco-titulo">Placar</div>
      {estado.jogadores.map((j, i) => (
        <div key={j.id} className={`v2-mentira-jogador ${j.id === meuId ? "eu" : ""} ${j.online ? "" : "fora"}`}>
          <span className="v2-mentira-pos">{i + 1}</span>
          <Avatar userId={j.id} nickname={j.nickname} tamanho={30} />
          <span className="v2-mentira-nick">
            {j.nickname}{j.id === estado.donoId ? " 👑" : ""}{j.bot && <em className="v2-tag-bot">bot</em>}
            {j.papel && j.papel !== "fora" && <small className={`v2-tribunal-tag ${j.papel === "advogado" && estado.causaPropria ? "acusado" : j.papel}`}>{j.papel === "advogado" && estado.causaPropria ? "🙋 Réu (se defende)" : `${PAPEL[j.papel].icone} ${PAPEL[j.papel].nome}`}</small>}
          </span>
          {j.ganhou > 0 && estado.fase === "veredito" && <em className="v2-mentira-ganho">+{j.ganhou}</em>}
          <b>{j.pontos.toLocaleString("pt-BR")}</b>
        </div>
      ))}
    </aside>
  );
}
