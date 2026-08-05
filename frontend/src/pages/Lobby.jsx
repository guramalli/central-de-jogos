import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

// Monta o texto/estilo de ocupação de uma sala a partir do status vindo da API.
function occupancyInfo(status) {
  if (!status) return { text: "carregando...", full: false, empty: false };
  if (status.onlineCount === 0) return { text: "Vazia", full: false, empty: true };
  if (status.onlineCount >= status.maxPlayers) return { text: "Lotada", full: true, empty: false };
  return { text: `${status.onlineCount}/${status.maxPlayers} jogadores online`, full: false, empty: false };
}

export default function Lobby() {
  const { user } = useAuth();
  const [roomsStatus, setRoomsStatus] = useState([]);

  useEffect(() => {
    api.get("/rooms").then(({ data }) => setRoomsStatus(data)).catch(() => {});
  }, []);

  const statusFor = (roomId) => roomsStatus.find((r) => r.roomId === roomId);
  const padraoOcc = occupancyInfo(statusFor("stop-sala-1"));
  const avancadaOcc = occupancyInfo(statusFor("stop-sala-avancada"));

  return (
    <div className="lobby-page">
      {/* Painel de boas-vindas */}
      <section className="glossy-panel lobby-hero">
        <div>
          <p className="lobby-hero-tag">BEM-VINDO DE VOLTA</p>
          <h1 className="lobby-hero-title">{user?.nickname}</h1>
          <p className="lobby-hero-subtitle">
            Escolha um jogo, suba de patente e dispute a premiação mensal.
          </p>
        </div>
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
      </section>

      {/* Cards dos jogos */}
      <div className="lobby-game-grid">
        <Link to="/jogos/stop/stop-sala-1" className="glossy-panel lobby-game-card">
          <img src="/stop-logo.png" alt="Stop!" className="lobby-game-logo" />
          <div>
            <h3 className="lobby-game-title">Stop — Sala Padrão</h3>
            <p className="lobby-game-desc">
              Rodadas automáticas em blocos de 10, com 6 temas e 1 letra sorteados por vez. Aberta pra
              todo mundo.
            </p>
            <div className={`lobby-occupancy ${padraoOcc.full ? "lobby-occupancy-full" : ""} ${padraoOcc.empty ? "lobby-occupancy-empty" : ""}`}>
              <span className="material-symbols-outlined">group</span> {padraoOcc.text}
            </div>
            <span className="lobby-game-cta">
              Jogar agora <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </Link>

        <Link to="/jogos/stop/stop-sala-avancada" className="glossy-panel lobby-game-card lobby-game-card-advanced">
          <img src="/stop-logo.png" alt="Stop!" className="lobby-game-logo lobby-game-logo-dim" />
          <div>
            <h3 className="lobby-game-title">
              Stop — Sala Avançada
              <span className="material-symbols-outlined lobby-lock-icon">lock</span>
            </h3>
            <p className="lobby-game-desc">
              Resposta em 20s, intervalo de só 5s. Só pra jogador experiente — exige pelo menos a
              patente Mestre.
            </p>
            <div className={`lobby-occupancy ${avancadaOcc.full ? "lobby-occupancy-full" : ""} ${avancadaOcc.empty ? "lobby-occupancy-empty" : ""}`}>
              <span className="material-symbols-outlined">group</span> {avancadaOcc.text}
            </div>
            <span className="lobby-game-cta">
              Entrar <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Card do Quiz */}
      <Link to="/jogos/quiz" className="glossy-panel lobby-quiz-card lobby-quiz-card-active">
        <div className="lobby-quiz-icon">❓</div>
        <div>
          <h3 className="lobby-game-title">Quiz</h3>
          <p className="lobby-game-desc">
            Perguntas por tema — Esportes, Ciências, História, Cinema e Letras. Quem acerta primeiro
            leva os pontos!
          </p>
          <span className="lobby-game-cta">
            Ver salas <span className="material-symbols-outlined">arrow_forward</span>
          </span>
        </div>
      </Link>

      {/* Links rápidos */}
      <div className="lobby-quick-grid">
        <Link to="/ranking" className="glossy-panel lobby-quick-card">
          <h4>Ver ranking</h4>
          <p>Mensal e vitalício</p>
        </Link>
        {(user?.role === "ADMIN" || user?.role === "MODERATOR") && (
          <Link to="/admin" className="glossy-panel lobby-quick-card">
            <h4>Painel admin</h4>
            <p>Moderar glossário</p>
          </Link>
        )}
      </div>
    </div>
  );
}
