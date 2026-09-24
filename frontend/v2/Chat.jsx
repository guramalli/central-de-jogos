import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFila, pedirFila } from "./fila.js";

// "Grudar no fim" da lista do chat. Mensagem nova (muda `chave`) rola a
// lista até o fim SE a pessoa já estava perto do fim (até FOLGA_FIM px) ou se
// a mensagem é dela (`minha`); quem subiu pra ler o histórico não é puxado.
// Mudar `forcar` (ex.: a aba do celular) sempre rola até o fim. Rola SÓ a
// caixa (scrollTop), nunca scrollIntoView — isso arrastava a página inteira.
// Também segue colada quando a caixa muda de tamanho (grade do multi-sala,
// abas, teclado do celular).
const FOLGA_FIM = 80;
export function useColarNoFim(ref, chave, minha = false, forcar = null) {
  const pertoRef = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const aoRolar = () => { pertoRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= FOLGA_FIM; };
    el.addEventListener("scroll", aoRolar, { passive: true });
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => { if (pertoRef.current) el.scrollTop = el.scrollHeight; });
      ro.observe(el);
    }
    return () => { el.removeEventListener("scroll", aoRolar); ro?.disconnect(); };
  }, [ref]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && (pertoRef.current || minha)) { el.scrollTop = el.scrollHeight; pertoRef.current = true; }
  }, [ref, chave, minha]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) { el.scrollTop = el.scrollHeight; pertoRef.current = true; }
  }, [ref, forcar]);
}

// PEÇAS DO CHAT da v2 — mesma lógica do chat do clássico
// (src/components/Chat.jsx e EmojiPicker.jsx):
//  - título na mensagem de entrada pintado pelo nível da medalha;
//  - @nick destacado (e com fundo quando é você);
//  - seletor de emojis e sugestões ao digitar "@".

const normalizar = (n) => String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// "👋 Guramalli (STOP Supersônico) entrou na sala." — o servidor manda o
// trecho do título e o nível (bronze | prata | ouro | campeao | lendario) em
// `tituloDestaque`; aqui só o trecho entre parênteses ganha a cor.
export function TextoSistema({ mensagem, destaque, fila }) {
  if (fila?.jogo) return <>{mensagem} <ConviteFila jogo={fila.jogo} nome={fila.nome} /></>;
  if (!destaque?.texto || !destaque?.nivel) return mensagem;
  const marca = `(${destaque.texto})`;
  const corte = String(mensagem).indexOf(marca);
  if (corte === -1) return mensagem;
  return (
    <>
      {mensagem.slice(0, corte)}
      <span className={`v2-titulo-entrada nivel-${destaque.nivel}`}>{marca}</span>
      {mensagem.slice(corte + marca.length)}
    </>
  );
}

// Convite da fila de espera no chat ("Fulano colocou o nome na fila do
// Impostor"): um botão pra quem está jogando outra coisa entrar junto, sem
// sair da sala. Quem já está nessa fila vê só a confirmação.
function ConviteFila({ jogo, nome }) {
  const { fila } = useFila();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  if (fila?.filas?.[jogo]) return <span className="v2-msg-fila-ok">✓ Seu nome está nessa fila</span>;
  async function entrar() {
    setEnviando(true);
    setErro("");
    const r = await pedirFila("fila-entrar", { jogo });
    setEnviando(false);
    if (r?.erro) setErro(r.erro);
  }
  return (
    <>
      <button type="button" className="v2-msg-fila-botao" disabled={enviando} onClick={entrar}>
        {enviando ? "Colocando…" : `Colocar meu nome na fila do ${nome || jogo}`}
      </button>
      {erro && <span className="v2-msg-fila-erro">{erro}</span>}
    </>
  );
}

// @nick vira destaque — só quando é alguém que está mesmo na sala ("@" que
// não é gente continua texto).
export function TextoComMarcacoes({ texto, participantes = [], meuNick }) {
  if (!texto || participantes.length === 0) return texto;
  const porNick = new Map(participantes.map((n) => [normalizar(n), n]));
  const eu = normalizar(meuNick);
  const partes = [];
  const regex = /@([A-Za-zÀ-ÿ0-9_]{3,20})/g;
  let ultimo = 0;
  let m;
  while ((m = regex.exec(texto)) !== null) {
    const alvo = porNick.get(normalizar(m[1]));
    if (!alvo) continue;
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    partes.push(<span key={`${m.index}-${alvo}`} className={`v2-mencao ${normalizar(alvo) === eu ? "eu" : ""}`}>@{alvo}</span>);
    ultimo = m.index + m[0].length;
  }
  if (partes.length === 0) return texto;
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return <>{partes}</>;
}

const EMOJIS = [
  { rotulo: "Reações", itens: ["😀", "😂", "😅", "😉", "😍", "😎", "🤔", "😭", "😱", "😡", "🥳", "🙄"] },
  { rotulo: "Jogo", itens: ["🎮", "🏆", "🔥", "⚡", "💯", "👑", "🎯", "🍀", "⭐", "💪", "🚀", "🎉"] },
  { rotulo: "Gestos", itens: ["👍", "👎", "👏", "🙌", "🤝", "✋", "🤞", "👋", "🙏", "❤️", "💔", "😴"] },
];

function SeletorEmoji({ aoEscolher }) {
  const [aberto, setAberto] = useState(false);
  const caixaRef = useRef(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => caixaRef.current && !caixaRef.current.contains(e.target) && setAberto(false);
    const esc = (e) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);
  return (
    <div className="v2-emoji" ref={caixaRef}>
      <button type="button" className="v2-emoji-botao" aria-label="Emojis" aria-expanded={aberto} title="Emojis" onClick={() => setAberto((a) => !a)}>😊</button>
      {aberto && (
        <div className="v2-emoji-caixa" role="dialog" aria-label="Escolher emoji">
          {EMOJIS.map((c) => (
            <div key={c.rotulo}>
              <span className="v2-emoji-rotulo">{c.rotulo}</span>
              <div className="v2-emoji-grade">
                {c.itens.map((e) => (
                  // mousedown + preventDefault: o campo não perde o foco (no
                  // celular, perder o foco fecharia o teclado).
                  <button key={e} type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => { aoEscolher(e); setAberto(false); }} aria-label={e}>{e}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Campo do chat: emojis, sugestões de @nick e botão Enviar.
export function CampoChat({ id, aoEnviar, participantes = [], meuNick, placeholder = "Mandar mensagem…", maxLength = 300, desativado = false }) {
  const [texto, setTexto] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [indice, setIndice] = useState(0);
  const campoRef = useRef(null);

  function atualizarSugestoes(valor) {
    const trecho = valor.slice(0, campoRef.current?.selectionStart ?? valor.length);
    const m = /@([A-Za-zÀ-ÿ0-9_]*)$/.exec(trecho);
    if (!m || participantes.length === 0) { setSugestoes([]); return; }
    const busca = normalizar(m[1]);
    setSugestoes(participantes.filter((n) => normalizar(n) !== normalizar(meuNick) && normalizar(n).startsWith(busca)).slice(0, 6));
    setIndice(0);
  }
  function aplicar(nick) {
    const pos = campoRef.current?.selectionStart ?? texto.length;
    const antes = texto.slice(0, pos).replace(/@([A-Za-zÀ-ÿ0-9_]*)$/, `@${nick} `);
    setTexto(antes + texto.slice(pos));
    setSugestoes([]);
    requestAnimationFrame(() => { const el = campoRef.current; if (el) { el.focus(); el.setSelectionRange(antes.length, antes.length); } });
  }
  function tecla(e) {
    if (!sugestoes.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setIndice((i) => (i + 1) % sugestoes.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIndice((i) => (i - 1 + sugestoes.length) % sugestoes.length); }
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); aplicar(sugestoes[indice]); }
    else if (e.key === "Escape") setSugestoes([]);
  }
  function enviar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || desativado) return;
    aoEnviar(t);
    setTexto("");
    setSugestoes([]);
  }
  function inserirEmoji(emoji) {
    const el = campoRef.current;
    const pos = el?.selectionStart ?? texto.length;
    const novo = texto.slice(0, pos) + emoji + texto.slice(pos);
    setTexto(novo.slice(0, maxLength));
    requestAnimationFrame(() => { if (el) { el.focus(); el.setSelectionRange(pos + emoji.length, pos + emoji.length); } });
  }

  return (
    <form className="v2-chat-form" onSubmit={enviar}>
      <SeletorEmoji aoEscolher={inserirEmoji} />
      <div className="v2-chat-campo">
        {sugestoes.length > 0 && (
          <div className="v2-sugestoes" role="listbox" aria-label="Marcar alguém">
            {sugestoes.map((n, i) => (
              <button key={n} type="button" role="option" aria-selected={i === indice} className={i === indice ? "ativa" : ""} onMouseDown={(e) => { e.preventDefault(); aplicar(n); }}>@{n}</button>
            ))}
          </div>
        )}
        <label htmlFor={id} className="v2-oculto">Mensagem</label>
        <input
          id={id}
          ref={campoRef}
          value={texto}
          onChange={(e) => { setTexto(e.target.value); atualizarSugestoes(e.target.value); }}
          onKeyDown={tecla}
          onBlur={() => setTimeout(() => setSugestoes([]), 120)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete="off"
          disabled={desativado}
        />
      </div>
      <button type="submit" className="v2-chat-enviar" aria-label="Enviar mensagem" disabled={desativado}>Enviar</button>
    </form>
  );
}
