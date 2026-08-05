import { useState } from "react";
import { api } from "../api/client.js";
import ProfileTooltip from "./ProfileTooltip.jsx";

const STATUS_CLASS = {
  correct: "word-correct",   // verde — palavra certa e única
  duplicate: "word-duplicate", // laranja — certa, mas repetida por 2+ jogadores
  wrong: "word-wrong",       // vermelho — errada
  blank: "word-blank",       // cinza — em branco
};

// Botão que aparece embaixo de uma palavra marcada como errada (só na sua própria linha),
// permitindo sugerir a inclusão dela no glossário. Fica pendente até um moderador/admin aprovar.
function SuggestWordButton({ themeKey, letter, word }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  async function handleClick() {
    setStatus("sending");
    try {
      await api.post("/glossary/suggest", { themeKey, letter, word });
      setStatus("sent");
    } catch (err) {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <div className="suggest-hint suggest-ok">✓ Sugerida — aguardando aprovação</div>;
  }
  if (status === "error") {
    return (
      <div className="suggest-hint suggest-error" onClick={handleClick} title="Tentar de novo">
        Erro ao sugerir — tentar de novo
      </div>
    );
  }
  return (
    <button className="suggest-btn" onClick={handleClick} disabled={status === "sending"}>
      {status === "sending" ? "Enviando..." : "+ Sugerir palavra"}
    </button>
  );
}

// Tabela: nick (com patente + tooltip) | resposta de cada tema (colorida por status) | pontos da rodada | total do bloco
export default function PlayerTable({ themes, players, currentUserId, letter }) {
  return (
    <table className="player-table">
      <thead>
        <tr>
          <th>Jogador</th>
          {themes.map((t) => (
            <th key={t.key}>{t.name}</th>
          ))}
          <th>Pontos (rodada)</th>
          <th>Total (bloco de 10)</th>
        </tr>
      </thead>
      <tbody>
        {players.map((p) => (
          <tr key={p.userId}>
            <td>
              <ProfileTooltip userId={p.userId} nickname={p.nickname} />
            </td>
            {themes.map((t) => {
              const g = p.graded?.[t.key];
              const cls = g ? STATUS_CLASS[g.status] : "word-blank";
              const isMine = currentUserId && p.userId === currentUserId;
              const canSuggest = isMine && g?.status === "wrong" && g?.word;
              return (
                <td key={t.key} className={cls}>
                  <div>{g?.word || "—"}</div>
                  {canSuggest && (
                    <SuggestWordButton themeKey={t.key} letter={letter} word={g.word} />
                  )}
                </td>
              );
            })}
            <td>{p.points ?? "—"}</td>
            <td>{p.blockTotal ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
