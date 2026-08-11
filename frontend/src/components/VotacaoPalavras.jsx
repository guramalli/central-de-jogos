import { useEffect, useState } from "react";

// Votação das palavras nas salas privadas.
//
// SINCRONIZADA: todo mundo julga o mesmo tema ao mesmo tempo, e o jogo só
// avança quando todos votaram OU o tempo do tema acaba. Quem não votar
// numa palavra está aceitando ela — o silêncio conta como "vale".
//
// Isso é diferente de deixar cada um navegar no próprio ritmo: aqui a mesa
// inteira acompanha junto, como na conferência do jogo de papel.
export default function VotacaoPalavras({ tema, meuUserId, segundos, progresso, onVotar }) {
  const [votos, setVotos] = useState({});

  // Cada tema novo zera os votos locais: os do tema anterior já foram
  // enviados e não voltam mais.
  useEffect(() => {
    setVotos({});
  }, [tema?.indice]);

  if (!tema) return null;

  const dosOutros = (tema.itens || []).filter((i) => i.userId !== meuUserId);
  const minhas = (tema.itens || []).filter((i) => i.userId === meuUserId);

  function votar(item, valido) {
    const chave = `${item.userId}:${item.themeKey}`;
    if (votos[chave] !== undefined) return; // já votou nessa
    setVotos((v) => ({ ...v, [chave]: valido }));
    onVotar(item.userId, item.themeKey, valido);
  }

  function aceitarTodas() {
    for (const item of dosOutros) {
      const chave = `${item.userId}:${item.themeKey}`;
      if (votos[chave] === undefined) votar(item, true);
    }
  }

  const faltam = dosOutros.filter(
    (i) => votos[`${i.userId}:${i.themeKey}`] === undefined
  ).length;
  const terminei = faltam === 0;

  return (
    <div className="votacao">
      <div className="votacao-topo">
        <h3 className="votacao-titulo">🗳️ Vale ou não vale?</h3>
        <div className="votacao-topo-dir">
          {progresso && (
            <span className="votacao-prontos">
              {progresso.prontos}/{progresso.total} votaram
            </span>
          )}
          <span className={`votacao-timer ${segundos <= 3 ? "votacao-timer-urgente" : ""}`}>
            {segundos}s
          </span>
        </div>
      </div>

      {/* Trilha só informativa: quem manda no ritmo é o servidor, então
          ela mostra onde a mesa está, sem permitir pular. */}
      <div className="votacao-trilha">
        {Array.from({ length: tema.total }).map((_, i) => (
          <span
            key={i}
            className={`votacao-trilha-item ${i === tema.indice ? "votacao-trilha-atual" : ""} ${
              i < tema.indice ? "votacao-trilha-ok" : ""
            }`}
          >
            {i < tema.indice ? "✓" : i + 1}
          </span>
        ))}
      </div>

      <div className="votacao-tema-atual">
        <span className="votacao-tema-nome">{tema.themeName}</span>
        <span className="votacao-tema-contador">
          tema {tema.indice + 1} de {tema.total}
        </span>
      </div>

      {dosOutros.length === 0 ? (
        <p className="votacao-vazio">Ninguém mais escreveu nesse tema.</p>
      ) : (
        <>
          {dosOutros.length > 1 && !terminei && (
            <button className="votacao-aprovar-todas" onClick={aceitarTodas}>
              ✓ Aceitar todas deste tema
            </button>
          )}

          <div className="votacao-lista-tema">
            {dosOutros.map((item) => {
              const chave = `${item.userId}:${item.themeKey}`;
              const voto = votos[chave];
              return (
                <div
                  key={chave}
                  className={`votacao-linha ${voto === true ? "votacao-linha-sim" : ""} ${
                    voto === false ? "votacao-linha-nao" : ""
                  }`}
                >
                  <div className="votacao-linha-texto">
                    <span className="votacao-palavra">{item.word}</span>
                  </div>
                  <div className="votacao-botoes">
                    <button
                      className={`votacao-btn votacao-sim ${voto === true ? "votacao-btn-on" : ""}`}
                      onClick={() => votar(item, true)}
                      disabled={voto !== undefined}
                      title="Vale"
                    >
                      ✓
                    </button>
                    <button
                      className={`votacao-btn votacao-nao ${voto === false ? "votacao-btn-on" : ""}`}
                      onClick={() => votar(item, false)}
                      disabled={voto !== undefined}
                      title="Não vale"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {minhas.length > 0 && (
        <div className="votacao-minhas">
          <span className="votacao-minhas-titulo">Sua palavra:</span>{" "}
          <strong>{minhas.map((m) => m.word).join(", ")}</strong>
        </div>
      )}

      <div className="votacao-rodape">
        {terminei ? (
          <span className="votacao-esperando">
            ✅ Pronto! Esperando os outros...
          </span>
        ) : (
          <span className="votacao-aviso-tempo">
            Palavra sem voto até o tempo acabar é <strong>aceita</strong>.
          </span>
        )}
      </div>
    </div>
  );
}
