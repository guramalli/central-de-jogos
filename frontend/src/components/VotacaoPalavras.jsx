import { useMemo, useState } from "react";

// Votação das palavras nas salas privadas.
//
// Um TEMA POR VEZ, não a lista inteira de uma vez. É como se faz no jogo
// de papel: "vamos conferir Frutas... agora Cor...". Ver 30 palavras de 6
// temas misturadas numa tela só é confuso e faz a pessoa desistir de votar
// com cuidado — principalmente no celular.
export default function VotacaoPalavras({ items, meuUserId, segundos, progresso, onVotar }) {
  const [votos, setVotos] = useState({}); // "userId:themeKey" -> boolean
  const [indiceTema, setIndiceTema] = useState(0);

  // Agrupa por tema, preservando a ordem em que vieram do servidor (que é
  // a mesma ordem das colunas na tabela do jogo).
  const temas = useMemo(() => {
    const mapa = new Map();
    for (const i of items) {
      if (!mapa.has(i.themeKey)) {
        mapa.set(i.themeKey, { key: i.themeKey, nome: i.themeName, itens: [] });
      }
      mapa.get(i.themeKey).itens.push(i);
    }
    return [...mapa.values()];
  }, [items]);

  if (temas.length === 0) {
    return (
      <div className="votacao">
        <p className="votacao-vazio">Ninguém escreveu nada nessa rodada.</p>
      </div>
    );
  }

  const temaAtual = temas[Math.min(indiceTema, temas.length - 1)];
  // Ordem embaralhada: se as palavras aparecessem sempre na mesma ordem
  // dos jogadores, daria pra deduzir de quem é cada uma e o anonimato
  // perderia o sentido. O embaralhamento é fixo por rodada (usa o índice
  // do tema como semente) pra a lista não dançar a cada clique.
  const dosOutros = useMemo(() => {
    const lista = temaAtual.itens.filter((i) => i.userId !== meuUserId);
    return [...lista].sort((a, b) =>
      (a.word + temaAtual.key).localeCompare(b.word + temaAtual.key)
    );
  }, [temaAtual, meuUserId]);
  const minhas = temaAtual.itens.filter((i) => i.userId === meuUserId);

  function votar(item, valido) {
    const chave = `${item.userId}:${item.themeKey}`;
    setVotos((v) => ({ ...v, [chave]: valido }));
    onVotar(item.userId, item.themeKey, valido);
  }

  // Marca todas do tema de uma vez — atalho pra quando está tudo certo,
  // que é o caso mais comum.
  function aprovarTodasDoTema() {
    for (const item of dosOutros) {
      const chave = `${item.userId}:${item.themeKey}`;
      if (votos[chave] === undefined) votar(item, true);
    }
  }

  // Quantos temas já foram totalmente votados por mim.
  const temasVotados = temas.filter((t) =>
    t.itens
      .filter((i) => i.userId !== meuUserId)
      .every((i) => votos[`${i.userId}:${i.themeKey}`] !== undefined)
  ).length;

  const faltaNoTema = dosOutros.filter(
    (i) => votos[`${i.userId}:${i.themeKey}`] === undefined
  ).length;

  const ehUltimo = indiceTema >= temas.length - 1;

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
          <span className="votacao-timer">{segundos}s</span>
        </div>
      </div>

      {/* Trilha de temas: mostra onde a pessoa está e permite pular direto
          pra um tema específico. */}
      <div className="votacao-trilha">
        {temas.map((t, i) => {
          const votado = t.itens
            .filter((x) => x.userId !== meuUserId)
            .every((x) => votos[`${x.userId}:${x.themeKey}`] !== undefined);
          return (
            <button
              key={t.key}
              className={`votacao-trilha-item ${i === indiceTema ? "votacao-trilha-atual" : ""} ${
                votado ? "votacao-trilha-ok" : ""
              }`}
              onClick={() => setIndiceTema(i)}
              title={t.nome}
            >
              {votado ? "✓" : i + 1}
            </button>
          );
        })}
      </div>

      <div className="votacao-tema-atual">
        <span className="votacao-tema-nome">{temaAtual.nome}</span>
        <span className="votacao-tema-contador">
          tema {indiceTema + 1} de {temas.length}
        </span>
      </div>

      {dosOutros.length === 0 ? (
        <p className="votacao-vazio">Ninguém mais escreveu nesse tema.</p>
      ) : (
        <>
          {dosOutros.length > 1 && faltaNoTema > 0 && (
            <button className="votacao-aprovar-todas" onClick={aprovarTodasDoTema}>
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
                  {/* Sem o nome de quem escreveu, de propósito: votar
                      sabendo de quem é a palavra vira constrangimento
                      ("vou recusar a do meu amigo?") e abre espaço pra
                      favoritismo. Anônimo, a mesa julga a palavra. */}
                  <div className="votacao-linha-texto">
                    <span className="votacao-palavra">{item.word}</span>
                  </div>
                  <div className="votacao-botoes">
                    <button
                      className={`votacao-btn votacao-sim ${voto === true ? "votacao-btn-on" : ""}`}
                      onClick={() => votar(item, true)}
                      title="Vale"
                    >
                      ✓
                    </button>
                    <button
                      className={`votacao-btn votacao-nao ${voto === false ? "votacao-btn-on" : ""}`}
                      onClick={() => votar(item, false)}
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

      <div className="votacao-navegacao">
        <button
          className="votacao-nav-btn"
          onClick={() => setIndiceTema((i) => Math.max(0, i - 1))}
          disabled={indiceTema === 0}
        >
          ← Anterior
        </button>
        <span className="votacao-nav-status">
          {temasVotados}/{temas.length} temas
        </span>
        <button
          className="votacao-nav-btn votacao-nav-principal"
          onClick={() => setIndiceTema((i) => Math.min(temas.length - 1, i + 1))}
          disabled={ehUltimo}
        >
          {ehUltimo ? "Fim" : "Próximo →"}
        </button>
      </div>
    </div>
  );
}
