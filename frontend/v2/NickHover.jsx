import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "./api.js";
import { buscarPerfil, dadosDoJogo } from "./perfil.js";
import Avatar from "./Avatar.jsx";
import { irParaPagina, linkDaPagina } from "./App.jsx";

// Balão de stats ao passar o mouse no nick (no toque: abre ao tocar).
// Mesmo conteúdo do hover do site clássico: foto/medalha, posição no
// ranking, pontos do mês e vitalícios, quanto falta pra próxima patente,
// clã, aproveitamento na sala, adicionar amigo, convidar pro clã e perfil.
export default function NickHover({ userId, nickname, meuId, roomId, gameKey = "quiz", children }) {
  const ancoraRef = useRef(null);
  const fecharRef = useRef(null);
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, cima: false });
  const [perfil, setPerfil] = useState(null);
  const [amizade, setAmizade] = useState(null);
  const [cla, setCla] = useState(null);
  const souEu = userId === meuId;

  function abrir() {
    clearTimeout(fecharRef.current);
    const r = ancoraRef.current?.getBoundingClientRect();
    if (r) {
      const alto = 300;
      const cima = window.innerHeight - r.bottom < alto && r.top > alto;
      const meia = 125;
      const centro = Math.min(Math.max(r.left + r.width / 2, meia + 8), window.innerWidth - meia - 8);
      setPos({ top: cima ? r.top - 8 : r.bottom + 8, left: centro, cima });
    }
    setAberto(true);
    buscarPerfil(userId, souEu ? 20000 : 120000).then((p) => p && setPerfil(p));
  }
  const agendarFechar = () => { fecharRef.current = setTimeout(() => setAberto(false), 160); };

  async function addAmigo() {
    setAmizade("enviando");
    try { await api.post("/friends/request", { targetUserId: userId }); setAmizade("ok"); }
    catch { setAmizade("erro"); }
  }
  async function convidarCla() {
    setCla("enviando");
    try { await api.post("/clans/invite", { userId }); setCla("ok"); }
    catch { setCla("erro"); }
  }

  const { mensal, vitalicio } = dadosDoJogo(perfil, gameKey);
  const aprov = roomId ? perfil?.quizAccuracy?.find((a) => a.roomId === roomId) : null;

  return (
    <span
      ref={ancoraRef}
      className="v2-nick-hover"
      onMouseEnter={abrir}
      onMouseLeave={agendarFechar}
      onClick={(e) => { e.stopPropagation(); aberto ? setAberto(false) : abrir(); }}
    >
      {children || nickname}
      {aberto && createPortal(
        <div
          className={`v2-balao ${pos.cima ? "cima" : ""}`}
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={abrir}
          onMouseLeave={agendarFechar}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="v2-balao-topo">
            <Avatar userId={userId} nickname={nickname} tamanho={58} borda />
            <div className="v2-balao-nome">
              <b>{nickname}</b>
              {perfil?.medalhaNoLugarDaFoto && perfil?.tituloExibido && <span className="v2-balao-titulo">{perfil.tituloExibido}</span>}
              {mensal?.rank?.name && (
                <span className="v2-balao-patente">
                  {mensal.rank.icon && <img src={mensal.rank.icon} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                  {mensal.rank.name}
                </span>
              )}
            </div>
          </div>
          {!perfil ? (
            <div className="v2-balao-carregando">Carregando…</div>
          ) : (
            <>
              {mensal?.position && <div className="v2-balao-posicao">{mensal.position}º no ranking mensal</div>}
              <div className="v2-balao-numeros">
                <div><b>{(mensal?.points || 0).toLocaleString("pt-BR")}</b><span>no mês</span></div>
                <div><b>{(vitalicio?.points || 0).toLocaleString("pt-BR")}</b><span>vitalícios</span></div>
                {aprov && <div><b>{aprov.percent}%</b><span>nesta sala</span></div>}
              </div>
              <div className="v2-balao-linha">
                {mensal?.nextRank
                  ? `Faltam ${mensal.nextRank.pointsNeeded.toLocaleString("pt-BR")} pra ${mensal.nextRank.name}`
                  : mensal ? "Patente máxima!" : "Ainda não pontuou este mês"}
              </div>
              <div className="v2-balao-linha">{perfil.clan ? `Clã ${perfil.clan.name} [${perfil.clan.tag}]` : "Sem clã"}</div>
              {!souEu && !perfil.clan && perfil.viewerClan && (
                cla === "ok" ? <div className="v2-balao-ok">Convite de clã enviado!</div>
                : cla === "erro" ? <div className="v2-balao-erro">Não foi possível convidar.</div>
                : <button className="v2-balao-botao" onClick={convidarCla} disabled={cla === "enviando"}>Convidar pro [{perfil.viewerClan.tag}]</button>
              )}
              {!souEu && (
                amizade === "ok" || perfil.friendshipStatus === "pending_sent" ? <div className="v2-balao-ok">Pedido de amizade enviado!</div>
                : amizade === "erro" ? <div className="v2-balao-erro">Não foi possível enviar.</div>
                : perfil.friendshipStatus === "friends" ? <button className="v2-balao-botao" onClick={() => irParaPagina("amigos", { id: userId })}>Mandar mensagem</button>
                : perfil.friendshipStatus === "pending_received" ? <div className="v2-balao-linha">Te mandou um pedido — veja em Amigos</div>
                : <button className="v2-balao-botao" onClick={addAmigo} disabled={amizade === "enviando"}>+ Adicionar amigo</button>
              )}
              <a className="v2-balao-perfil" href={linkDaPagina("jogador", { id: userId })} onClick={(e) => { e.preventDefault(); irParaPagina("jogador", { id: userId }); }}>Ver perfil completo →</a>
            </>
          )}
        </div>,
        document.body
      )}
    </span>
  );
}
