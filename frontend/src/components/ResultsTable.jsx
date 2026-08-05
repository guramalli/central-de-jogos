import { useState } from "react";
import { api } from "../api/client.js";
import ProfileTooltip from "./ProfileTooltip.jsx";

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

const STATUS_TEXT_CLASS = {
  correct: "word-text-correct",
  duplicate: "word-text-duplicate",
  wrong: "word-text-wrong",
  blank: "word-text-blank",
};

// Tabela de resultado no estilo "folha de pontuação" do Stop: coluna do jogador e as
// colunas de pontos em cinza claro, coluna dos temas em laranja, e as lacunas com
// as palavras em fundo branco.
export default function ResultsTable({ roundNumber, letter, themes, players, currentUserId }) {
  return (
    <div className="scoresheet-wrap">
      <table className="scoresheet">
        <thead>
          <tr>
            <th className="sheet-col-player">Jogador</th>
            {themes.map((t) => (
              <th key={t.key} className="sheet-col-theme">{t.name}</th>
            ))}
            <th className="sheet-col-points">Pontos (rodada {roundNumber})</th>
            <th className="sheet-col-points">Total (bloco de 10)</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.userId}>
              <td className="sheet-col-player">
                <ProfileTooltip userId={p.userId} nickname={p.nickname} />
              </td>
              {themes.map((t) => {
                const g = p.graded?.[t.key];
                const isMine = currentUserId && p.userId === currentUserId;
                const canSuggest = isMine && g?.status === "wrong" && g?.word;
                return (
                  <td key={t.key} className="sheet-col-word">
                    <span className={STATUS_TEXT_CLASS[g?.status || "blank"]}>{g?.word || "—"}</span>
                    {canSuggest && (
                      <SuggestWordButton themeKey={t.key} letter={letter} word={g.word} />
                    )}
                  </td>
                );
              })}
              <td className="sheet-col-points">{p.points ?? "—"}</td>
              <td className="sheet-col-points">{p.blockTotal ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
