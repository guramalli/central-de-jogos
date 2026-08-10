import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import Seo from "../components/Seo.jsx";

// Tela pra criar uma sala privada de Stop ou entrar numa das que estão
// abertas. Sala sem senha qualquer um entra; com senha, só quem souber.
export default function SalaPrivada() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Garante que a sala vinda do link só é tratada uma vez.
  const jaTratouLink = useRef(false);
  const [temas, setTemas] = useState([]);
  const [salas, setSalas] = useState([]);
  const [escolhidos, setEscolhidos] = useState([]);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  // Sala livre (qualquer um entra) ou protegida por senha.
  const [comSenha, setComSenha] = useState(false);
  const [segundos, setSegundos] = useState(40);
  const [maxJogadores, setMaxJogadores] = useState(8);
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);
  const [aba, setAba] = useState("entrar");
  // Sala que o jogador clicou e que pede senha.
  const [pedindoSenha, setPedindoSenha] = useState(null);
  const [senhaDigitada, setSenhaDigitada] = useState("");

  useEffect(() => {
    api.get("/salas-privadas/temas").then(({ data }) => setTemas(data)).catch(() => {});
    carregarSalas();
    // Atualiza a lista de tempos em tempos: sala nova pode ter aberto, e
    // sala vazia some sozinha.
    const t = setInterval(carregarSalas, 15000);
    return () => clearInterval(t);
  }, []);

  function carregarSalas() {
    api.get("/salas-privadas").then(({ data }) => {
      setSalas(data);

      // Veio da lobby clicando numa sala específica: resolve a entrada na
      // hora (direto se for livre, ou abre o pedido de senha). Só na
      // PRIMEIRA carga — a lista recarrega sozinha a cada poucos segundos,
      // e sem essa trava o modal de senha reabriria toda vez.
      if (jaTratouLink.current) return;
      const alvo = params.get("sala");
      if (!alvo) return;
      jaTratouLink.current = true;
      const sala = data.find((s) => s.roomId === alvo);
      if (sala) clicarSala(sala);
      else setErro("Essa sala não existe mais — ela some quando todo mundo sai.");
    }).catch(() => {});
  }

  function alternarTema(key) {
    setEscolhidos((atual) =>
      atual.includes(key) ? atual.filter((k) => k !== key) : [...atual, key]
    );
  }

  async function criar() {
    setErro("");
    if (nome.trim().length < 3) return setErro("Dê um nome pra sala (mínimo 3 letras).");
    if (escolhidos.length < 3) return setErro("Escolha pelo menos 3 temas.");
    if (comSenha && senha.trim().length < 3) {
      return setErro("Defina uma senha de pelo menos 3 caracteres — ou escolha sala livre.");
    }
    setCriando(true);
    try {
      const { data } = await api.post("/salas-privadas/criar", {
        nome: nome.trim(),
        senha: comSenha ? senha.trim() : "",
        themeKeys: escolhidos,
        answerSeconds: segundos,
        maxPlayers: maxJogadores,
      });
      navigate(`/jogos/stop/${data.roomId}`);
    } catch (e) {
      setErro(e.response?.data?.error || "Erro ao criar a sala.");
    } finally {
      setCriando(false);
    }
  }

  async function entrar(sala, senhaInformada = "") {
    setErro("");
    try {
      const { data } = await api.post("/salas-privadas/entrar", {
        roomId: sala.roomId,
        senha: senhaInformada,
      });
      navigate(`/jogos/stop/${data.roomId}`);
    } catch (e) {
      setErro(e.response?.data?.error || "Não foi possível entrar.");
      carregarSalas();
    }
  }

  function clicarSala(sala) {
    setErro("");
    if (sala.temSenha) {
      setPedindoSenha(sala);
      setSenhaDigitada("");
    } else {
      entrar(sala);
    }
  }

  const normais = temas.filter((t) => !t.zoeira);
  const zoeira = temas.filter((t) => t.zoeira);

  return (
    <div>
      <Seo title="Salas Privadas — Stop" description="Crie uma sala de Stop com os temas que quiser e chame seus amigos." />

      <div className="hero-banner" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="hero-title">🔒 Salas Privadas</h1>
          <p className="hero-subtitle">
            Monte uma sala do seu jeito: escolha os temas, o tempo e um nome. Aqui quem valida
            as palavras são os próprios jogadores — nada de glossário, vale o que a mesa aceitar.
          </p>
        </div>
      </div>

      <div className="privada-abas">
        <button
          className={`privada-aba ${aba === "entrar" ? "privada-aba-ativa" : ""}`}
          onClick={() => setAba("entrar")}
        >
          Salas abertas ({salas.length})
        </button>
        <button
          className={`privada-aba ${aba === "criar" ? "privada-aba-ativa" : ""}`}
          onClick={() => setAba("criar")}
        >
          Criar sala
        </button>
      </div>

      {erro && <div className="error-msg" style={{ marginTop: 14 }}>{erro}</div>}

      {aba === "entrar" ? (
        <div className="card" style={{ marginTop: 16 }}>
          {salas.length === 0 ? (
            <p style={{ color: "var(--text-dim)", textAlign: "center", padding: "24px 0" }}>
              Nenhuma sala aberta no momento. Que tal criar a primeira?
            </p>
          ) : (
            <div className="privada-lista">
              {salas.map((s) => (
                <button key={s.roomId} className="privada-sala" onClick={() => clicarSala(s)}>
                  <div className="privada-sala-topo">
                    <span className="privada-sala-nome">
                      <span title={s.temSenha ? "Precisa de senha" : "Sala livre"}>
                        {s.temSenha ? "🔒 " : "🔓 "}
                      </span>
                      {s.nome}
                    </span>
                    <span className={`privada-sala-vagas ${s.jogadores === 0 ? "privada-sala-vazia" : ""}`}>
                      {s.jogadores === 0 ? "esperando" : `${s.jogadores}/${s.maxPlayers}`}
                    </span>
                  </div>
                  <div className="privada-sala-info">
                    por {s.criador} · {s.answerSeconds}s por rodada · {s.temas.length} temas
                  </div>
                  <div className="privada-sala-temas">{s.temas.slice(0, 5).join(" · ")}
                    {s.temas.length > 5 && ` +${s.temas.length - 5}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="card" style={{ marginTop: 16 }}>
            <h2>1. Nome e acesso</h2>
            <input
              placeholder="Nome da sala (ex: Galera do trampo)"
              value={nome}
              onChange={(e) => setNome(e.target.value.slice(0, 30))}
              maxLength={30}
            />

            <div className="privada-tipo">
              <button
                type="button"
                className={`privada-tipo-opcao ${!comSenha ? "privada-tipo-on" : ""}`}
                onClick={() => { setComSenha(false); setSenha(""); }}
              >
                <span className="privada-tipo-icone">🔓</span>
                <span className="privada-tipo-nome">Livre</span>
                <span className="privada-tipo-desc">Qualquer um entra pela lista</span>
              </button>
              <button
                type="button"
                className={`privada-tipo-opcao ${comSenha ? "privada-tipo-on" : ""}`}
                onClick={() => setComSenha(true)}
              >
                <span className="privada-tipo-icone">🔒</span>
                <span className="privada-tipo-nome">Com senha</span>
                <span className="privada-tipo-desc">Só quem você convidar</span>
              </button>
            </div>

            {comSenha && (
              <input
                placeholder="Defina a senha da sala"
                value={senha}
                onChange={(e) => setSenha(e.target.value.slice(0, 20))}
                maxLength={20}
                style={{ marginTop: 12 }}
              />
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2>2. Escolha os temas ({escolhidos.length})</h2>
            <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
              De 3 a 12 temas. A cada rodada, 6 deles são sorteados.
            </p>
            <div className="privada-temas">
              {normais.map((t) => (
                <button
                  key={t.key}
                  className={`privada-tema ${escolhidos.includes(t.key) ? "privada-tema-on" : ""}`}
                  onClick={() => alternarTema(t.key)}
                  type="button"
                >
                  {t.name}
                </button>
              ))}
            </div>

            {zoeira.length > 0 && (
              <>
                <h3 style={{ marginTop: 20, fontSize: 15 }}>🤣 Temas de zoeira</h3>
                <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: -6 }}>
                  Como a validação aqui é por voto, esses temas subjetivos funcionam bem.
                </p>
                <div className="privada-temas">
                  {zoeira.map((t) => (
                    <button
                      key={t.key}
                      className={`privada-tema privada-tema-zoeira ${escolhidos.includes(t.key) ? "privada-tema-on" : ""}`}
                      onClick={() => alternarTema(t.key)}
                      type="button"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2>3. Ajuste a partida</h2>
            <label className="privada-label">
              Tempo por rodada: <strong>{segundos} segundos</strong>
            </label>
            <input
              type="range" min={20} max={90} step={5}
              value={segundos}
              onChange={(e) => setSegundos(Number(e.target.value))}
              className="privada-range"
            />
            <label className="privada-label" style={{ marginTop: 18 }}>
              Máximo de jogadores: <strong>{maxJogadores}</strong>
            </label>
            <input
              type="range" min={2} max={16}
              value={maxJogadores}
              onChange={(e) => setMaxJogadores(Number(e.target.value))}
              className="privada-range"
            />
          </div>

          <button
            className="btn"
            style={{ width: "100%", marginTop: 16, fontSize: 16, padding: 14 }}
            onClick={criar}
            disabled={criando || escolhidos.length < 3 || nome.trim().length < 3 || (comSenha && senha.trim().length < 3)}
          >
            {criando ? "Criando..." : "🎲 Criar sala"}
          </button>
          <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 10, textAlign: "center" }}>
            Salas privadas não valem pontos pra ranking nenhum — nem mensal, nem vitalício.
          </p>
        </>
      )}

      {pedindoSenha && (
        <div className="modal-overlay" onClick={() => setPedindoSenha(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPedindoSenha(null)}>✕</button>
            <h3>🔒 {pedindoSenha.nome}</h3>
            <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
              Essa sala é protegida. Peça a senha pra quem te chamou.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                entrar(pedindoSenha, senhaDigitada);
              }}
            >
              <input
                placeholder="Senha da sala"
                value={senhaDigitada}
                onChange={(e) => setSenhaDigitada(e.target.value)}
                autoFocus
              />
              <button className="btn" type="submit" style={{ width: "100%" }}>
                Entrar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
