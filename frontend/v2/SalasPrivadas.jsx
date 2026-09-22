import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, irParaStop, irParaAcro, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";

// SALAS PRIVADAS (Stop e Acromania) — mesmas rotas e regras do clássico
// (src/pages/SalaPrivada.jsx e AcromaniaPrivada.jsx). Entrar sempre passa
// por /entrar: é ali que o servidor libera a pessoa (e confere a senha).
// Link direto (?sala=ID) abre a senha ou entra sozinho.

export default function SalasPrivadas({ usuario, jogo, salaDoLink }) {
  const ehStop = jogo !== "acromania";
  const base = ehStop ? "/salas-privadas" : "/salas-privadas/acromania";
  const [aba, setAba] = useState("entrar");
  const [salas, setSalas] = useState(null);
  const [erro, setErro] = useState("");
  const [pedindoSenha, setPedindoSenha] = useState(null);
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const linkTratado = useRef(false);

  const carregar = () => api.get(base).then(({ data }) => setSalas(data || [])).catch(() => setSalas((s) => s || []));
  useEffect(() => {
    carregar();
    const t = setInterval(() => { if (!document.hidden) carregar(); }, 15000);
    return () => clearInterval(t);
  }, [jogo]);

  // Veio por link de convite: acha a sala e pede a senha (ou entra).
  useEffect(() => {
    if (!salaDoLink || !salas || linkTratado.current) return;
    linkTratado.current = true;
    const sala = salas.find((s) => s.roomId === salaDoLink);
    if (!sala) setErro("Essa sala não existe mais — ela some quando todo mundo sai.");
    else if (sala.temSenha) abrirSenha(sala);
    else entrar(sala);
  }, [salas, salaDoLink]);

  const abrir = (roomId) => (ehStop ? irParaStop(roomId) : irParaAcro(roomId));
  function abrirSenha(sala) { setPedindoSenha(sala); setSenhaDigitada(""); setErro(""); }
  async function entrar(sala, senha = "") {
    setErro("");
    try {
      const { data } = await api.post(`${base}/entrar`, { roomId: sala.roomId, senha });
      abrir(data.roomId || sala.roomId);
    } catch (e) {
      setErro(e.response?.data?.error || "Não foi possível entrar.");
      carregar();
    }
  }
  const clicarSala = (s) => (s.temSenha ? abrirSenha(s) : entrar(s));

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo={jogo} />
      <main className="v2-pagina">
        <a className="v2-link" href={linkDaPagina("jogar", { jogo })} onClick={(e) => { e.preventDefault(); irParaPagina("jogar", { jogo }); }}>← salas do {ehStop ? "Stop" : "Acromania"}</a>
        <div className="v2-pagina-cabeca"><h1>Salas dos jogadores</h1><img className="v2-privadas-logo" src={ehStop ? "/stop-logo.png" : "/acromania-logo.png"} alt={ehStop ? "Stop" : "Acromania"} /></div>
        <p className="v2-pagina-nota">
          {ehStop
            ? "Monte uma sala do seu jeito: escolha os temas, o tempo e um nome. Na validação pela mesa, quem decide o que vale são os próprios jogadores."
            : "Crie uma sala com os seus tempos e chame quem você quiser."}{" "}
          <b>Salas privadas não valem pontos no ranking.</b>
        </p>

        <div className="v2-segmentado" role="tablist">
          <button role="tab" aria-selected={aba === "entrar"} className={aba === "entrar" ? "ativo" : ""} onClick={() => { setAba("entrar"); setErro(""); }}>Salas abertas{salas ? ` (${salas.length})` : ""}</button>
          <button role="tab" aria-selected={aba === "criar"} className={aba === "criar" ? "ativo" : ""} onClick={() => { setAba("criar"); setErro(""); }}>Criar sala</button>
        </div>
        {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}

        {aba === "entrar" && (
          <section className="v2-cartao">
            {salas === null && <div className="v2-carregando">Carregando…</div>}
            {salas?.length === 0 && (
              <div className="v2-vazio-grande">
                Nenhuma sala aberta agora.
                <button className="v2-botao v2-botao-amarelo v2-bloco-centro" onClick={() => setAba("criar")}>Criar a primeira</button>
              </div>
            )}
            <div className="v2-privadas-lista">
              {(salas || []).map((s) => (
                <button key={s.roomId} className="v2-privada v2-privada-botao" onClick={() => clicarSala(s)}>
                  <div className="v2-privada-topo">
                    <b>
                      <svg className="v2-cadeado" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-label={s.temSenha ? "com senha" : "livre"}>
                        <rect x="5" y="11" width="14" height="10" rx="2" /><path d={s.temSenha ? "M8 11V7a4 4 0 018 0v4" : "M8 11V7a4 4 0 017.5-2"} />
                      </svg>{" "}
                      {s.nome}
                    </b>
                    <span>{s.jogadores === 0 ? "esperando" : `${s.jogadores}/${s.maxPlayers}`}</span>
                  </div>
                  <div className="v2-privada-info">
                    por {s.criador}
                    {ehStop ? ` · ${s.answerSeconds}s por rodada · ${s.temas?.length || 0} temas · ${s.validacaoPorVoto ? "mesa decide" : "automática"}` : ""}
                  </div>
                  {ehStop && s.temas?.length > 0 && <div className="v2-privada-temas">{s.temas.slice(0, 5).join(" · ")}{s.temas.length > 5 && ` +${s.temas.length - 5}`}</div>}
                </button>
              ))}
            </div>
          </section>
        )}

        {aba === "criar" && (ehStop ? <CriarStop aoCriar={abrir} setErro={setErro} /> : <CriarAcro aoCriar={abrir} setErro={setErro} />)}
      </main>
      <Rodape />

      {pedindoSenha && (
        <div className="v2-modal-fundo" onClick={() => setPedindoSenha(null)}>
          <div className="v2-modal" role="dialog" aria-label={`Senha da sala ${pedindoSenha.nome}`} onClick={(e) => e.stopPropagation()}>
            <button className="v2-modal-fechar" aria-label="Fechar" onClick={() => setPedindoSenha(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <h3>{pedindoSenha.nome}</h3>
            <p className="v2-modal-citacao">Essa sala é protegida. Peça a senha pra quem te chamou.</p>
            <form className="v2-modal-form" onSubmit={(e) => { e.preventDefault(); entrar(pedindoSenha, senhaDigitada); setPedindoSenha(null); }}>
              <label htmlFor="v2-senha-sala" className="v2-oculto">Senha da sala</label>
              <input id="v2-senha-sala" type="password" className="data-cs-mask" placeholder="Senha da sala" value={senhaDigitada} onChange={(e) => setSenhaDigitada(e.target.value)} autoComplete="off" autoFocus />
              <div className="v2-modal-acoes"><button type="submit" className="v2-botao v2-botao-amarelo">Entrar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Nome + livre/com senha (igual nos dois jogos).
function NomeEAcesso({ nome, setNome, comSenha, setComSenha, senha, setSenha }) {
  const [ver, setVer] = useState(false);
  return (
    <section className="v2-cartao">
      <h2>1. Nome e acesso</h2>
      <label className="v2-admin-campo">Nome da sala
        <input className="v2-campo" value={nome} onChange={(e) => setNome(e.target.value.slice(0, 30))} maxLength={30} placeholder="Ex.: Galera do trampo" />
      </label>
      <div className="v2-opcoes-grandes">
        <button type="button" className={!comSenha ? "ativa" : ""} aria-pressed={!comSenha} onClick={() => { setComSenha(false); setSenha(""); }}>
          <b>Livre</b><span>Qualquer um entra pela lista</span>
        </button>
        <button type="button" className={comSenha ? "ativa" : ""} aria-pressed={comSenha} onClick={() => setComSenha(true)}>
          <b>Com senha</b><span>Só quem você convidar</span>
        </button>
      </div>
      {comSenha && (
        <div className="v2-linha-form">
          <label htmlFor="v2-nova-senha" className="v2-oculto">Senha da sala</label>
          <input id="v2-nova-senha" type={ver ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value.slice(0, 20))} maxLength={20} placeholder="Defina a senha da sala" autoComplete="off" />
          <button type="button" className="v2-botao-pequeno" onClick={() => setVer((v) => !v)} aria-label={ver ? "Esconder a senha" : "Mostrar a senha"}>{ver ? "Esconder" : "Mostrar"}</button>
        </div>
      )}
    </section>
  );
}

function Deslizante({ rotulo, valor, sufixo, min, max, passo = 1, aoMudar, extra }) {
  return (
    <label className="v2-deslizante">
      <span>{rotulo}: <b>{valor}{sufixo}</b>{extra && <em> {extra}</em>}</span>
      <input type="range" min={min} max={max} step={passo} value={valor} onChange={(e) => aoMudar(Number(e.target.value))} />
    </label>
  );
}

function CriarStop({ aoCriar, setErro }) {
  const [temas, setTemas] = useState([]);
  const [escolhidos, setEscolhidos] = useState([]);
  const [nome, setNome] = useState("");
  const [comSenha, setComSenha] = useState(false);
  const [senha, setSenha] = useState("");
  const [segundos, setSegundos] = useState(40);
  const [maxJogadores, setMaxJogadores] = useState(8);
  const [segVotacao, setSegVotacao] = useState(40);
  const [trava, setTrava] = useState(15);
  const [automatica, setAutomatica] = useState(false);
  const [criando, setCriando] = useState(false);

  useEffect(() => { api.get("/salas-privadas/temas").then(({ data }) => setTemas(data || [])).catch(() => {}); }, []);

  function trocarModo(auto) {
    setAutomatica(auto);
    if (auto) {
      const validos = temas.filter((t) => t.temGlossario).map((t) => t.key);
      setEscolhidos((a) => a.filter((k) => validos.includes(k)));
    }
  }
  const alternar = (k) => setEscolhidos((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
  const disponiveis = automatica ? temas.filter((t) => t.temGlossario) : temas;
  const normais = disponiveis.filter((t) => !t.zoeira);
  const zoeira = disponiveis.filter((t) => t.zoeira);
  const ocultos = temas.length - disponiveis.length;
  const maxTrava = Math.max(5, segundos - 5);

  async function criar() {
    setErro("");
    if (nome.trim().length < 3) return setErro("Dê um nome pra sala (mínimo 3 letras).");
    if (escolhidos.length < 3) return setErro("Escolha pelo menos 3 temas.");
    if (comSenha && senha.trim().length < 3) return setErro("Defina uma senha de pelo menos 3 caracteres — ou escolha sala livre.");
    setCriando(true);
    try {
      const { data } = await api.post("/salas-privadas/criar", {
        nome: nome.trim(), senha: comSenha ? senha.trim() : "", themeKeys: escolhidos,
        answerSeconds: segundos, maxPlayers: maxJogadores, votingSeconds: segVotacao,
        minSecondsBeforeStop: Math.min(trava, maxTrava), usarGlossario: automatica,
      });
      aoCriar(data.roomId);
    } catch (e) {
      setErro(e.response?.data?.error || "Erro ao criar a sala.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setCriando(false); }
  }

  const Tema = ({ t }) => (
    <button type="button" className={`v2-tema-opcao ${escolhidos.includes(t.key) ? "ativa" : ""} ${t.zoeira ? "zoeira" : ""}`} aria-pressed={escolhidos.includes(t.key)} onClick={() => alternar(t.key)} title={t.temGlossario ? `${t.palavras} palavras cadastradas` : "Sem lista de palavras"}>
      {t.name}
    </button>
  );

  return (
    <>
      <NomeEAcesso nome={nome} setNome={setNome} comSenha={comSenha} setComSenha={setComSenha} senha={senha} setSenha={setSenha} />
      <section className="v2-cartao">
        <h2>2. Como as palavras são validadas</h2>
        <div className="v2-opcoes-grandes">
          <button type="button" className={!automatica ? "ativa" : ""} aria-pressed={!automatica} onClick={() => trocarModo(false)}><b>A mesa decide</b><span>Depois de cada rodada, vocês votam no que vale. Aceita qualquer tema.</span></button>
          <button type="button" className={automatica ? "ativa" : ""} aria-pressed={automatica} onClick={() => trocarModo(true)}><b>Automática</b><span>O site confere sozinho. Mais rápido, só com temas que têm lista.</span></button>
        </div>
      </section>
      <section className="v2-cartao">
        <h2>3. Escolha os temas <span className="v2-contador">{escolhidos.length}</span></h2>
        <p className="v2-cartao-nota">De 3 a 12 temas. A cada rodada, 6 deles são sorteados.{automatica && ocultos > 0 && <> <b>{ocultos}</b> tema(s) não aparecem porque ainda não têm lista de palavras — troque pra "A mesa decide" pra usar todos.</>}</p>
        <div className="v2-temas-opcoes">{normais.map((t) => <Tema key={t.key} t={t} />)}</div>
        {zoeira.length > 0 && (
          <>
            <div className="v2-bloco-titulo">Temas de zoeira</div>
            <p className="v2-cartao-nota">Como a validação aqui é por voto, esses temas subjetivos funcionam bem.</p>
            <div className="v2-temas-opcoes">{zoeira.map((t) => <Tema key={t.key} t={t} />)}</div>
          </>
        )}
      </section>
      <section className="v2-cartao">
        <h2>4. Ajuste a partida</h2>
        <Deslizante rotulo="Tempo por rodada" valor={segundos} sufixo=" segundos" min={20} max={180} passo={5} aoMudar={setSegundos} />
        <Deslizante rotulo="Máximo de jogadores" valor={maxJogadores} sufixo="" min={2} max={16} aoMudar={setMaxJogadores} />
        {!automatica && (
          <>
            <Deslizante rotulo="Tempo total de votação" valor={segVotacao} sufixo=" segundos" min={15} max={180} passo={5} aoMudar={setSegVotacao} extra={`(mínimo de ~${Math.max(8, Math.round(segVotacao / 6))}s por tema)`} />
            <p className="v2-cartao-nota">Depois de cada rodada, a mesa julga as palavras <b>tema por tema</b>. Cada tema avança assim que todos votarem — ou quando o tempo dele acabar. Palavra sem voto é <b>aceita</b>. E dá pra marcar uma palavra como <b>muito boa</b>: ela vale e ainda rende <b>+5</b> pra quem escreveu.</p>
          </>
        )}
        <Deslizante rotulo="Trava do STOP" valor={Math.min(trava, maxTrava)} sufixo={trava === 0 ? "" : " segundos"} min={0} max={maxTrava} passo={5} aoMudar={setTrava} extra={trava === 0 ? "(sem trava)" : ""} />
        <p className="v2-cartao-nota">Tempo mínimo antes que alguém possa pedir STOP. Evita que a rodada acabe em 3 segundos.</p>
      </section>
      <button className="v2-botao v2-botao-amarelo v2-botao-largo" onClick={criar} disabled={criando || escolhidos.length < 3 || nome.trim().length < 3 || (comSenha && senha.trim().length < 3)}>
        {criando ? "Criando…" : "Criar sala"}
      </button>
    </>
  );
}

function CriarAcro({ aoCriar, setErro }) {
  const [nome, setNome] = useState("");
  const [comSenha, setComSenha] = useState(false);
  const [senha, setSenha] = useState("");
  const [segEscrita, setSegEscrita] = useState(60);
  const [segVotacao, setSegVotacao] = useState(30);
  const [rodadas, setRodadas] = useState(8);
  const [maxJogadores, setMaxJogadores] = useState(8);
  const [criando, setCriando] = useState(false);

  async function criar() {
    setErro("");
    if (nome.trim().length < 3) return setErro("Dê um nome pra sala (mínimo 3 letras).");
    if (comSenha && senha.trim().length < 3) return setErro("A senha precisa de pelo menos 3 caracteres.");
    setCriando(true);
    try {
      const { data } = await api.post("/salas-privadas/acromania/criar", { nome: nome.trim(), senha: comSenha ? senha : "", writingSeconds: segEscrita, votingSeconds: segVotacao, roundsPerTurn: rodadas, maxPlayers: maxJogadores });
      aoCriar(data.roomId);
    } catch (e) {
      setErro(e.response?.data?.error || "Não foi possível criar a sala.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setCriando(false); }
  }

  return (
    <>
      <NomeEAcesso nome={nome} setNome={setNome} comSenha={comSenha} setComSenha={setComSenha} senha={senha} setSenha={setSenha} />
      <section className="v2-cartao">
        <h2>2. Ajuste a partida</h2>
        <Deslizante rotulo="Tempo pra escrever a frase" valor={segEscrita} sufixo=" segundos" min={20} max={180} passo={5} aoMudar={setSegEscrita} />
        <Deslizante rotulo="Tempo de votação" valor={segVotacao} sufixo=" segundos" min={15} max={180} passo={5} aoMudar={setSegVotacao} />
        <Deslizante rotulo="Rodadas por partida" valor={rodadas} sufixo="" min={3} max={20} aoMudar={setRodadas} />
        <Deslizante rotulo="Máximo de jogadores" valor={maxJogadores} sufixo="" min={2} max={16} aoMudar={setMaxJogadores} />
      </section>
      <button className="v2-botao v2-botao-amarelo v2-botao-largo" onClick={criar} disabled={criando || nome.trim().length < 3 || (comSenha && senha.trim().length < 3)}>
        {criando ? "Criando…" : "Criar sala"}
      </button>
    </>
  );
}
