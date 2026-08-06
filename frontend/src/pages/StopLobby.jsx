import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

function occupancyInfo(status) {
  if (!status) return { text: "carregando...", full: false, empty: false };
  if (status.onlineCount === 0) return { text: "Vazia", full: false, empty: true };
  if (status.onlineCount >= status.maxPlayers) return { text: "Lotada", full: true, empty: false };
  return { text: `${status.onlineCount}/${status.maxPlayers} jogadores online`, full: false, empty: false };
}

export default function StopLobby() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    api.get("/rooms").then(({ data }) => setRooms(data)).catch(() => {});
  }, []);

  return (
    <div>
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

      <div className="lobby-game-grid">
        {rooms.map((r) => {
          const occ = occupancyInfo(r);
          const advanced = r.minLifetimePoints > 0;
          return (
            <Link
              key={r.roomId}
              to={`/jogos/stop/${r.roomId}`}
              className={`glossy-panel lobby-game-card ${advanced ? "lobby-game-card-advanced" : ""}`}
            >
              <div className={`lobby-difficulty-icon ${advanced ? "lobby-difficulty-advanced" : "lobby-difficulty-basic"}`}>
                <span className="material-symbols-outlined">{advanced ? "local_fire_department" : "eco"}</span>
              </div>
              <div>
                <h3 className="lobby-game-title">
                  {r.label}
                  {advanced && <span className="material-symbols-outlined lobby-lock-icon">lock</span>}
                </h3>
                <p className={`lobby-difficulty-badge ${advanced ? "lobby-difficulty-badge-advanced" : "lobby-difficulty-badge-basic"}`}>
                  {advanced ? "Difícil" : "Iniciante"}
                </p>
                <p className="lobby-game-desc">
                  {advanced
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
