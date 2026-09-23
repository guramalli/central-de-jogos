import { useState } from "react";
import { useFila, pedirFila, destravarSom } from "./fila.js";

// FILA DE ESPERA ("Partida rápida") — três formas de mostrar o mesmo controle:
//   <CardPartidaRapida> card do jogo no Início, com a fila no rodapé;
//   <PartidaRapida>     bloco "⚡ Partida rápida" na página do jogo;
//   <FilaNoCard>        só os controles (ex.: tela escura do Impostor).
// Bots são sempre manuais ("Começar agora com bots").

function Bolinhas({ n, total }) {
  return (
    <span className="v2-fila-bolinhas-mini" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => <span key={i} className={i < n ? "ok" : ""} />)}
    </span>
  );
}

// Controles: "Jogar agora" / progresso na fila / partida encontrada.
function ControlesFila({ jogo, verSalas = null }) {
  const { contagem, fila, proposta } = useFila();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const quantos = contagem?.[jogo] || 0;

  async function agir(e, evento, dados) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (evento !== "fila-sair") destravarSom(); // o som de "partida encontrada" precisa de um clique antes
    setErro("");
    setEnviando(true);
    const r = await pedirFila(evento, dados);
    setEnviando(false);
    if (r.erro) setErro(r.erro);
  }

  if (proposta?.jogo === jogo) {
    return (
      <div className="v2-fila-controles">
        <p className="v2-fila-status destaque">🔔 Partida encontrada! Confirme na janela.</p>
      </div>
    );
  }

  if (fila.jogo !== jogo) {
    return (
      <div className="v2-fila-controles">
        <div className="v2-fila-linha">
          <button type="button" className="v2-fila-jogar" disabled={enviando} onClick={(e) => agir(e, "fila-entrar", { jogo })}>
            ⚡ Jogar agora
          </button>
          {verSalas}
        </div>
        <p className="v2-fila-dica">
          {quantos > 0 ? <><b>{quantos}</b> {quantos === 1 ? "pessoa esperando" : "pessoas esperando"} — entra que já junta!</> : "Ninguém na fila ainda. Seja o primeiro!"}
        </p>
        {erro && <p className="v2-fila-erro" role="alert">{erro}</p>}
      </div>
    );
  }

  const faltam = Math.max(0, fila.minimo - fila.naFila);
  return (
    <div className="v2-fila-controles" role="status">
      <p className="v2-fila-status">
        <span className="v2-fila-radar" aria-hidden="true" />
        {faltam > 0 ? "Procurando jogadores…" : fila.fechaEmMs != null ? "Grupo fechando…" : "Montando a partida…"}
        <span className="v2-fila-progresso">
          <Bolinhas n={Math.min(fila.naFila, fila.minimo)} total={fila.minimo} />
          <b>{fila.naFila}/{fila.minimo}</b>
        </span>
      </p>
      <div className="v2-fila-linha">
        {fila.podeComecarAgora && (
          <button type="button" className="v2-fila-jogar secundario" disabled={enviando} onClick={(e) => agir(e, "fila-comecar-agora")}>
            {fila.bots ? "🤖 Começar com bots" : "Começar agora"}
          </button>
        )}
        <button type="button" className="v2-fila-sair" disabled={enviando} onClick={(e) => agir(e, "fila-sair")}>Sair da fila</button>
      </div>
      {erro && <p className="v2-fila-erro" role="alert">{erro}</p>}
    </div>
  );
}

// Card do jogo no Início (fileira "Partida rápida").
export function CardPartidaRapida({ jogo, logo, titulo, nome, texto, cor, sombra, beta, online, hrefSalas, aoVerSalas, atraso = 0 }) {
  const { contagem, fila, proposta } = useFila();
  const quantos = contagem?.[jogo] || 0;
  const ativo = fila.jogo === jogo || proposta?.jogo === jogo;
  return (
    <article className={`v2-jogo-card v2-jogo-card-rapido ${ativo ? "na-fila" : ""}`} style={{ "--cor": cor, "--sombra": sombra, animationDelay: `${atraso}ms` }}>
      <div className="v2-jogo-card-selos">
        {quantos > 0 && !ativo && <span className="v2-fila-esperando">🔥 {quantos} esperando</span>}
        {beta && <span className="v2-jogo-card-beta">em testes</span>}
      </div>
      {logo ? <img src={logo} alt={nome} /> : <span className="v2-jogo-card-titulo">{titulo}</span>}
      {online > 0 && <span className="v2-jogo-card-online"><span className="v2-ponto-vivo" />{online} jogando agora</span>}
      <p>{texto}</p>
      <ControlesFila
        jogo={jogo}
        verSalas={<a className="v2-fila-ver-salas" href={hrefSalas} onClick={aoVerSalas}>Ver salas</a>}
      />
    </article>
  );
}

// Bloco na página do jogo.
export function PartidaRapida({ jogo }) {
  return (
    <section className="v2-cartao v2-partida-rapida">
      <div>
        <h2>⚡ Partida rápida</h2>
        <p className="v2-cartao-nota">Entre na fila e jogue com quem estiver esperando. Quando juntar gente, aparece “Partida encontrada” — é só aceitar.</p>
      </div>
      <ControlesFila jogo={jogo} />
    </section>
  );
}

// Só os controles (tela escura do Impostor).
export default function FilaNoCard({ jogo, classe = "" }) {
  return <div className={`v2-fila-solta ${classe}`}><ControlesFila jogo={jogo} /></div>;
}
