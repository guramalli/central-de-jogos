import { useState } from "react";
import { useFila, pedirFila, destravarSom } from "./fila.js";

// Controle da fila de um jogo: fica no card do Início e na tela do jogo.
// Mostra quantos estão na fila (sem nomes) e deixa entrar, sair e — pra
// quem está na fila — "Começar agora (com bots)", que é sempre manual.
export default function FilaNoCard({ jogo, classe = "" }) {
  const { contagem, fila, proposta } = useFila();
  const [erro, setErro] = useState("");
  const noJogo = fila.jogo === jogo;
  const quantos = contagem?.[jogo] || 0;

  async function agir(evento, dados) {
    setErro("");
    const r = await pedirFila(evento, dados);
    if (r.erro) setErro(r.erro);
  }
  const entrar = (e) => { parar(e); destravarSom(); agir("fila-entrar", { jogo }); };
  const sair = (e) => { parar(e); agir("fila-sair"); };
  const comecar = (e) => { parar(e); destravarSom(); agir("fila-comecar-agora"); };

  if (proposta?.jogo === jogo) {
    return <div className={`v2-fila ${classe} ativa`}><b>Partida encontrada!</b> Confirme na janela.</div>;
  }

  if (!noJogo) {
    return (
      <div className={`v2-fila ${classe}`}>
        <span className="v2-fila-contagem">
          {quantos > 0 ? <><span className="v2-ponto-vivo" />{quantos === 1 ? "1 pessoa na fila" : `${quantos} na fila`}</> : "Fila vazia"}
        </span>
        <button type="button" className="v2-fila-botao" onClick={entrar}>Entrar na fila</button>
        {erro && <span className="v2-fila-erro" role="alert">{erro}</span>}
      </div>
    );
  }

  const faltam = Math.max(0, fila.minimo - fila.naFila);
  const fechando = fila.fechaEmMs != null; // atingiu o mínimo: esperando mais gente por alguns segundos
  return (
    <div className={`v2-fila ${classe} ativa`} role="status">
      <span className="v2-fila-contagem">
        <span className="v2-ponto-vivo" />
        <b>Você está na fila</b> · {fila.naFila} de {fila.minimo}
        {faltam > 0 ? ` (faltam ${faltam})` : fechando ? " · fechando o grupo…" : ""}
      </span>
      <div className="v2-fila-acoes">
        {fila.podeComecarAgora && (
          <button type="button" className="v2-fila-botao" onClick={comecar}>
            {fila.bots ? "Começar agora com bots" : "Começar agora"}
          </button>
        )}
        <button type="button" className="v2-fila-botao contorno" onClick={sair}>Sair da fila</button>
      </div>
      {erro && <span className="v2-fila-erro" role="alert">{erro}</span>}
    </div>
  );
}

// Dentro de um card que é link: o clique no controle não pode abrir o jogo.
function parar(e) { e?.preventDefault?.(); e?.stopPropagation?.(); }
