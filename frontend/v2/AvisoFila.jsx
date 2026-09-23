import { useEffect, useRef, useState } from "react";
import { useFila, pedirFila, limparFim, tocarPartidaEncontrada, NOMES_FILA } from "./fila.js";
import { irParaAcro, irParaPagina, linkDaPagina } from "./App.jsx";
import "./fila.css";

// Fica por cima de QUALQUER página da v2 (montado no main.jsx):
//   - "Partida encontrada!" com Aceitar/Recusar (ninguém vai pra sala sem
//     confirmar — pode estar no meio de um Stop);
//   - som + título da aba piscando pra chamar atenção;
//   - o aviso "Você está na fila do X" em qualquer página, com Sair;
//   - o recado quando a partida não sai ("você voltou pra fila"...).
export default function AvisoFila() {
  const { fila, proposta, fim } = useFila();
  const [, setTique] = useState(0);

  // Relógio da confirmação (20s).
  useEffect(() => {
    if (!proposta) return undefined;
    const t = setInterval(() => setTique((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [proposta?.id]);

  // Toca de novo aos 10s se ainda não respondeu; pisca o título da aba.
  const tituloOriginal = useRef(document.title);
  useEffect(() => {
    if (!proposta || proposta.eu === "aceitei") return undefined;
    tituloOriginal.current = document.title;
    let alterna = false;
    const pisca = setInterval(() => {
      alterna = !alterna;
      document.title = alterna ? "🔔 Partida encontrada!" : tituloOriginal.current;
    }, 900);
    const repete = setTimeout(tocarPartidaEncontrada, 10000);
    return () => { clearInterval(pisca); clearTimeout(repete); document.title = tituloOriginal.current; };
  }, [proposta?.id, proposta?.eu]);

  // Deu certo: vai pra sala. Deu errado: mostra o recado por alguns segundos.
  useEffect(() => {
    if (!fim) return undefined;
    if (fim.ok) {
      const d = fim.destino || {};
      limparFim();
      if (d.acro) { irParaAcro(d.acro); return undefined; }
      if (!d.pagina) return undefined;
      // Já está na página desse jogo (entrou na fila pela tela dele): a tela
      // guardou a sala de quando abriu, então recarrega no endereço novo.
      if (new URLSearchParams(window.location.search).get("pagina") === d.pagina) {
        window.location.assign(linkDaPagina(d.pagina, { mesa: d.mesa }));
      } else {
        irParaPagina(d.pagina, { mesa: d.mesa });
      }
      return undefined;
    }
    const t = setTimeout(limparFim, 7000);
    return () => clearTimeout(t);
  }, [fim?.em]);

  return (
    <>
      {proposta && <JanelaProposta proposta={proposta} />}
      {!proposta && fila.jogo && <ChipFila fila={fila} />}
      {fim && !fim.ok && (
        <div className="v2-fila-recado" role="status">
          <span>{fim.mensagem}</span>
          <button type="button" onClick={limparFim} aria-label="Fechar">✕</button>
        </div>
      )}
    </>
  );
}

function JanelaProposta({ proposta }) {
  const [enviando, setEnviando] = useState(false);
  const restante = Math.max(0, Math.ceil((proposta.prazoMs - (Date.now() - proposta.recebidaEm)) / 1000));
  const aceitei = proposta.eu === "aceitei";
  async function responder(aceitar) {
    setEnviando(true);
    await pedirFila(aceitar ? "fila-aceitar" : "fila-recusar", { id: proposta.id });
    setEnviando(false);
  }
  return (
    <div className="v2-fila-fundo">
      <div className="v2-fila-janela" role="alertdialog" aria-modal="true" aria-labelledby="v2-fila-titulo">
        <span className="v2-fila-relogio" aria-label={`${restante} segundos`}>{restante}</span>
        <h2 id="v2-fila-titulo">Partida encontrada!</h2>
        <p className="v2-fila-jogo">
          {proposta.nomeJogo} · {proposta.total} {proposta.total === 1 ? "jogador" : "jogadores"}
          {proposta.comBots && " + bots"}
        </p>
        <div className="v2-fila-bolinhas" aria-label={`${proposta.aceitos} de ${proposta.total} aceitaram`}>
          {Array.from({ length: proposta.total }, (_, i) => (
            <span key={i} className={i < proposta.aceitos ? "ok" : ""} />
          ))}
        </div>
        {aceitei ? (
          <p className="v2-fila-espera">Você aceitou! Esperando os outros confirmarem…</p>
        ) : (
          <>
            <p className="v2-fila-nota">Ao aceitar, você sai da página atual e vai direto pra sala.</p>
            <div className="v2-fila-janela-acoes">
              <button type="button" className="v2-botao v2-botao-amarelo" disabled={enviando} onClick={() => responder(true)} autoFocus>Aceitar</button>
              <button type="button" className="v2-botao v2-botao-contorno" disabled={enviando} onClick={() => responder(false)}>Recusar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChipFila({ fila }) {
  return (
    <div className="v2-fila-chip" role="status">
      <span className="v2-ponto-vivo" />
      <span>Na fila do <b>{NOMES_FILA[fila.jogo] || fila.jogo}</b> · {fila.naFila}/{fila.minimo}</span>
      <button type="button" onClick={() => pedirFila("fila-sair")}>Sair</button>
    </div>
  );
}
