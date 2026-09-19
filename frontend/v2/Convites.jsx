import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { irPara, irParaStop } from "./App.jsx";

// BOTÃO "CONVIDAR": copiar/compartilhar o link da sala + chamar um amigo
// que já está no site (evento convidar-para-sala, mesmo do clássico — sai
// pela conexão DESTA sala, senão o servidor convida pra sala errada).
export function BotaoConvidar({ socket, roomId, nomeSala, jogo = "quiz" }) {
  const [aberto, setAberto] = useState(false);
  const [amigos, setAmigos] = useState(null);
  const [aviso, setAviso] = useState(null);
  const caixaRef = useRef(null);
  const link = `${window.location.origin}/v2/?${jogo === "stop" ? "stop" : "sala"}=${roomId}`;

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => caixaRef.current && !caixaRef.current.contains(e.target) && setAberto(false);
    document.addEventListener("mousedown", fora);
    api.get("/friends").then(({ data }) => setAmigos(data?.friends || [])).catch(() => setAmigos([]));
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  useEffect(() => {
    if (!socket) return;
    const res = ({ ok, erro }) => setAviso(ok ? { ok: true, t: "Convite enviado!" } : { ok: false, t: erro || "Não foi possível convidar." });
    socket.on("convite-resultado", res);
    return () => socket.off("convite-resultado", res);
  }, [socket]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  async function copiar() {
    const texto = `Vem jogar ${jogo === "stop" ? "Stop" : "Quiz"} comigo, tô na ${nomeSala || "sala"}! ${link}`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) await navigator.share({ text: texto });
      else { await navigator.clipboard.writeText(texto); setAviso({ ok: true, t: "Link copiado!" }); }
    } catch {}
  }

  return (
    <div className="v2-convidar" ref={caixaRef}>
      <button className="v2-botao-topo" onClick={() => setAberto((a) => !a)} aria-expanded={aberto}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M19 8v6M16 11h6" /></svg>
        <span>Convidar</span>
      </button>
      {aberto && (
        <div className="v2-convidar-caixa">
          <button className="v2-convidar-link" onClick={copiar}>Copiar link da sala</button>
          <div className="v2-convidar-titulo">Amigos online</div>
          {amigos === null && <div className="v2-convidar-vazio">Carregando…</div>}
          {amigos && amigos.filter((a) => a.online).length === 0 && <div className="v2-convidar-vazio">Nenhum amigo online agora.</div>}
          {amigos && amigos.filter((a) => a.online).map((a) => (
            <div key={a.userId} className="v2-convidar-amigo">
              <span className="v2-ponto-vivo" />
              <span className="v2-convidar-nick">{a.nickname}</span>
              <button onClick={() => socket?.emit("convidar-para-sala", { amigoId: a.userId })}>Chamar</button>
            </div>
          ))}
        </div>
      )}
      {aviso && <div className={`v2-toast-mini ${aviso.ok ? "ok" : "erro"}`}>{aviso.t}</div>}
    </div>
  );
}

// AVISO DE CONVITE RECEBIDO. Chega em qualquer conexão da pessoa (sala
// pessoal user:<id>). Quiz e Stop abrem na v2; Acromania e as salas
// privadas do Stop, que ainda não existem aqui, abrem no clássico.
export function ConviteRecebido({ socket }) {
  const [convite, setConvite] = useState(null);
  useEffect(() => {
    if (!socket) return;
    const chegou = (c) => setConvite(c);
    socket.on("convite-de-sala", chegou);
    return () => socket.off("convite-de-sala", chegou);
  }, [socket]);
  useEffect(() => {
    if (!convite) return;
    const t = setTimeout(() => setConvite(null), 20000);
    return () => clearTimeout(t);
  }, [convite]);
  if (!convite) return null;

  const entrar = () => {
    setConvite(null);
    // Salas privadas do Stop (votação da mesa) ainda não existem na v2.
    if (convite.jogo === "quiz") irPara(convite.sala);
    else if (convite.jogo === "stop" && !String(convite.sala).startsWith("stop-privada-")) irParaStop(convite.sala);
    else if (convite.jogo === "stop") window.location.href = `/jogos/stop/privada?sala=${convite.sala}`;
    else window.location.href = `/jogos/${convite.jogo}/${convite.sala}`;
  };

  return (
    <div className="v2-convite" role="alert">
      <div><b>{convite.de}</b> te chamou pra jogar em <b>{convite.salaLabel}</b></div>
      <div className="v2-convite-acoes">
        <button className="v2-botao v2-botao-amarelo" onClick={entrar}>Entrar</button>
        <button className="v2-botao v2-botao-contorno" onClick={() => setConvite(null)}>Agora não</button>
      </div>
    </div>
  );
}
