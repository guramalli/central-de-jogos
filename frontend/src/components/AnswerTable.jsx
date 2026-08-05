// Tabela de preenchimento da rodada ativa — usa exatamente a mesma estrutura/cores
// da tabela de resultado (ResultsTable). Quando readOnly=true (fora da rodada ativa),
// mostra as mesmas células mas sem campo editável — mantém a tabela sempre visível.
export default function AnswerTable({ nickname, themes, letter, answers, onChange, readOnly }) {
  return (
    <div className="scoresheet-wrap">
      <table className="scoresheet">
        <thead>
          <tr>
            <th className="sheet-col-player">Jogador</th>
            {themes.map((t) => (
              <th key={t.key} className="sheet-col-theme">{t.name}</th>
            ))}
            <th className="sheet-col-points">Pontos (rodada)</th>
            <th className="sheet-col-points">Total (bloco de 10)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="sheet-col-player">{nickname}</td>
            {themes.map((t) => (
              <td key={t.key} className="sheet-col-word">
                {readOnly ? (
                  <span className="sheet-fill-waiting">aguardando...</span>
                ) : (
                  <input
                    className="sheet-fill-input"
                    value={answers[t.key] || ""}
                    placeholder={letter || ""}
                    maxLength={40}
                    autoComplete="off"
                    onChange={(e) => onChange(t.key, e.target.value)}
                  />
                )}
              </td>
            ))}
            <td className="sheet-col-points">—</td>
            <td className="sheet-col-points">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
