import { useEffect, useRef, useState } from "react";
import Carta from "./Carta.jsx";
import { AvatarImp, Cronometro, quem } from "./comum.jsx";

// CARTAS e DICAS.
//   computador: ordem das dicas à esquerda, carta ao centro, dicas à direita;
//   celular: a carta é uma etapa (CARTAS) e depois fica atrás do botão
//   "Ver minha carta" — as dicas ocupam a tela.
export default function Rodada({ estado, carta, tempo, pedir }) {
  const [cartaNoCelular, setCartaNoCelular] = useState(false);
  const cartas = estado.fase === "CARTAS";

  if (cartas) {
    const total = estado.jogadores.filter((j) => j.naPartida).length;
    return (
      <div className="imp-etapa-carta">
        <Cabecalho estado={estado} tempo={tempo} titulo="SUA CARTA" />
        {estado.participo ? (
          <>
            <Carta carta={carta} />
            {estado.cartaVista ? (
              <p className="imp-sub">Pronto! Esperando os outros ({estado.cartasVistas} de {total})…</p>
            ) : (
              <button className="imp-botao" onClick={() => pedir("impostor-carta-vista")}>Entendi, estou pronto</button>
            )}
          </>
        ) : (
          <p className="imp-sub">Os jogadores estão vendo as cartas…</p>
        )}
      </div>
    );
  }

  return (
    <div className="imp-rodada">
      <Cabecalho estado={estado} tempo={tempo} titulo={`RODADA ${estado.rodada} DE ${estado.totalRodadas}`} />
      <div className="imp-rodada-grade">
        <Ordem estado={estado} />
        <div className="imp-rodada-carta">
          {estado.participo && <Carta carta={carta} />}
          <p className="imp-nota imp-so-computador">Dica: aperte espaço para esconder a carta.</p>
        </div>
        <Dicas estado={estado} pedir={pedir} />
      </div>

      {estado.participo && (
        <button className="imp-botao contorno imp-so-celular" onClick={() => setCartaNoCelular(true)}>Ver minha carta</button>
      )}
      {cartaNoCelular && (
        <div className="imp-sobreposicao imp-so-celular" role="dialog" aria-modal="true" aria-label="Sua carta">
          <Carta carta={carta} />
          <button className="imp-botao" onClick={() => setCartaNoCelular(false)}>Fechar</button>
        </div>
      )}
    </div>
  );
}

function Cabecalho({ estado, tempo, titulo }) {
  return (
    <header className="imp-cabecalho">
      <div>
        <span className="imp-rotulo">{titulo}</span>
        <b className="imp-tema">Tema: {estado.tema}</b>
      </div>
      <Cronometro tempo={tempo} />
    </header>
  );
}

function Ordem({ estado }) {
  const daRodada = estado.dicas.filter((d) => d.rodada === estado.rodada);
  return (
    <section className="imp-painel imp-ordem" aria-label="Ordem das dicas">
      <h2 className="imp-rotulo">ORDEM DAS DICAS</h2>
      <ol>
        {estado.ordem.map((id) => {
          const p = quem(estado, id);
          const deu = daRodada.some((d) => d.jogadorId === id);
          const vez = estado.vezDe === id;
          return (
            <li key={id} className={`imp-ordem-item ${vez ? "vez" : ""} ${deu ? "feito" : ""}`}>
              <AvatarImp nome={p.nickname} cor={p.cor} tamanho={36} />
              <span>{p.nickname}{id === estado.euId ? " (você)" : ""}</span>
              <small>{vez ? "na vez" : deu ? "deu a dica" : "aguardando"}</small>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Dicas({ estado, pedir }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const minhaVez = estado.vezDe === estado.euId;
  const campo = useRef(null);
  useEffect(() => { if (minhaVez) campo.current?.focus(); }, [minhaVez]);
  const vez = estado.vezDe ? quem(estado, estado.vezDe) : null;

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    const r = await pedir("impostor-dica", { texto: texto.trim() });
    setEnviando(false);
    if (r.ok) setTexto("");
  }

  return (
    <section className="imp-painel imp-dicas" aria-label="Dicas">
      <h2 className="imp-rotulo">DICAS</h2>
      {[1, 2].filter((r) => r <= estado.rodada).map((r) => {
        const lista = estado.dicas.filter((d) => d.rodada === r);
        return (
          <div key={r} className="imp-dicas-rodada">
            {estado.rodada > 1 && <span className="imp-nota">Rodada {r}</span>}
            <ul aria-live="polite">
              {lista.map((d) => {
                const p = quem(estado, d.jogadorId);
                return (
                  <li key={`${r}-${d.jogadorId}`} className="imp-dica">
                    <AvatarImp nome={p.nickname} cor={p.cor} tamanho={28} />
                    <span className="imp-dica-nome">{p.nickname}</span>
                    <b className={d.texto ? "" : "imp-branco"}>{d.texto || "(em branco)"}</b>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {!minhaVez && vez && <p className="imp-nota imp-pensando">{vez.nickname} está pensando…</p>}
      {estado.participo && (
        <form className="imp-dica-form" onSubmit={enviar}>
          <label htmlFor="imp-dica" className="imp-rotulo">{minhaVez ? "SUA VEZ — sua dica (1 palavra)" : "Sua dica (1 palavra)"}</label>
          <div className="imp-dica-linha">
            <input
              id="imp-dica"
              ref={campo}
              className="imp-campo"
              maxLength={24}
              autoComplete="off"
              disabled={!minhaVez}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={minhaVez ? "Digite sua dica" : "Espere a sua vez"}
            />
            <button className="imp-botao" type="submit" disabled={!minhaVez || !texto.trim() || enviando}>Enviar</button>
          </div>
        </form>
      )}
    </section>
  );
}
