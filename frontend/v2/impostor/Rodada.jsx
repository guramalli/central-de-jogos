import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Carta from "./Carta.jsx";
import { AvatarImp, Cronometro, PontoPiscando, quem } from "./comum.jsx";

// CARTAS e DICAS.
//   computador: ordem das dicas à esquerda, carta ao centro, dicas à direita;
//   celular: a carta é uma etapa (CARTAS) e depois fica atrás do botão
//   "Ver minha carta" — as dicas ocupam a tela.
export default function Rodada({ estado, carta, tempo, pedir }) {
  if (estado.fase === "CARTAS") return <EtapaCarta estado={estado} carta={carta} tempo={tempo} pedir={pedir} />;
  return <EtapaDicas estado={estado} carta={carta} tempo={tempo} pedir={pedir} />;
}

function Cabecalho({ estado, tempo, titulo }) {
  return (
    <header className="imp-cabecalho-rodada">
      <span className="imp-rotulo">{titulo}</span>
      <Cronometro tempo={tempo} variante="pilula" />
    </header>
  );
}

function EtapaCarta({ estado, carta, tempo, pedir }) {
  const [aberta, setAberta] = useState(false);
  const total = estado.jogadores.filter((j) => j.naPartida).length;
  return (
    <div className="imp-etapa-carta">
      <Cabecalho estado={estado} tempo={tempo} titulo={`RODADA 1 DE ${estado.totalRodadas}`} />
      <div className="imp-etapa-carta-titulo">
        <h1 className="imp-titulo">SUA CARTA</h1>
        <p className="imp-sub">Cubra a tela. Só você pode ver.</p>
      </div>
      {estado.participo ? (
        <>
          <Carta carta={carta} aberta={aberta} aoVirar={setAberta} />
          <div className="imp-acoes coluna">
            <button className="imp-botao secundario" onClick={() => setAberta((a) => !a)}>{aberta ? "Esconder carta" : "Revelar carta"}</button>
            {estado.cartaVista ? (
              <p className="imp-nota-status"><PontoPiscando cor="verde" />Pronto! Esperando os outros ({estado.cartasVistas} de {total})…</p>
            ) : (
              <button className="imp-botao principal" onClick={() => pedir("impostor-carta-vista")}>Entendi, estou pronto</button>
            )}
          </div>
        </>
      ) : (
        <p className="imp-sub">Os jogadores estão vendo as cartas…</p>
      )}
    </div>
  );
}

function EtapaDicas({ estado, carta, tempo, pedir }) {
  const [cartaNoCelular, setCartaNoCelular] = useState(false);
  const titulo = `RODADA ${estado.rodada} DE ${estado.totalRodadas}`;
  return (
    <div className="imp-rodada">
      <Ordem estado={estado} />
      <div className="imp-rodada-centro">
        <Cabecalho estado={estado} tempo={tempo} titulo={titulo} />
        {estado.participo && <Carta carta={carta} />}
        <p className="imp-nota">Dica: pressione espaço para esconder a carta rapidamente.</p>
      </div>
      <div className="imp-rodada-dicas">
        <div className="imp-so-celular imp-rodada-topo-celular">
          <Cabecalho estado={estado} tempo={tempo} titulo={titulo} />
          <p className="imp-sub">Tema: <b>{estado.tema}</b></p>
        </div>
        <Dicas estado={estado} pedir={pedir} />
        {estado.participo && (
          <button className="imp-botao secundario imp-so-celular" onClick={() => setCartaNoCelular(true)}>Ver minha carta</button>
        )}
      </div>

      <AnimatePresence>
        {cartaNoCelular && (
          <motion.div
            className="imp-sobreposicao imp-so-celular"
            role="dialog"
            aria-modal="true"
            aria-label="Sua carta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Carta carta={carta} />
            <button className="imp-botao principal" onClick={() => setCartaNoCelular(false)}>Fechar</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Ordem({ estado }) {
  const daRodada = estado.dicas.filter((d) => d.rodada === estado.rodada);
  return (
    <section className="imp-ordem" aria-label="Ordem das dicas">
      <h2 className="imp-rotulo">ORDEM DAS DICAS</h2>
      <ol>
        {estado.ordem.map((id) => {
          const p = quem(estado, id);
          const deu = daRodada.some((d) => d.jogadorId === id);
          const vez = estado.vezDe === id;
          const eu = id === estado.euId;
          const status = vez ? (eu ? "sua vez!" : "na vez") : deu ? "deu a dica" : eu ? "aguardando (você)" : "aguardando";
          return (
            <li key={id} className={`imp-ordem-item ${vez ? "vez" : ""} ${deu ? "feito" : ""}`}>
              <AvatarImp nome={p.nickname} cor={p.cor} tamanho={40} />
              <span className="imp-ordem-texto">
                <b>{p.nickname}</b>
                <small>{status}</small>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// Dica chegando: entra de baixo com um leve "bounce".
const ENTRADA_DICA = {
  initial: { y: 28, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { type: "spring", stiffness: 520, damping: 18 },
};

function Dicas({ estado, pedir }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const minhaVez = estado.vezDe === estado.euId;
  const campo = useRef(null);
  useEffect(() => { if (minhaVez) campo.current?.focus(); }, [minhaVez]);
  const vez = estado.vezDe ? quem(estado, estado.vezDe) : null;
  const daRodada = estado.dicas.filter((d) => d.rodada === estado.rodada);
  const anteriores = estado.dicas.filter((d) => d.rodada < estado.rodada);

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
      {anteriores.length > 0 && (
        <div className="imp-dicas-anteriores">
          <span className="imp-rotulo">RODADA 1</span>
          <p>{anteriores.map((d) => `${quem(estado, d.jogadorId).nickname}: ${d.texto || "—"}`).join(" · ")}</p>
        </div>
      )}
      <h2 className="imp-rotulo">DICAS DA RODADA</h2>
      <ul aria-live="polite">
        {daRodada.map((d) => (
          <motion.li key={`${d.rodada}-${d.jogadorId}`} className="imp-dica" {...ENTRADA_DICA}>
            <span className="imp-dica-nome">{quem(estado, d.jogadorId).nickname}</span>
            <b className={`imp-dica-texto ${d.texto ? "" : "imp-branco"}`}>{d.texto || "(em branco)"}</b>
          </motion.li>
        ))}
      </ul>
      {!minhaVez && vez && (
        <p className="imp-pensando"><PontoPiscando cor="ambar" />{vez.nickname} está pensando…</p>
      )}
      {estado.participo && (
        <form className="imp-dica-form" onSubmit={enviar}>
          <label htmlFor="imp-dica" className={minhaVez ? "sua-vez" : ""}>{minhaVez ? "Sua vez! Sua dica (1 palavra)" : "Sua dica (1 palavra)"}</label>
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
              placeholder={minhaVez ? "Digite sua dica" : "Aguarde sua vez"}
            />
            <button className="imp-botao principal compacto" type="submit" disabled={!minhaVez || !texto.trim() || enviando}>Enviar</button>
          </div>
        </form>
      )}
    </section>
  );
}
