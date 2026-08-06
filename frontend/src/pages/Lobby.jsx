import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FeedbackModal from "../components/FeedbackModal.jsx";

export default function Lobby() {
  const { user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="lobby-page">
      {/* Aviso de Beta */}
      <div className="beta-banner">
        <span className="beta-badge">BETA</span>
        <span>
          O portal está em fase de <strong>testes (Beta)</strong> — pode encontrar bugs ou
          lentidão de vez em quando. Obrigado pela paciência! Encontrou algo estranho? Manda pra
          gente:
        </span>
        <button className="beta-feedback-btn" onClick={() => setShowFeedback(true)}>
          💬 Enviar feedback
        </button>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

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
        <Link to="/jogos/stop" className="glossy-panel lobby-game-card">
          <img src="/stop-logo.png" alt="Stop!" className="lobby-game-logo" />
          <div>
            <h3 className="lobby-game-title">Stop</h3>
            <p className="lobby-game-desc">
              Rodadas automáticas em blocos de 10, com 6 temas e 1 letra sorteados por vez. Sala
              padrão livre pra todos, ou sala avançada pra quem já tem experiência.
            </p>
            <span className="lobby-game-cta">
              Ver salas <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </Link>

        <Link to="/jogos/quiz" className="glossy-panel lobby-game-card">
          <img src="/quiz-logo.png" alt="Quiz!" className="lobby-game-logo" />
          <div>
            <h3 className="lobby-game-title">Quiz</h3>
            <p className="lobby-game-desc">
              Perguntas por tema — Esportes, Ciências, História, Cinema e Letras. Quem acerta
              primeiro leva os pontos!
            </p>
            <span className="lobby-game-cta">
              Ver salas <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </Link>
      </div>

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
