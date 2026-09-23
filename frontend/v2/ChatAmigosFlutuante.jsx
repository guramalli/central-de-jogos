import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import Avatar from "./Avatar.jsx";
import { ModalConversa } from "./Amigos.jsx";

// Botão flutuante de "conversar com amigos" pra usar DENTRO das salas de
// jogo (Stop, Quiz, Acromania) — antes, pra falar com um amigo era preciso
// sair do jogo e ir pra tela de Amigos. Reaproveita o ModalConversa (já
// usado no painel admin) pra não duplicar a UI de conversa — só constrói
// a parte que faltava: o botão e a lista pra escolher com quem falar.
export default function ChatAmigosFlutuante({ usuario }) {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState(null);
  const [conversas, setConversas] = useState([]);
  const [aberta, setAberta] = useState(null);
  const [naoLidas, setNaoLidas] = useState(0);
  const caixaRef = useRef(null);

  // Contador do balãozinho: leve (só o número, rota /avisos — a mesma que
  // o menu do topo já usa), roda o tempo todo, mesmo com o painel fechado.
  useEffect(() => {
    let vivo = true;
    const buscar = () => {
      if (document.hidden) return;
      api.get("/avisos").then(({ data }) => vivo && setNaoLidas(data?.mensagens || 0)).catch(() => {});
    };
    buscar();
    const t = setInterval(buscar, 60000);
    window.addEventListener("v2-mensagens-lidas", buscar);
    return () => { vivo = false; clearInterval(t); window.removeEventListener("v2-mensagens-lidas", buscar); };
  }, []);

  // Lista completa de amigos: só busca quando o painel é aberto, não fica
  // recarregando à toa enquanto a pessoa está jogando.
  useEffect(() => {
    if (!aberto) return;
    let vivo = true;
    Promise.all([api.get("/friends"), api.get("/friends/conversas")])
      .then(([a, c]) => { if (vivo) { setDados(a.data); setConversas(c.data || []); } })
      .catch(() => vivo && setDados((d) => d || { friends: [] }));
    return () => { vivo = false; };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => caixaRef.current && !caixaRef.current.contains(e.target) && setAberto(false);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  const porUsuario = new Map(conversas.map((c) => [c.userId, c]));
  const lista = (dados?.friends || [])
    .map((f) => ({ ...f, ...(porUsuario.get(f.userId) || {}) }))
    .sort((a, b) => {
      if ((a.naoLidas > 0) !== (b.naoLidas > 0)) return a.naoLidas > 0 ? -1 : 1;
      if (a.quando && b.quando) return new Date(b.quando) - new Date(a.quando);
      if (!!a.quando !== !!b.quando) return a.quando ? -1 : 1;
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.nickname.localeCompare(b.nickname, "pt-BR");
    });

  return (
    <div className="v2-chat-flutuante" ref={caixaRef}>
      <button className="v2-chat-flutuante-botao" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} aria-label="Conversar com amigos">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" /></svg>
        {naoLidas > 0 && <span className="v2-bolinha-contador">{naoLidas}</span>}
      </button>
      {aberto && (
        <div className="v2-chat-flutuante-painel">
          <div className="v2-chat-flutuante-cabeca">
            <b>Amigos</b>
            <button className="v2-botao-pequeno" onClick={() => setAberto(false)}>Fechar</button>
          </div>
          {!dados && <div className="v2-carregando">Carregando…</div>}
          {dados && lista.length === 0 && <div className="v2-vazio">Você ainda não tem amigos adicionados.</div>}
          <div className="v2-amigos">
            {lista.map((f) => (
              <button key={f.userId} className={`v2-amigo ${f.naoLidas > 0 ? "nova" : ""}`} onClick={() => { setAberta(f); setAberto(false); }}>
                <span className="v2-amigo-foto">
                  <Avatar userId={f.userId} nickname={f.nickname} tamanho={36} />
                  <i className={f.online ? "on" : ""} aria-label={f.online ? "online" : "offline"} />
                </span>
                <span className="v2-amigo-texto">
                  <b>{f.nickname}</b>
                  <span>{f.ultima ? `${f.ultimaMinha ? "Você: " : ""}${f.ultima}` : f.online ? "online agora" : "offline"}</span>
                </span>
                {f.naoLidas > 0 && <span className="v2-bolinha-contador">{f.naoLidas}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      {aberta && (
        <ModalConversa
          amigo={aberta}
          usuario={usuario}
          aoFechar={() => setAberta(null)}
          aoLer={() => { setNaoLidas(0); window.dispatchEvent(new Event("v2-mensagens-lidas")); }}
        />
      )}
    </div>
  );
}
