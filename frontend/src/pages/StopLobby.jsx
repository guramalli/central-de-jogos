import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import MiniPodium from "../components/MiniPodium.jsx";
import Seo from "../components/Seo.jsx";

function occupancyInfo(status) {
  if (!status) return { text: "carregando...", full: false, empty: false };
  if (status.onlineCount === 0) return { text: "Vazia", full: false, empty: true };
  if (status.onlineCount >= status.maxPlayers) return { text: "Lotada", full: true, empty: false };
  return { text: `${status.onlineCount}/${status.maxPlayers} jogadores online`, full: false, empty: false };
}

const DIFFICULTY_INFO = {
  basic: { label: "Iniciante", tier: "basic", icon: "eco" },
  mid: { label: "Intermediária", tier: "mid", icon: "bolt" },
  advanced: { label: "Difícil", tier: "advanced", icon: "local_fire_department" },
};

export default function StopLobby() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    api.get("/rooms").then(({ data }) => setRooms(data)).catch(() => {});
  }, []);

  return (
    <div>
      <Seo title="Stop" description="Escolha uma sala de Stop — velocidade de digitação e conhecimentos gerais, com salas de dificuldade diferente." />
      <div className="hero-banner" style={{ marginBottom: 24 }}>
        <div>
          <img src="/stop-logo.png" alt="Stop!" className="lobby-page-logo" />
          <h1 className="hero-title">Escolha uma sala</h1>
          <p className="hero-subtitle">
            Rodadas automáticas em blocos de 10, com 6 temas e 1 letra sorteados por vez.
          </p>
        </div>
        <Link to="/patentes" className="retro-btn">🏆 Ver patentes</Link>
      </div>

      <MiniPodium gameKey="stop" />

      <div className="lobby-game-grid">
        {rooms.map((r) => {
          const occ = occupancyInfo(r);
          const diff = DIFFICULTY_INFO[r.difficulty] || DIFFICULTY_INFO.basic;
          const restricted = r.minLifetimePoints > 0;
          return (
            <Link
              key={r.roomId}
              to={`/jogos/stop/${r.roomId}`}
              className={`glossy-panel lobby-game-card ${diff.tier !== "basic" ? "lobby-game-card-advanced" : ""} ${r.semPontuacao ? "lobby-game-card-zoeira" : ""}`}
            >
              <div className={`lobby-difficulty-icon lobby-difficulty-${diff.tier}`}>
                <span className="material-symbols-outlined">{diff.icon}</span>
              </div>
              <div>
                <h3 className="lobby-game-title">
                  {r.label}
                  {restricted && <span className="material-symbols-outlined lobby-lock-icon">lock</span>}
                </h3>
                {r.semPontuacao ? (
                  <p className="lobby-zoeira-badge">😄 Sem pontuação</p>
                ) : (
                  <p className={`lobby-difficulty-badge lobby-difficulty-badge-${diff.tier}`}>{diff.label}</p>
                )}
                <p className="lobby-game-desc">
                  {r.description
                    ? r.description
                    : restricted
                    ? `Só pra jogador experiente — exige ${r.minLifetimePoints} pontos vitalícios.`
                    : "Sala livre para todos os jogadores."}
                </p>
                <div className={`lobby-occupancy ${occ.full ? "lobby-occupancy-full" : ""} ${occ.empty ? "lobby-occupancy-empty" : ""}`}>
                  <span className="material-symbols-outlined">group</span> {occ.text}
                </div>
                <span className="lobby-game-cta">
                  Entrar <span className="material-symbols-outlined">arrow_forward</span>
                </span>
              </div>
            </Link>
          );
        })}
        {rooms.length === 0 && <p style={{ color: "var(--text-dim)" }}>Carregando salas...</p>}
      </div>
    </div>
  );
}
