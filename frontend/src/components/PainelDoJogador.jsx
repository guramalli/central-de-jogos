import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

// Painel do jogador no hero do Lobby: substitui os selos estáticos por
// informação VIVA sobre a própria pessoa — patente e posição no ranking de
// cada jogo (com quanto falta pra próxima patente) e o título de perfil
// mais perto de ser desbloqueado. Tudo vem de endpoints que já existem
// (/profile e /titulos), com os caches deles.
//
// Se a pessoa é nova e ainda não pontuou em nada, mostra os selos
// institucionais de antes — o painel vazio seria pior que a decoração.
const NOMES_JOGOS = { stop: "Stop", quiz: "Quiz", acromania: "Acromania" };

export default function PainelDoJogador({ userId }) {
  const [perfil, setPerfil] = useState(null);
  const [titulos, setTitulos] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let vivo = true;
    api.get(`/users/${userId}/profile`).then(({ data }) => vivo && setPerfil(data)).catch(() => {});
    api.get(`/users/${userId}/titulos`).then(({ data }) => vivo && setTitulos(data)).catch(() => {});
    return () => { vivo = false; };
  }, [userId]);

  const monthly = (perfil?.monthly || []).filter((m) => NOMES_JOGOS[m.gameKey]);

  // Entre todos os títulos com progresso, escolhe o mais perto de sair —
  // é o que dá aquela coceira de "falta pouco".
  const candidatos = [];
  for (const t of titulos?.quiz || []) {
    if (t.proximo) candidatos.push({ nome: t.proximo.nome, atual: t.acertos, alvo: t.proximo.min });
  }
  for (const t of titulos?.stop || []) {
    if (t.proximo) candidatos.push({ nome: t.proximo.nome, atual: t.stops, alvo: t.proximo.min });
  }
  const proximoTitulo = candidatos
    .filter((c) => c.atual > 0)
    .sort((a, b) => b.atual / b.alvo - a.atual / a.alvo)[0];

  // Novato sem nada ainda: mantém os selos institucionais
  if (monthly.length === 0 && !proximoTitulo) {
    return (
      <div className="lobby-hero-benefits">
        <div className="lobby-benefit">
          <span className="material-symbols-outlined lobby-benefit-icon">emoji_events</span>
          <span>Ranking mensal com premiação</span>
        </div>
        <div className="lobby-benefit">
          <span className="material-symbols-outlined lobby-benefit-icon">star</span>
          <span>Patente vitalícia por jogo</span>
        </div>
        <div className="lobby-benefit lobby-benefit-muted">
          <span className="material-symbols-outlined">group</span>
          <span>Chat e jogadores online</span>
        </div>
      </div>
    );
  }

  return (
    <div className="painel-jogador">
      {monthly.map((m) => {
        const alvo = m.nextRank ? m.points + m.nextRank.pointsNeeded : null;
        const pct = alvo ? Math.min(100, Math.round((m.points / alvo) * 100)) : 100;
        return (
          <Link to="/ranking" key={m.gameKey} className="painel-item" title="Ver ranking completo">
            <div className="painel-item-topo">
              {m.rank?.icon && <img src={m.rank.icon} alt="" className="painel-patente-icone" />}
              <div className="painel-item-textos">
                <span className="painel-item-jogo">{NOMES_JOGOS[m.gameKey]}</span>
                <span className="painel-item-principal">
                  {m.rank?.name}
                  {m.position ? ` • #${m.position} no mês` : ""}
                </span>
              </div>
              <span className="painel-item-pontos">{m.points} pts</span>
            </div>
            {m.nextRank && (
              <>
                <div className="painel-barra">
                  <div className="painel-barra-cheia" style={{ width: `${pct}%` }} />
                </div>
                <span className="painel-item-meta">
                  faltam <strong>{m.nextRank.pointsNeeded}</strong> pra {m.nextRank.name}
                </span>
              </>
            )}
          </Link>
        );
      })}

      {proximoTitulo && (
        <Link to="/perfil" className="painel-item painel-item-titulo" title="Ver todos os seus títulos">
          <div className="painel-item-topo">
            <span className="painel-titulo-medalha">🏅</span>
            <div className="painel-item-textos">
              <span className="painel-item-jogo">Próximo título</span>
              <span className="painel-item-principal">{proximoTitulo.nome}</span>
            </div>
            <span className="painel-item-pontos">
              {proximoTitulo.atual}/{proximoTitulo.alvo}
            </span>
          </div>
          <div className="painel-barra">
            <div
              className="painel-barra-cheia"
              style={{ width: `${Math.min(100, Math.round((proximoTitulo.atual / proximoTitulo.alvo) * 100))}%` }}
            />
          </div>
        </Link>
      )}
    </div>
  );
}
