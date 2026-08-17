import { useState, useRef, useEffect } from "react";
import EmojiPicker from "./EmojiPicker.jsx";

// Paleta de cores pra diferenciar cada jogador no chat — sempre a mesma cor
// pra mesma pessoa (calculada a partir do id dela), separando visualmente
// as falas dos jogadores das mensagens de histórico/sistema.
const NICK_COLORS = [
  "#ff6b6b", "#4ecdc4", "#ffd166", "#a78bfa", "#f78fb3",
  "#6bcf7f", "#ffa07a", "#5dade2", "#f4a261", "#c084fc",
];

function colorForUser(id) {
  if (!id) return "#ffb86f";
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return NICK_COLORS[Math.abs(hash) % NICK_COLORS.length];
}

// Mensagem de sistema com o título do jogador pintado na cor do material da
// medalha (bronze/prata/ouro).
//
// Em vez de remontar a frase aqui, procura o trecho "(título)" DENTRO do
// texto que o servidor mandou e envolve só ele num span. Assim a frase
// continua sendo responsabilidade do backend — o que faz isto funcionar
// igual pro "entrou na sala" padrão e pra saudação premium, sem duplicar
// nenhum texto no cliente.
//
// Qualquer imprevisto (sem título, nível desconhecido, trecho não
// encontrado) cai no texto puro, que já vem completo e correto.
function TextoDeSistema({ mensagem, destaque }) {
  if (!destaque?.texto || !destaque?.nivel) return mensagem;
  const marca = `(${destaque.texto})`;
  const corte = mensagem.indexOf(marca);
  if (corte === -1) return mensagem;
  return (
    <>
      {mensagem.slice(0, corte)}
      <span className={`chat-titulo-entrada titulo-nivel-${destaque.nivel}`}>{marca}</span>
      {mensagem.slice(corte + marca.length)}
    </>
  );
}

function formatTime(at) {
  if (!at) return "";
  return new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// showTimestamp é opcional — só o Chat Geral (praça) usa isso por enquanto;
// os chats de dentro das salas de jogo continuam sem horário, do jeito que
// já estavam, pra não mudar nada ali sem ter sido pedido.
// canModerate + onDelete são opcionais: quando quem está vendo é moderador
// ou admin, aparece um "x" ao lado de cada mensagem de jogador pra apagar.
export default function Chat({ messages, onSend, showTimestamp = false, canModerate = false, onDelete }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    // Rola SÓ a caixa de mensagens, mexendo direto na posição dela — o
    // scrollIntoView (usado antes) podia arrastar a página inteira junto,
    // o que jogava a página inicial pra baixo assim que o chat carregava.
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="chat-box">
      <div className="chat-messages" ref={listRef}>
        {messages.map((m, i) =>
          m.system ? (
            <div
              key={m.id || i}
              className={`chat-system-msg ${m.bold ? "chat-system-msg-bold" : ""} ${m.success ? "chat-system-msg-success" : ""} ${m.promotion ? "chat-system-msg-promotion" : ""} ${m.atividade ? "chat-msg-atividade" : ""}`}
            >
              — <TextoDeSistema mensagem={m.message} destaque={m.tituloDestaque} /> —
            </div>
          ) : (
            <div key={m.id || i} className="chat-user-msg">
              {canModerate && m.id && onDelete && (
                <button
                  type="button"
                  className="chat-delete-btn"
                  title="Apagar mensagem"
                  onClick={() => {
                    if (window.confirm(`Apagar a mensagem de ${m.nickname}?`)) onDelete(m.id);
                  }}
                >
                  ×
                </button>
              )}
              {showTimestamp && <span className="chat-msg-time">{formatTime(m.at)}</span>}
              {/* Tag do clã herda a cor do nickname: identifica o grupo sem
                  poluir o chat com mais uma cor disputando atenção. */}
              {m.clanTag && (
                <span className="chat-clan-tag" style={{ color: colorForUser(m.userId || m.nickname) }}>
                  [{m.clanTag}]
                </span>
              )}
              <strong style={{ color: colorForUser(m.userId || m.nickname) }}>{m.nickname}:</strong>{" "}
              {m.message}
            </div>
          )
        )}
        <div ref={endRef} />
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <EmojiPicker onSelect={(emoji) => setText((t) => t + emoji)} />
        <input placeholder="Digite uma mensagem..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn" type="submit">Enviar</button>
      </form>
    </div>
  );
}
