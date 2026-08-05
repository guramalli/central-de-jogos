import { useState } from "react";
import { api } from "../api/client.js";
import ProfileTooltip from "./ProfileTooltip.jsx";

const STATUS_LABEL = {
  correct: "correct",
  duplicate: "duplicate",
  wrong: "wrong",
  blank: "blank",
};

// Botão que aparece embaixo de uma palavra errada (só na sua própria linha),
// permitindo sugerir a inclusão dela no glossário.
function SuggestWordButton({ themeKey, letter, word }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  async function handleClick() {
    setStatus("sending");
    try {
      await api.post("/glossary/suggest", { themeKey, letter, word });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") return <div className="suggest-hint suggest-ok">✓ Sugerida</div>;
  if (status === "error") {
    return (
      <div className="suggest-hint suggest-error" onClick={handleClick} title="Tentar de novo">
        Erro — tentar de novo
      </div>
    );
  }
  return (
    <button className="suggest-btn" onClick={handleClick} disabled={status === "sending"}>
      {status === "sending" ? "Enviando..." : "+ Sugerir"}
    </button>
  );
}

function WordPill({ graded, isMine, themeKey, letter }) {
  const status = graded ? STATUS_LABEL[graded.status] : "blank";
  const word = graded?.word;
  const canSuggest = isMine && status === "wrong" && word;

  return (
    <div className="word-cell">
      <span className={`word-pill word-pill-${status}`}>{word || "—"}</span>
      {canSuggest && <SuggestWordButton themeKey={themeKey} letter={letter} word={word} />}
    </div>
  );
}

// Um "card" completo representando o resultado de UMA rodada: cabeçalho com nº da
// rodada + letra + temas em destaque, e a tabela de jogadores com palavras em formato de pílula colorida.
export default function RoundResultCard({ roundNumber, letter, themes, players, currentUserId, variant }) {
  return (
    <div className={`round-card ${variant === "alt" ? "round-card-alt" : ""}`}>
      <div className="round-card-header">
        <div className="round-card-title">
          Rodada {roundNumber} <span className="round-letter-chip">{letter}</span>
        </div>
        <div className="theme-chips">
          {themes.map((t) => (
            <span key={t.key} className="theme-chip">{t.name}</span>
          ))}
        </div>
      </div>

      <div className="round-table-wrap">
        <table className="player-table round-table">
          <thead>
            <tr>
              <th>Jogador</th>
              {themes.map((t) => (
                <th key={t.key} className="theme-th">{t.name}</th>
              ))}
              <th>Rodada</th>
              <th>Bloco (10)</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.userId}>
                <td>
                  <ProfileTooltip userId={p.userId} nickname={p.nickname} />
                </td>
                {themes.map((t) => (
                  <td key={t.key}>
                    <WordPill
                      graded={p.graded?.[t.key]}
                      isMine={currentUserId && p.userId === currentUserId}
                      themeKey={t.key}
                      letter={letter}
                    />
                  </td>
                ))}
                <td className="points-cell">{p.points ?? "—"}</td>
                <td className="points-cell">{p.blockTotal ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
