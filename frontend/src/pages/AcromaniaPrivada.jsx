import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import Seo from "../components/Seo.jsx";

// SALAS PRIVADAS DO ACROMANIA
//
// Mesma ideia das do Stop: você cria uma sala com os tempos que quiser e
// chama quem quer jogar. Senha é opcional.
//
// NÃO VALEM RANKING, e isso é dito na tela. A partida é entre amigos, com
// tempos escolhidos a dedo — contar no ranking que paga prêmio seria abrir
// uma porta óbvia pra combinar pontos.
export default function AcromaniaPrivada() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [nome, setNome] = useState("");
  const [comSenha, setComSenha] = useState(false);
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [segEscrita, setSegEscrita] = useState(60);
  const [segVotacao, setSegVotacao] = useState(30);
  const [rodadas, setRodadas] = useState(8);
  const [maxJogadores, setMaxJogadores] = useState(8);

  const [salas, setSalas] = useState([]);
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);

  // Sala que pede senha: guarda qual foi clicada até a pessoa digitar.
  const [salaComSenha, setSalaComSenha] = useState(null);
  const [senhaDigitada, setSenhaDigitada] = useState("");

  async function carregar() {
    try {
      const { data } = await api.get("/salas-privadas/acromania");
      setSalas(data || []);
    } catch {
      // lista vazia não é erro — pode simplesmente não haver sala aberta
    }
  }

  // Veio do lobby clicando numa sala: já abre a entrada dela, em vez de
  // fazer a pessoa procurar de novo na lista.
  useEffect(() => {
    const alvo = params.get("sala");
    if (!alvo || salas.length === 0) return;
    const sala = salas.find((s) => s.roomId === alvo);
    if (!sala) return;
    if (sala.temSenha) setSalaComSenha(sala);
    else entrar(sala);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salas, params]);

  useEffect(() => {
    carregar();
    // A lista muda quando alguém cria ou esvazia uma sala. 15s é frequente o
    // bastante pra parecer vivo sem pesar.
    const t = setInterval(carregar, 15000);
    return () => clearInterval(t);
  }, []);

  async function criar(e) {
    e.preventDefault();
    setErro("");
    if (comSenha && senha.trim().length < 3) {
      setErro("A senha precisa de pelo menos 3 caracteres.");
      return;
    }
    setCriando(true);
    try {
      const { data } = await api.post("/salas-privadas/acromania/criar", {
        nome,
        senha: comSenha ? senha : "",
        writingSeconds: segEscrita,
        votingSeconds: segVotacao,
        roundsPerTurn: rodadas,
        maxPlayers: maxJogadores,
      });
      navigate(`/jogos/acromania/${data.roomId}`);
    } catch (e2) {
      setErro(e2.response?.data?.error || "Não foi possível criar a sala.");
      setCriando(false);
    }
  }

  async function entrar(sala, senhaTentativa) {
    setErro("");
    try {
      await api.post("/salas-privadas/acromania/entrar", {
        roomId: sala.roomId,
        senha: senhaTentativa || "",
      });
      navigate(`/jogos/acromania/${sala.roomId}`);
    } catch (e) {
      setErro(e.response?.data?.error || "Não foi possível entrar.");
    }
  }

  return (
    <div>
      <Seo
        title="Salas privadas do Acromania"
        description="Crie uma sala de Acromania com os tempos que quiser e jogue com quem você chamar."
      />

      <h1>Salas privadas do Acromania</h1>
      <p style={{ color: "var(--text-dim)" }}>
        Crie uma sala com os seus tempos e chame quem você quiser.{" "}
        <strong>Partidas aqui não valem pontos no ranking</strong> — é sala pra jogar
        entre amigos.
      </p>

      {erro && <div className="error-msg">{erro}</div>}

      <form onSubmit={criar}>
        {/* Mesmo formato da criação de sala do Stop: seções numeradas e os
            dois cartões de acesso lado a lado. Manter os dois jogos com a
            mesma cara evita que a pessoa tenha que reaprender a tela. */}
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
            <div className="senha-campo">
              <input
                type={verSenha ? "text" : "password"}
                placeholder="Defina a senha da sala"
                value={senha}
                onChange={(e) => setSenha(e.target.value.slice(0, 20))}
                maxLength={20}
                autoComplete="off"
              />
              <button
                type="button"
                className="senha-olho"
                onClick={() => setVerSenha((v) => !v)}
                title={verSenha ? "Esconder a senha" : "Mostrar a senha"}
              >
                <span className="material-symbols-outlined">
                  {verSenha ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h2>2. Ajuste a partida</h2>

          <label className="privada-label">
            Tempo pra escrever a frase: <strong>{segEscrita}s</strong>
          </label>
          <input
            type="range" min={20} max={180} step={5}
            value={segEscrita}
            onChange={(e) => setSegEscrita(Number(e.target.value))}
            className="privada-range"
          />

          <label className="privada-label">
            Tempo de votação: <strong>{segVotacao}s</strong>
          </label>
          <input
            type="range" min={15} max={180} step={5}
            value={segVotacao}
            onChange={(e) => setSegVotacao(Number(e.target.value))}
            className="privada-range"
          />
          <p className="privada-dica">
            {/* Mesma regra da sala oficial: o valor é piso, não teto. */}
            Este é o <strong>mínimo</strong>. Com muita gente na sala o tempo cresce
            sozinho, pra dar conta de ler todas as frases.
          </p>

          <label className="privada-label">
            Rodadas na partida: <strong>{rodadas}</strong>
          </label>
          <input
            type="range" min={3} max={20} step={1}
            value={rodadas}
            onChange={(e) => setRodadas(Number(e.target.value))}
            className="privada-range"
          />

          <label className="privada-label">
            Máximo de jogadores: <strong>{maxJogadores}</strong>
          </label>
          <input
            type="range" min={2} max={16} step={1}
            value={maxJogadores}
            onChange={(e) => setMaxJogadores(Number(e.target.value))}
            className="privada-range"
          />
        </div>

        <button className="btn" type="submit" disabled={criando} style={{ width: "100%" }}>
          {criando ? "Criando..." : "Criar sala"}
        </button>
      </form>

      <div className="card">
        <h2>Salas abertas ({salas.length})</h2>
        {salas.length === 0 && (
          <p style={{ color: "var(--text-dim)" }}>
            Nenhuma sala aberta agora. Crie a sua acima.
          </p>
        )}
        {salas.map((s) => (
          <div key={s.roomId} className="clan-list-item">
            <button
              className="clan-list-head"
              onClick={() => (s.temSenha ? setSalaComSenha(s) : entrar(s))}
            >
              <span title={s.temSenha ? "Precisa de senha" : "Sala livre"}>
                {s.temSenha ? "🔒 " : "🔓 "}
              </span>
              <span className="clan-list-name">{s.nome}</span>
              <span className="clan-list-meta">
                {s.onlineCount}/{s.maxPlayers} · {s.roundsPerTurn} rodadas · por {s.criador}
              </span>
            </button>
          </div>
        ))}
      </div>

      {salaComSenha && (
        <div className="modal-backdrop" onClick={() => setSalaComSenha(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{salaComSenha.nome}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                entrar(salaComSenha, senhaDigitada);
              }}
            >
              <input
                type="password"
                placeholder="Senha da sala"
                value={senhaDigitada}
                onChange={(e) => setSenhaDigitada(e.target.value)}
                autoComplete="off"
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
