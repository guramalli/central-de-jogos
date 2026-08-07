import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

function occupancyInfo(status) {
  if (!status) return { text: "carregando...", full: false, empty: false };
  if (status.onlineCount === 0) return { text: "Vazia", full: false, empty: true };
  if (status.onlineCount >= status.maxPlayers) return { text: "Lotada", full: true, empty: false };
  return { text: `${status.onlineCount}/${status.maxPlayers} jogadores online`, full: false, empty: false };
}

export default function AcromaniaLobby() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    api.get("/acromania-rooms").then(({ data }) => setRooms(data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="hero-banner" style={{ marginBottom: 24 }}>
        <div>
          <img src="/acromania-logo.png" alt="Acromania" className="lobby-page-logo" />
          <h1 className="hero-title">Escolha uma sala</h1>
          <p className="hero-subtitle">
            Um tema, algumas letras, e o tempo correndo — crie a frase mais criativa e vote na
            melhor da rodada. Sem digitação, sem correção automática: aqui quem decide é a galera.
          </p>
        </div>
      </div>

      <div className="lobby-game-grid">
        {rooms.map((r) => {
          const occ = occupancyInfo(r);
          return (
            <Link key={r.roomId} to={`/jogos/acromania/${r.roomId}`} className="glossy-panel lobby-game-card">
              <div className="lobby-difficulty-icon lobby-difficulty-basic">
                <span className="material-symbols-outlined">edit_note</span>
              </div>
              <div>
                <h3 className="lobby-game-title">{r.label}</h3>
                <p className="lobby-game-desc">{r.description}</p>
                <p className="lobby-streak-desc">⚠️ Só roda com {r.minPlayersToStart}+ jogadores na sala</p>
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
