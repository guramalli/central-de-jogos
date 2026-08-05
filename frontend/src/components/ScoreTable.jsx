// ÚNICA tabela usada tanto para preencher a rodada quanto para mostrar o resultado —
// é literalmente a mesma estrutura/markup nos dois casos, o que muda é só o
// conteúdo de cada célula (que o StopGame.jsx decide e passa pronto em "rows").
// O nickname aqui é sempre texto simples (sem tooltip) — o "passar o mouse" com
// os detalhes do jogador fica só na lista de jogadores online, na barra lateral.
//
// rows: [{ userId, nickname, cells: { [themeKey]: <node> }, points, blockTotal }]
export default function ScoreTable({ themes, rows, roundLabel }) {
  return (
    <div className="scoresheet-wrap">
      <table className="scoresheet">
        <thead>
          <tr>
            <th className="sheet-col-player">Jogador</th>
            {themes.map((t) => (
              <th key={t.key} className="sheet-col-theme">{t.name}</th>
            ))}
            <th className="sheet-col-points">{roundLabel || "PTS"}</th>
            <th className="sheet-col-points">PTS TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.userId}>
              <td className="sheet-col-player">{row.nickname}</td>
              {themes.map((t) => (
                <td key={t.key} className="sheet-col-word">
                  {row.cells[t.key]}
                </td>
              ))}
              <td className="sheet-col-points">{row.points ?? "—"}</td>
              <td className="sheet-col-points">{row.blockTotal ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
