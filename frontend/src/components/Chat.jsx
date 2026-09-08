import { useState, useRef, useEffect , memo} from "react";
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
// Pinta as marcações "@nick" dentro da mensagem.
//
// Só destaca quem REALMENTE está na conversa: sem essa checagem, um e-mail
// ou um "@ 15h" viraria marcação colorida. A lista vem de quem está na sala
// (ou online, no chat geral).
//
// A comparação ignora acento e caixa, porque ninguém digita "@JoÃo_Válter"
// exatamente como está cadastrado.
function normalizarNick(n) {
  return String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function TextoComMarcacoes({ texto, participantes, meuNick }) {
  if (!texto || !participantes || participantes.length === 0) return texto;

  const porNick = new Map(participantes.map((n) => [normalizarNick(n), n]));
  const eu = normalizarNick(meuNick);

  // Quebra em pedaços, guardando o que veio antes de cada @palavra.
  const partes = [];
  const regex = /@([A-Za-zÀ-ÿ0-9_]{3,20})/g;
  let ultimo = 0;
  let m;
  while ((m = regex.exec(texto)) !== null) {
    const alvo = porNick.get(normalizarNick(m[1]));
    if (!alvo) continue; // "@" que não é gente: deixa como texto
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    partes.push(
      <span
        key={`${m.index}-${alvo}`}
        className={`chat-mencao${normalizarNick(alvo) === eu ? " chat-mencao-eu" : ""}`}
      >
        @{alvo}
      </span>
    );
    ultimo = m.index + m[0].length;
  }
  if (partes.length === 0) return texto;
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return <>{partes}</>;
}

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
function Chat({
  messages,
  onSend,
  showTimestamp = false,
  canModerate = false,
  onDelete,
  // Quem está na conversa: usado pra validar e pra autocompletar as
  // marcações. Sem lista, o chat funciona igual a antes.
  participantes = [],
  meuNick = null,
}) {
  const [text, setText] = useState("");
  // Sugestões de marcação. `indice` é qual está selecionada pelas setas.
  const [sugestoes, setSugestoes] = useState([]);
  const [indiceSugestao, setIndiceSugestao] = useState(0);
  const inputRef = useRef(null);
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

  // Procura um "@parcial" logo antes do cursor. Só sugere enquanto a pessoa
  // ainda está escrevendo a marcação — depois de um espaço, para.
  function atualizarSugestoes(valor) {
    const trecho = valor.slice(0, inputRef.current?.selectionStart ?? valor.length);
    const m = /@([A-Za-zÀ-ÿ0-9_]*)$/.exec(trecho);
    if (!m || participantes.length === 0) {
      setSugestoes([]);
      return;
    }
    const busca = normalizarNick(m[1]);
    const achados = participantes
      .filter((n) => normalizarNick(n) !== normalizarNick(meuNick)) // não marca a si mesmo
      .filter((n) => normalizarNick(n).startsWith(busca))
      .slice(0, 6);
    setSugestoes(achados);
    setIndiceSugestao(0);
  }

  // Troca o "@parcial" pelo nick inteiro, sem desmontar o campo: no iOS,
  // campo que desmonta fecha o teclado e ele não reabre sozinho.
  function aplicarSugestao(nick) {
    const pos = inputRef.current?.selectionStart ?? text.length;
    const antes = text.slice(0, pos).replace(/@([A-Za-zÀ-ÿ0-9_]*)$/, `@${nick} `);
    const novo = antes + text.slice(pos);
    setText(novo);
    setSugestoes([]);
    // Devolve o foco e põe o cursor logo depois do nick inserido.
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(antes.length, antes.length);
    });
  }

  function aoTeclar(e) {
    if (sugestoes.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceSugestao((i) => (i + 1) % sugestoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceSugestao((i) => (i - 1 + sugestoes.length) % sugestoes.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      // Enter com a lista aberta completa a marcação em vez de enviar —
      // senão a mensagem sairia pela metade.
      e.preventDefault();
      aplicarSugestao(sugestoes[indiceSugestao]);
    } else if (e.key === "Escape") {
      setSugestoes([]);
    }
  }

  return (
    <div className="chat-box">
      <div className="chat-messages" ref={listRef}>
        {messages.map((m, i) =>
          m.system ? (
            m.aviso ? (
              // Comunicado da administração. Sem os travessões e com caixa
              // própria: os travessões servem pra "fulano entrou na sala",
              // não pra um aviso que a pessoa precisa parar e ler.
              <div key={m.id || i} className="chat-aviso-admin">
                <TextoDeSistema mensagem={m.message} destaque={m.tituloDestaque} />
              </div>
            ) : (
            <div
              key={m.id || i}
              className={`chat-system-msg ${m.bold ? "chat-system-msg-bold" : ""} ${m.success ? "chat-system-msg-success" : ""} ${m.promotion ? "chat-system-msg-promotion" : ""} ${m.atividade ? "chat-msg-atividade" : ""}`}
            >
              — <TextoDeSistema mensagem={m.message} destaque={m.tituloDestaque} /> —
            </div>
            )
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
              <TextoComMarcacoes texto={m.message} participantes={participantes} meuNick={meuNick} />
            </div>
          )
        )}
        <div ref={endRef} />
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <EmojiPicker onSelect={(emoji) => setText((t) => t + emoji)} />
        <div className="chat-input-wrap">
          {sugestoes.length > 0 && (
            <div className="chat-sugestoes">
              {sugestoes.map((n, i) => (
                <button
                  key={n}
                  type="button"
                  className={`chat-sugestao${i === indiceSugestao ? " chat-sugestao-ativa" : ""}`}
                  // onMouseDown e não onClick: o clique tira o foco do campo
                  // antes do onClick disparar, e no celular isso fecha o
                  // teclado antes de inserir o nick.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    aplicarSugestao(n);
                  }}
                >
                  @{n}
                </button>
              ))}
            </div>
          )}
          <input
            ref={inputRef}
            placeholder="Digite uma mensagem..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              atualizarSugestoes(e.target.value);
            }}
            onKeyDown={aoTeclar}
            onBlur={() => setTimeout(() => setSugestoes([]), 120)}
          />
        </div>
        <button className="btn" type="submit">Enviar</button>
      </form>
    </div>
  );
}

// MEMOIZADO DE PROPÓSITO.
//
// A sala manda um "tick" por segundo pra mover o cronômetro, e isso
// redesenhava a página inteira — incluindo as 100 mensagens do chat, cada uma
// passando pela marcação de @. Uma vez por segundo, pra nada: o que mudou foi
// só o relógio.
//
// Isto só funciona se as props mantiverem a IDENTIDADE entre renders. Por
// isso as páginas envolvem `participantes` em useMemo e os callbacks em
// useCallback — sem isso, cada render cria um array e funções novos, o memo
// nunca casa e o ganho é zero.
export default memo(Chat);
