import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import MiniPodium from "../components/MiniPodium.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Seo from "../components/Seo.jsx";

const THEME_ICONS = {
  mitologia: "🏛️",
  games: "🎮",
  terceirao: "🎓",
  esportes: "🏅",
  futebol: "⚽",
  automobilismo: "🏎️",
  anime: "🎌",
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

// Ícone da sala: emblema de bronze do tema, com o emoji como reserva.
//
// Os emblemas são os mesmos do sistema de títulos, em versão pequena (68px
// pra render nítido nos 34px de exibição em tela retina). Usamos o BRONZE
// de propósito: além de ser o nível de entrada — não gasta o prestígio do
// ouro, que é conquista de 10.000 acertos —, o tom escuro destaca melhor o
// símbolo central no tamanho pequeno; o ouro brilha demais e o símbolo
// some no fundo.
//
// Nem todo tema tem emblema (Direito, por exemplo, é mais novo que a
// coleção), e um PNG pode faltar. Nos dois casos cai no emoji, que sempre
// funciona e não custa download.
function IconeTema({ themeKey }) {
  const [falhou, setFalhou] = useState(false);
  const emoji = THEME_ICONS[themeKey] || "❓";

  // Sem emblema (tema novo ou PNG faltando): emoji dentro do círculo de
  // sempre, que aí faz falta como moldura.
  if (!themeKey || falhou) {
    return <div className="quiz-theme-icon">{emoji}</div>;
  }

  // Com emblema: SEM o círculo. A arte já tem moldura circular própria, e o
  // fundo mais a borda do CSS criavam um segundo anel em volta do primeiro.
  return (
    <div className="quiz-theme-icon quiz-theme-icon-emblema">
      <img
        src={`/temas-quiz/${themeKey}.png`}
        alt=""
        className="quiz-theme-emblema"
        loading="lazy"
        decoding="async"
        onError={() => setFalhou(true)}
      />
    </div>
  );
}

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

  // Números reais do banco, somados a partir das próprias salas — assim o
  // texto nunca fica desatualizado quando adicionamos perguntas ou temas.
  // Só conta as salas de tema (as arenas sorteiam das mesmas perguntas, e
  // contá-las duplicaria o total).
  const totalPerguntas = themeRooms.reduce((soma, r) => soma + (r.questionCount || 0), 0);
  const totalTemas = new Set(themeRooms.map((r) => r.themeKey).filter(Boolean)).size;

  return (
    <div>
      <Seo title="Quiz" description="Escolha uma sala de Quiz — milhares de perguntas de vários temas, com dificuldade padrão ou avançada." />
      <div className="hero-banner" style={{ marginBottom: 24 }}>
        <div>
          <img src={theme === "light" ? "/quiz-logo-light.png" : "/quiz-logo.png"} alt="Quiz!" className="lobby-page-logo" />
          <h1 className="hero-title">Escolha um tema</h1>
          <p className="hero-subtitle">
            {totalPerguntas > 0 && (
              <>
                <strong>{totalPerguntas.toLocaleString("pt-BR")} perguntas</strong> em{" "}
                <strong>{totalTemas} temas</strong> diferentes.{" "}
              </>
            )}
            Cada sala tem perguntas de um tema só. Quem acertar primeiro leva os pontos — as letras
            da resposta vão aparecendo aos poucos, mas nunca mais da metade delas.
          </p>
        </div>
        <Link to="/patentes-quiz" className="retro-btn">🏆 Ver patentes</Link>
      </div>

      <MiniPodium gameKey="quiz" />

      <div className="lobby-game-grid">
        {themeRooms.map((r) => {
          const occ = occupancyInfo(r);
          return (
            <Link
              key={r.roomId}
              to={`/jogos/quiz/${r.roomId}`}
              className="glossy-panel lobby-game-card quiz-themed-card"
              data-quiz-theme={r.themeKey || undefined}
            >
              <IconeTema themeKey={r.themeKey} />
              <div>
                <h3 className="lobby-game-title">{r.label}</h3>
                {r.tier && (
                  <p className={`lobby-difficulty-badge lobby-difficulty-badge-${r.tier === "padrao" ? "basic" : "advanced"}`}>
                    {r.tier === "padrao" ? "Padrão" : "Avançado"}
                  </p>
                )}
                <p className="lobby-game-desc">{r.description || `Perguntas de ${r.label.toLowerCase()}.`}</p>
                <p className="quiz-room-question-count">{r.questionCount} perguntas cadastradas</p>
                {r.streakRecord?.count > 0 && (
                  <p className="lobby-streak-desc">
                    Recorde de seguidas: <strong>{r.streakRecord.nickname}</strong> — {r.streakRecord.count}
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

      {arenaRooms.length > 0 && (
        <div className="arena-section">
          <h2 className="arena-section-title">Arenas Relâmpago</h2>
          <p className="arena-section-sub">
            50 rodadas relâmpago, 10 segundos por pergunta. Todo mundo que acertar pontua — no
            ranking mensal E no placar do turno. Os 5 primeiros do turno ainda levam bônus
            (100 / 60 / 40 / 20 / 10 pts).
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
                      <span>10s por pergunta</span>
                      <span>50 rodadas</span>
                      <span>Top 5 leva bônus</span>
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
    </div>
  );
}
