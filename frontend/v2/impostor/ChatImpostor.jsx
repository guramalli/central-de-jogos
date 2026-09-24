import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CampoChat, TextoComMarcacoes } from "../Chat.jsx";

// CHAT DA SALA do Impostor. Mesmo campo dos outros chats da v2 (emojis e
// @menção), com a lista nas classes v2-chat/v2-msg repintadas no visual do
// Impostor (impostor.css). O servidor manda cada mensagem em "impostor-chat"
// e o histórico ao entrar ("impostor-chat-historico") — ver Impostor.jsx.
//
// Rolagem: só desce sozinho se a pessoa já está perto do fim (ou se a
// mensagem é dela) — quem subiu pra reler não é puxado de volta. Rola a
// CAIXA (scrollTop), nunca a página.
//
// Computador largo: coluna ao lado do jogo. Telas menores: embaixo, e dá pra
// recolher (lembrado no aparelho).
const PERTO_DO_FIM = 80; // px
const CHAVE_RECOLHIDO = "imp-chat-recolhido";

function lerRecolhido() {
  try { return localStorage.getItem(CHAVE_RECOLHIDO) === "1"; } catch { return false; }
}

const hora = (ms) => new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export default function ChatImpostor({ mensagens, estado, pedir }) {
  const [recolhido, setRecolhido] = useState(lerRecolhido);
  const [aviso, setAviso] = useState("");
  const [novas, setNovas] = useState(0);
  const listaRef = useRef(null);
  const pertoDoFim = useRef(true);
  const vistas = useRef(mensagens.length);
  const euId = estado.euId;
  const meuNick = estado.jogadores.find((j) => j.id === euId)?.nickname || "";
  const nicks = estado.jogadores.filter((j) => !j.bot).map((j) => j.nickname);

  function alternar() {
    setRecolhido((r) => {
      try { localStorage.setItem(CHAVE_RECOLHIDO, r ? "0" : "1"); } catch { /* sem storage: só não lembra */ }
      return !r;
    });
  }

  // Mensagem nova: desce se estava no fim (ou se fui eu); recolhido, conta.
  const ultima = mensagens.at(-1);
  useLayoutEffect(() => {
    const el = listaRef.current;
    if (recolhido || !el) {
      setNovas((n) => n + Math.max(0, mensagens.length - vistas.current));
    } else if (pertoDoFim.current || ultima?.uid === euId) {
      el.scrollTop = el.scrollHeight;
      pertoDoFim.current = true;
    }
    vistas.current = mensagens.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultima?.id, mensagens.length]);

  // Abriu o chat: zera o contador e vai pro fim.
  useLayoutEffect(() => {
    if (recolhido) return;
    setNovas(0);
    const el = listaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    pertoDoFim.current = true;
  }, [recolhido]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  function rolou() {
    const el = listaRef.current;
    if (el) pertoDoFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < PERTO_DO_FIM;
  }

  async function enviar(texto) {
    const r = await pedir("impostor-chat", { texto }, { avisoNoTopo: false });
    setAviso(r?.erro || "");
  }

  return (
    <aside className={`v2-chat imp-chat ${recolhido ? "recolhido" : ""}`} aria-label="Chat da sala">
      <button type="button" className="imp-chat-cabeca" onClick={alternar} aria-expanded={!recolhido} aria-controls="imp-chat-corpo">
        <span className="imp-rotulo">CHAT DA SALA</span>
        {recolhido && novas > 0 && <span className="imp-chat-novas">{novas > 99 ? "99+" : novas} nova{novas === 1 ? "" : "s"}</span>}
        <span className="imp-chat-seta" aria-hidden="true">{recolhido ? "▴" : "▾"}</span>
      </button>
      {!recolhido && (
        <div id="imp-chat-corpo" className="imp-chat-corpo">
          <div className="v2-chat-lista imp-chat-lista" ref={listaRef} onScroll={rolou} role="log" aria-live="polite">
            {mensagens.length === 0 && <p className="imp-chat-vazio">Ninguém falou nada ainda. Desconfie em voz alta! 🕵️</p>}
            {mensagens.map((m) => (
              <div key={m.id} className={`v2-msg ${m.uid === euId ? "minha" : ""}`} style={{ "--imp-cor-jogador": m.cor }}>
                <b className="imp-chat-nick">{m.nick}</b>{" "}
                <span><TextoComMarcacoes texto={m.texto} participantes={nicks} meuNick={meuNick} /></span>
                <small className="v2-msg-hora">{hora(m.em)}</small>
              </div>
            ))}
          </div>
          {aviso && <p className="imp-chat-aviso" role="alert">{aviso}</p>}
          <CampoChat id="imp-chat-campo" aoEnviar={enviar} participantes={nicks} meuNick={meuNick} placeholder="Conversar com a sala…" maxLength={300} />
        </div>
      )}
    </aside>
  );
}
