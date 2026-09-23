import { useState } from "react";
import { useFila, pedirFila, destravarSom } from "./fila.js";

// FILA DE ESPERA — a pessoa COLOCA O NOME na fila e segue a vida (navega,
// joga outra coisa); quando juntar gente, é chamada pra confirmar. Não é
// "partida rápida": muitas vezes não tem ninguém esperando na hora.
// Três formas de mostrar o mesmo controle:
//   <CardPartidaRapida> card do jogo no Início, com a fila no rodapé;
//   <PartidaRapida>     bloco "Fila de espera" na página do jogo;
//   <FilaNoCard>        só os controles (ex.: tela escura do Impostor).
// Bots são sempre manuais ("Começar agora com bots").

function Bolinhas({ n, total }) {
  return (
    <span className="v2-fila-bolinhas-mini" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => <span key={i} className={i < n ? "ok" : ""} />)}
    </span>
  );
}

// Controles: "Colocar meu nome na fila" / nome na fila / partida encontrada.
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

  const e = fila.filas?.[jogo];
  if (!e) {
    return (
      <div className="v2-fila-controles">
        <button type="button" className="v2-fila-jogar" disabled={enviando || !!proposta} title={proposta ? "Confirme a partida encontrada primeiro" : undefined} onClick={(ev) => agir(ev, "fila-entrar", { jogo })}>
          ✋ Colocar meu nome na fila
        </button>
        <div className="v2-fila-linha">
          <p className="v2-fila-dica">
            {quantos > 0
              ? <><b>{quantos}</b> {quantos === 1 ? "nome na fila" : "nomes na fila"} — faltam poucos!</>
              : "Ninguém esperando agora. Deixe seu nome e a gente te chama."}
          </p>
          {verSalas}
        </div>
        {erro && <p className="v2-fila-erro" role="alert">{erro}</p>}
      </div>
    );
  }

  if (e.pausado) {
    return (
      <div className="v2-fila-controles" role="status">
        <p className="v2-fila-status">⏸ Seu nome continua aqui, pausado enquanto você confirma outra partida.</p>
      </div>
    );
  }

  const faltam = Math.max(0, e.minimo - e.naFila);
  return (
    <div className="v2-fila-controles" role="status">
      <p className="v2-fila-status">
        <span className="v2-fila-radar" aria-hidden="true" />
        {faltam > 0 ? "Seu nome está na fila" : e.fechaEmMs != null ? "Juntou gente! Fechando o grupo…" : "Montando a partida…"}
        <span className="v2-fila-progresso">
          <Bolinhas n={Math.min(e.naFila, e.minimo)} total={e.minimo} />
          <b>{e.naFila}/{e.minimo}</b>
        </span>
      </p>
      {faltam > 0 && (
        <p className="v2-fila-dica">
          {faltam === 1 ? "Falta 1 pessoa." : `Faltam ${faltam} pessoas.`} Pode navegar ou jogar outra coisa — quando juntar, a gente te chama.
        </p>
      )}
      <div className="v2-fila-linha">
        {e.podeComecarAgora && (
          <button type="button" className="v2-fila-jogar secundario" disabled={enviando} onClick={(ev) => agir(ev, "fila-comecar-agora", { jogo })}>
            {e.bots ? "🤖 Jogar agora com bots" : "Começar com quem está"}
          </button>
        )}
        <button type="button" className="v2-fila-sair" disabled={enviando} onClick={(ev) => agir(ev, "fila-sair", { jogo })}>Tirar meu nome</button>
      </div>
      {erro && <p className="v2-fila-erro" role="alert">{erro}</p>}
    </div>
  );
}

// Card do jogo no Início (fileira "Fila de espera").
export function CardPartidaRapida({ jogo, logo, titulo, nome, texto, cor, sombra, beta, online, hrefSalas, aoVerSalas, atraso = 0 }) {
  const { contagem, fila, proposta } = useFila();
  const quantos = contagem?.[jogo] || 0;
  const ativo = !!fila.filas?.[jogo] || proposta?.jogo === jogo;
  return (
    <article className={`v2-jogo-card v2-jogo-card-rapido ${ativo ? "na-fila" : ""}`} style={{ "--cor": cor, "--sombra": sombra, animationDelay: `${atraso}ms` }}>
      <div className="v2-jogo-card-selos">
        {quantos > 0 && !ativo && <span className="v2-fila-esperando">🔥 {quantos} na fila</span>}
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

// "Colocar meu nome em todas as filas" (título da fileira no Início): pra
// quem topa jogar o que juntar gente primeiro.
export function BotaoTodasAsFilas({ jogos }) {
  const { fila, proposta } = useFila();
  const [erro, setErro] = useState("");
  const emTodas = jogos.every((j) => fila.filas?.[j]);
  async function clicar() {
    if (!emTodas) destravarSom();
    setErro("");
    const r = await pedirFila(emTodas ? "fila-sair" : "fila-entrar-todas");
    if (r.erro) setErro(r.erro);
  }
  return (
    <div className="v2-fila-todas">
      <button type="button" className={`v2-fila-jogar ${emTodas ? "contorno" : ""}`} disabled={!!proposta} onClick={clicar}>
        {emTodas ? "Tirar meu nome de todas" : "✋ Colocar meu nome em todas as filas"}
      </button>
      {erro && <p className="v2-fila-erro" role="alert">{erro}</p>}
    </div>
  );
}

// Bloco na página do jogo.
export function PartidaRapida({ jogo }) {
  return (
    <section className="v2-cartao v2-partida-rapida">
      <div>
        <h2>📝 Fila de espera</h2>
        <p className="v2-cartao-nota">Coloque seu nome na fila e continue navegando ou jogando outra coisa. Quando juntar gente suficiente, a gente te chama pra confirmar.</p>
      </div>
      <ControlesFila jogo={jogo} />
    </section>
  );
}

// Só os controles (tela escura do Impostor).
export default function FilaNoCard({ jogo, classe = "" }) {
  return <div className={`v2-fila-solta ${classe}`}><ControlesFila jogo={jogo} /></div>;
}
