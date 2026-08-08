import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import MiniPodium from "../components/MiniPodium.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Seo from "../components/Seo.jsx";

const THEME_ICONS = {
  esportes: "⚽",
  ciencias: "🧪",
  historia: "🏛️",
  cinema: "🎬",
  letras: "📚",
  geral: "🧠",
  musica: "🎵",
  series: "📺",
  novelas: "🎭",
  geografia: "🌍",
  direito: "⚖️",
};

function occupancyInfo(status) {
  if (!status) return { text: "carregando...", full: false, empty: false };
  if (status.onlineCount === 0) return { text: "Vazia", full: false, empty: true };
  if (status.onlineCount >= status.maxPlayers) return { text: "Lotada", full: true, empty: false };
  return { text: `${status.onlineCount}/${status.maxPlayers} jogadores online`, full: false, empty: false };
}

export default function QuizLobby() {
  const [rooms, setRooms] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
    api.get("/quiz-rooms").then(({ data }) => {
      const TIER_ORDER = { padrao: 0, avancado: 1 };
      const sorted = [...data].sort((a, b) => {
        const themeA = a.label.split(" — ")[0];
        const themeB = b.label.split(" — ")[0];
        const themeCompare = themeA.localeCompare(themeB, "pt-BR");
        if (themeCompare !== 0) return themeCompare;
        return (TIER_ORDER[a.tier] ?? 0) - (TIER_ORDER[b.tier] ?? 0);
      });
      setRooms(sorted);
    }).catch(() => {});
  }, []);

  // Arenas ficam separadas e sempre no topo, com card próprio — são o
  // destaque da página, não mais uma sala de tema no meio da lista.
  const arenaRooms = rooms.filter((r) => r.arena);
  const themeRooms = rooms.filter((r) => !r.arena);

  return (
    <div>
      <Seo title="Quiz" description="Escolha uma sala de Quiz — mais de 8 mil perguntas de vários temas, com dificuldade fácil ou avançada." />
      <div className="hero-banner" style={{ marginBottom: 24 }}>
        <div>
          <img src={theme === "light" ? "/quiz-logo-light.png" : "/quiz-logo.png"} alt="Quiz!" className="lobby-page-logo" />
          <h1 className="hero-title">Escolha um tema</h1>
          <p className="hero-subtitle">
            Cada sala tem perguntas de um tema só. Quem acertar primeiro leva os pontos — as letras
            da resposta vão aparecendo aos poucos, mas nunca mais da metade delas.
          </p>
        </div>
        <Link to="/patentes-quiz" className="retro-btn">🏆 Ver patentes</Link>
      </div>

      <MiniPodium gameKey="quiz" />

      {arenaRooms.length > 0 && (
        <div className="arena-section">
          <h2 className="arena-section-title">⚡ Arenas Relâmpago</h2>
          <p className="arena-section-sub">
            50 rodadas rápidas, 20 segundos por pergunta. Cada acerto vale 1 ponto no placar do
            turno — e o pódio no fim leva bônus de pontuação.
          </p>
          <div className="arena-grid">
            {arenaRooms.map((r) => {
              const occ = occupancyInfo(r);
              return (
                <Link key={r.roomId} to={`/jogos/quiz/${r.roomId}`} className="arena-card">
                  <div className="arena-card-bolt">⚡</div>
                  <div className="arena-card-body">
                    <h3 className="arena-card-title">{r.label.replace("⚡ ", "")}</h3>
                    <p className="arena-card-desc">{r.description}</p>
                    <div className="arena-card-meta">
                      <span>⏱️ 20s por pergunta</span>
                      <span>🔁 50 rodadas</span>
                      <span>🏆 Bônus no pódio</span>
                    </div>
                    <div className={`lobby-occupancy ${occ.full ? "lobby-occupancy-full" : ""} ${occ.empty ? "lobby-occupancy-empty" : ""}`}>
                      <span className="material-symbols-outlined">group</span> {occ.text}
                    </div>
                    <span className="arena-card-cta">
                      Entrar na arena <span className="material-symbols-outlined">arrow_forward</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="lobby-game-grid">
        {themeRooms.map((r) => {
          const occ = occupancyInfo(r);
          return (
            <Link key={r.roomId} to={`/jogos/quiz/${r.roomId}`} className="glossy-panel lobby-game-card">
              <div className="quiz-theme-icon">{THEME_ICONS[r.themeKey] || "❓"}</div>
              <div>
                <h3 className="lobby-game-title">{r.label}</h3>
                {r.tier && (
                  <p className={`lobby-difficulty-badge lobby-difficulty-badge-${r.tier === "padrao" ? "basic" : "advanced"}`}>
                    {r.tier === "padrao" ? "🟢 Padrão" : "🔴 Avançado"}
                  </p>
                )}
                <p className="lobby-game-desc">{r.description || `Perguntas de ${r.label.toLowerCase()}.`}</p>
                <p className="quiz-room-question-count">📋 {r.questionCount} perguntas cadastradas</p>
                {r.streakRecord?.count > 0 && (
                  <p className="lobby-streak-desc">
                    🔥 Recorde de seguidas: <strong>{r.streakRecord.nickname}</strong> — {r.streakRecord.count}
                  </p>
                )}
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
