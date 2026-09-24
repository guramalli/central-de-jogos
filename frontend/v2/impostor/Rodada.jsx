import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Carta from "./Carta.jsx";
import { AvatarImp, Cronometro, NOME_MODO, PontoPiscando, contarPalavras, modoDe, quem, useSegundos } from "./comum.jsx";

// CARTAS e DICAS.
//   computador: ordem das dicas à esquerda, carta ao centro, dicas à direita;
//   celular: a carta é uma etapa (CARTAS) e depois fica atrás do botão
//   "Ver minha carta" — as dicas ocupam a tela.
// História: a história (as frases, em ordem) é o centro da tela; a carta
// fica atrás do botão "Ver minha carta" também no computador.
export default function Rodada({ estado, carta, tempo, pedir }) {
  if (estado.fase === "CARTAS") return <EtapaCarta estado={estado} carta={carta} tempo={tempo} pedir={pedir} />;
  return <EtapaDicas estado={estado} carta={carta} tempo={tempo} pedir={pedir} />;
}

// Textos que mudam com o modo (palavra e situação: dicas; história: frases).
function textosDoModo(estado) {
  const modo = modoDe(estado);
  const lim = estado.limites || {};
  if (modo === "historia") {
    return {
      modo,
      coisa: "frase",
      ordem: "ORDEM DAS FRASES",
      feito: "escreveu",
      rotulo: "Sua frase",
      placeholder: "Continue a história…",
      ajuda: "Uma frase que continue a história, sem entregar o tema.",
      max: lim.caracteres || 120,
      palavras: null,
      pensando: "está escrevendo",
    };
  }
  if (modo === "situacao") {
    return {
      modo,
      coisa: "dica",
      ordem: "ORDEM DAS DICAS",
      feito: "deu a dica",
      rotulo: `Sua dica (até ${lim.palavras || 3} palavras)`,
      placeholder: "Digite sua dica",
      ajuda: `De 1 a ${lim.palavras || 3} palavras, sem usar palavras da situação.`,
      max: lim.caracteres || 40,
      palavras: lim.palavras || 3,
      pensando: "está pensando",
    };
  }
  return {
    modo,
    coisa: "dica",
    ordem: "ORDEM DAS DICAS",
    feito: "deu a dica",
    rotulo: "Sua dica (1 palavra)",
    placeholder: "Digite sua dica",
    ajuda: null,
    max: lim.caracteres || 24,
    palavras: null, // uma palavra: o servidor recusa com o motivo
    pensando: "está pensando",
  };
}

// Na pausa da última dica o relógio some (a contagem curta aparece no aviso
// da lista de dicas, sem o vermelho/tique de "tempo acabando").
function Cabecalho({ estado, tempo, titulo }) {
  return (
    <header className="imp-cabecalho-rodada">
      <span className="imp-rotulo">{titulo}</span>
      {!estado.ultimaDica && <Cronometro tempo={tempo} variante="pilula" />}
    </header>
  );
}

function EtapaCarta({ estado, carta, tempo, pedir }) {
  const [aberta, setAberta] = useState(false);
  const total = estado.jogadores.filter((j) => j.naPartida).length;
  const modo = modoDe(estado);
  // Pergunta não tem rodadas de dica: depois da carta vêm as respostas.
  const titulo = modo === "pergunta" ? "MODO PERGUNTA" : `RODADA 1 DE ${estado.totalRodadas}`;
  return (
    <div className="imp-etapa-carta">
      <Cabecalho estado={estado} tempo={tempo} titulo={titulo} />
      <div className="imp-etapa-carta-titulo">
        <h1 className="imp-titulo">SUA CARTA</h1>
        <p className="imp-sub">Cubra a tela. Só você pode ver.</p>
      </div>
      {estado.participo ? (
        <>
          <Carta carta={carta} modo={modo} aberta={aberta} aoVirar={setAberta} />
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
  const [cartaAberta, setCartaAberta] = useState(false);
  const modo = modoDe(estado);
  const historia = modo === "historia";
  const titulo = `RODADA ${estado.rodada} DE ${estado.totalRodadas}`;
  const textos = textosDoModo(estado);
  const verCarta = estado.participo && (
    <button className={`imp-botao secundario ${historia ? "pequeno" : "imp-so-celular"}`} onClick={() => setCartaAberta(true)}>Ver minha carta</button>
  );
  return (
    <div className={`imp-rodada ${historia ? "historia" : ""}`}>
      <Ordem estado={estado} textos={textos} />
      {historia ? (
        <div className="imp-rodada-historia">
          <div className="imp-rodada-historia-topo">
            <Cabecalho estado={estado} tempo={tempo} titulo={titulo} />
            {verCarta}
          </div>
          <Dicas estado={estado} tempo={tempo} pedir={pedir} textos={textos} />
        </div>
      ) : (
        <>
          <div className="imp-rodada-centro">
            <Cabecalho estado={estado} tempo={tempo} titulo={titulo} />
            {estado.participo && <Carta carta={carta} modo={modo} />}
            <p className="imp-nota">Dica: pressione espaço para esconder a carta rapidamente.</p>
          </div>
          <div className="imp-rodada-dicas">
            <div className="imp-so-celular imp-rodada-topo-celular">
              <Cabecalho estado={estado} tempo={tempo} titulo={titulo} />
              <p className="imp-sub">
                {modo === "palavra" ? <>Tema: <b>{estado.tema}</b></> : <>Modo <b>{NOME_MODO[modo]}</b> · dicas de até {estado.limites?.palavras || 3} palavras</>}
              </p>
            </div>
            <Dicas estado={estado} tempo={tempo} pedir={pedir} textos={textos} />
            {verCarta}
          </div>
        </>
      )}

      <AnimatePresence>
        {cartaAberta && (
          <motion.div
            className={`imp-sobreposicao ${historia ? "" : "imp-so-celular"}`}
            role="dialog"
            aria-modal="true"
            aria-label="Sua carta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Carta carta={carta} modo={modo} />
            <button className="imp-botao principal" onClick={() => setCartaAberta(false)}>Fechar</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Ordem das dicas + o que cada um disse nas rodadas anteriores (um chip por
// rodada, na cor do jogador, ao lado do status). Assim o histórico não
// precisa de uma lista própria — com 12 jogadores ela ficava enorme.
// História: a frase inteira não cabe no chip; ele só marca que escreveu
// (a frase fica no "title" e na própria história, ao lado).
// Com mais de 6 jogadores a lista fica mais justa (avatar menor).
function Ordem({ estado, textos }) {
  const daRodada = estado.dicas.filter((d) => d.rodada === estado.rodada);
  const muitos = estado.ordem.length > 6;
  const historia = textos.modo === "historia";
  return (
    <section className={`imp-ordem ${muitos ? "muitos" : ""}`} aria-label={textos.ordem.toLowerCase()}>
      <h2 className="imp-rotulo">{textos.ordem}</h2>
      <ol>
        {estado.ordem.map((id) => {
          const p = quem(estado, id);
          const deu = daRodada.some((d) => d.jogadorId === id);
          const vez = estado.vezDe === id;
          const eu = id === estado.euId;
          const status = vez ? (eu ? "sua vez!" : "na vez") : deu ? textos.feito : eu ? "aguardando (você)" : "aguardando";
          const antigas = estado.dicas.filter((d) => d.jogadorId === id && d.rodada < estado.rodada);
          return (
            <li key={id} className={`imp-ordem-item ${vez ? "vez" : ""} ${deu ? "feito" : ""}`} style={{ "--imp-cor-jogador": p.cor }}>
              <AvatarImp nome={p.nickname} cor={p.cor} tamanho={muitos ? 32 : 40} />
              <span className="imp-ordem-texto">
                <b>{p.nickname}{eu ? " (você)" : ""}</b>
                <span className="imp-ordem-linha">
                  <small>{status}</small>
                  {antigas.map((d) => (
                    <span key={d.rodada} className="imp-chip-dica" title={`Rodada ${d.rodada}: ${d.texto || "(em branco)"}`}>
                      <i aria-hidden="true">R{d.rodada}</i>
                      <span className="imp-leitor">, rodada {d.rodada}: </span>
                      {historia ? (
                        <b className={d.texto ? "imp-chip-ok" : "imp-branco"}>
                          {d.texto
                            ? <><span aria-hidden="true">✓</span><span className="imp-leitor">escreveu uma frase</span></>
                            : <><span aria-hidden="true">—</span><span className="imp-leitor">em branco</span></>}
                        </b>
                      ) : (
                        <b className={d.texto ? "" : "imp-branco"}>
                          {d.texto || <><span aria-hidden="true">—</span><span className="imp-leitor">em branco</span></>}
                        </b>
                      )}
                    </span>
                  ))}
                </span>
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

// Aviso da pausa depois da última dica da rodada, com a contagem curta.
function AvisoUltimaDica({ estado, tempo, textos }) {
  const s = useSegundos(tempo);
  const proxima = estado.rodada < estado.totalRodadas
    ? `A rodada ${estado.rodada + 1} começa`
    : "A votação começa";
  return (
    <p className="imp-fechando" role="status">
      <PontoPiscando cor="ambar" />
      <span>Última {textos.coisa} da rodada! {proxima}{s ? ` em ${s}s` : " já"}…</span>
    </p>
  );
}

function Dicas({ estado, tempo, pedir, textos }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [recusa, setRecusa] = useState("");
  const minhaVez = estado.vezDe === estado.euId;
  const campo = useRef(null);
  useEffect(() => { if (minhaVez) campo.current?.focus(); else setRecusa(""); }, [minhaVez]);
  const vez = estado.vezDe ? quem(estado, estado.vezDe) : null;
  const destaque = estado.ultimaDica;
  const historia = textos.modo === "historia";
  const nPalavras = contarPalavras(texto);
  const demais = textos.palavras != null && nPalavras > textos.palavras;

  async function enviar(e) {
    e?.preventDefault();
    if (!texto.trim() || enviando || demais) return;
    setEnviando(true);
    const r = await pedir("impostor-dica", { texto: texto.trim() }, { avisoNoTopo: false });
    setEnviando(false);
    if (r.ok) { setTexto(""); setRecusa(""); return; }
    // Dica recusada: a vez continua sua e o relógio segue de onde estava
    // (o servidor não reinicia nada). Mostra o motivo junto do campo, mantém
    // o texto pra corrigir e devolve o foco.
    setRecusa(r.erro || "");
    campo.current?.focus();
    campo.current?.select();
  }

  const propsCampo = {
    id: "imp-dica",
    ref: campo,
    className: `imp-campo ${historia ? "imp-campo-frase" : ""}`,
    maxLength: textos.max,
    autoComplete: "off",
    disabled: !minhaVez,
    value: texto,
    onChange: (e) => { setTexto(historia ? e.target.value.replace(/\n/g, " ") : e.target.value); if (recusa) setRecusa(""); },
    placeholder: minhaVez ? textos.placeholder : "Aguarde sua vez",
    "aria-invalid": !!recusa || demais,
    "aria-describedby": recusa ? "imp-dica-recusa" : textos.ajuda ? "imp-dica-ajuda" : undefined,
  };
  const botao = (
    <button className="imp-botao principal compacto" type="submit" disabled={!minhaVez || !texto.trim() || enviando || demais}>Enviar</button>
  );

  // Ordem do painel: campo da dica e avisos EM CIMA (fixos, fáceis de achar)
  // e a lista compacta da rodada embaixo — uma linha por dica, a mais nova
  // no fim. As rodadas anteriores ficam na "Ordem das dicas", ao lado de
  // cada jogador. Na história, embaixo vem a história inteira.
  return (
    <section className={`imp-painel imp-dicas ${historia ? "historia" : ""}`} aria-label={historia ? "História" : "Dicas"}>
      {estado.participo && (
        <form className="imp-dica-form" onSubmit={enviar}>
          <label htmlFor="imp-dica" className={minhaVez ? "sua-vez" : ""}>{minhaVez ? `Sua vez! ${textos.rotulo}` : textos.rotulo}</label>
          {historia ? (
            // Enter envia (a frase é uma linha só); o campo cresce pra 2-3
            // linhas pra dar pra reler antes de mandar.
            <div className="imp-frase-linha">
              <textarea
                {...propsCampo}
                rows={2}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              />
              {botao}
            </div>
          ) : (
            <div className="imp-dica-linha">
              <input {...propsCampo} />
              {botao}
            </div>
          )}
          {(textos.ajuda || textos.palavras != null || historia) && minhaVez && (
            <p id="imp-dica-ajuda" className="imp-dica-ajuda">
              {textos.ajuda && <span>{textos.ajuda}</span>}
              <span className={`imp-contador ${demais || texto.length >= textos.max ? "cheio" : ""}`}>
                {textos.palavras != null && <>{nPalavras} de {textos.palavras} palavras · </>}
                {texto.length}/{textos.max}
              </span>
            </p>
          )}
          {recusa && (
            <p id="imp-dica-recusa" className="imp-dica-recusa" role="alert">
              {recusa} Tente outra — a vez continua sua.
            </p>
          )}
        </form>
      )}
      {destaque && <AvisoUltimaDica estado={estado} tempo={tempo} textos={textos} />}
      {!minhaVez && vez && (
        <p className="imp-pensando"><PontoPiscando cor="ambar" />{vez.nickname} {textos.pensando}…</p>
      )}
      {historia ? <Historia estado={estado} /> : <ListaDaRodada estado={estado} />}
    </section>
  );
}

function ListaDaRodada({ estado }) {
  const daRodada = estado.dicas.filter((d) => d.rodada === estado.rodada);
  const destaque = estado.ultimaDica;
  return (
    <div className="imp-dicas-lista">
      <h2 className="imp-rotulo">DICAS DA RODADA {estado.rodada}</h2>
      {daRodada.length === 0 ? (
        <p className="imp-nota">Nenhuma dica ainda nesta rodada.</p>
      ) : (
        <ul aria-live="polite">
          {daRodada.map((d) => {
            const p = quem(estado, d.jogadorId);
            const ultima = destaque?.rodada === d.rodada && destaque?.jogadorId === d.jogadorId;
            return (
              <motion.li key={`${d.rodada}-${d.jogadorId}`} className={`imp-dica ${ultima ? "ultima" : ""}`} style={{ "--imp-cor-jogador": p.cor }} {...ENTRADA_DICA}>
                <AvatarImp nome={p.nickname} cor={p.cor} tamanho={24} />
                <span className="imp-dica-quem">
                  <span className="imp-dica-nome">{p.nickname}{d.jogadorId === estado.euId ? " (você)" : ""}</span>
                  {ultima && <span className="imp-dica-selo">ÚLTIMA DICA</span>}
                </span>
                <b className={`imp-dica-texto ${d.texto ? "" : "imp-branco"}`}>{d.texto || "(em branco)"}</b>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// A história até agora: um parágrafo por rodada, as frases em ordem, cada
// uma com o nome do autor na cor dele (e um filete da cor embaixo). Texto
// corrido ocupa bem menos que uma linha por frase — com 12 jogadores e 2
// rodadas são 24 frases.
function Historia({ estado }) {
  const destaque = estado.ultimaDica;
  const rodadas = Array.from({ length: estado.rodada }, (_, i) => i + 1);
  const temFrase = estado.dicas.length > 0;
  return (
    <div className="imp-historia">
      <h2 className="imp-rotulo">A HISTÓRIA ATÉ AGORA</h2>
      {!temFrase ? (
        <p className="imp-nota">A história começa com a primeira frase…</p>
      ) : (
        <div aria-live="polite">
          {rodadas.map((r) => {
            const frases = estado.dicas.filter((d) => d.rodada === r);
            if (frases.length === 0) return null;
            return (
              <section key={r} className="imp-historia-rodada">
                {estado.rodada > 1 && <h3 className="imp-historia-rodada-titulo">Rodada {r}</h3>}
                <p className="imp-historia-texto">
                  {frases.map((d) => {
                    const p = quem(estado, d.jogadorId);
                    const ultima = destaque?.rodada === d.rodada && destaque?.jogadorId === d.jogadorId;
                    return (
                      <motion.span
                        key={`${d.rodada}-${d.jogadorId}`}
                        className={`imp-frase ${ultima ? "ultima" : ""} ${d.texto ? "" : "vazia"}`}
                        style={{ "--imp-cor-jogador": p.cor }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <b className="imp-frase-nome">{p.nickname}{d.jogadorId === estado.euId ? " (você)" : ""}</b>
                        {ultima && <span className="imp-dica-selo">ÚLTIMA FRASE</span>}
                        {" "}
                        <span className="imp-frase-texto">{d.texto || "(ficou em branco)"}</span>
                        {" "}
                      </motion.span>
                    );
                  })}
                </p>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
