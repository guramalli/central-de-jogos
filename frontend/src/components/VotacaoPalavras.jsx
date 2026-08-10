import { useState } from "react";

// Tela de votação das salas privadas: cada jogador marca as palavras dos
// outros como válidas ou não. Quem não votar não trava nada — passado o
// tempo, o que ficou sem voto é considerado válido.
export default function VotacaoPalavras({ items, meuUserId, segundos, onVotar }) {
  const [votos, setVotos] = useState({}); // "userId:themeKey" -> boolean

  // Só vota nas palavras dos outros.
  const dosOutros = items.filter((i) => i.userId !== meuUserId);
  const minhas = items.filter((i) => i.userId === meuUserId);

  function votar(item, valido) {
    const chave = `${item.userId}:${item.themeKey}`;
    setVotos((v) => ({ ...v, [chave]: valido }));
    onVotar(item.userId, item.themeKey, valido);
  }

  // Agrupa por tema, que é como a mesa costuma conferir na vida real.
  const porTema = {};
  for (const i of dosOutros) {
    (porTema[i.themeName] ||= []).push(i);
  }

  const votados = Object.keys(votos).length;

  return (
    <div className="votacao">
      <div className="votacao-topo">
        <h3 className="votacao-titulo">🗳️ Vale ou não vale?</h3>
        <span className="votacao-timer">{segundos}s</span>
      </div>
      <p className="votacao-sub">
        Marque as palavras dos outros. O que a maioria reprovar não pontua — o que ninguém
        votar, vale.
        {dosOutros.length > 0 && ` (${votados} de ${dosOutros.length} votadas)`}
      </p>

      {dosOutros.length === 0 ? (
        <p className="votacao-vazio">Ninguém mais escreveu nada nessa rodada.</p>
      ) : (
        Object.entries(porTema).map(([tema, lista]) => (
          <div key={tema} className="votacao-grupo">
            <div className="votacao-tema">{tema}</div>
            {lista.map((item) => {
              const chave = `${item.userId}:${item.themeKey}`;
              const voto = votos[chave];
              return (
                <div key={chave} className="votacao-linha">
                  <span className="votacao-nick">{item.nickname}</span>
                  <span className="votacao-palavra">{item.word}</span>
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
        ))
      )}

      {minhas.length > 0 && (
        <div className="votacao-minhas">
          <div className="votacao-minhas-titulo">Suas palavras (a mesa está votando)</div>
          {minhas.map((i) => (
            <div key={`${i.userId}:${i.themeKey}`} className="votacao-minha">
              <span className="votacao-tema-mini">{i.themeName}</span>
              <strong>{i.word}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
