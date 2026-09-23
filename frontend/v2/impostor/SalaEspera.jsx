import { useState } from "react";
import { AvatarImp } from "./comum.jsx";

const MODOS = [
  { nome: "Palavra", texto: "Todos sabem a palavra, menos um.", ativo: true },
  { nome: "Situação", texto: "Em breve" },
  { nome: "Pergunta", texto: "Em breve" },
  { nome: "História", texto: "Em breve" },
];

// Sala de espera: código + link, modos, jogadores e o botão de iniciar.
export default function SalaEspera({ estado, pedir, aoSair }) {
  const [copiado, setCopiado] = useState(false);
  const { jogadores, minJogadores, maxJogadores } = estado;
  const souAnfitriao = estado.anfitriaoId === estado.euId;
  const conectados = jogadores.filter((j) => j.conectado).length;
  const faltam = Math.max(0, minJogadores - conectados);
  // Vagas tracejadas até completar a próxima fileira de 4 (sem passar do máximo).
  const vagas = Math.max(0, Math.min(maxJogadores, Math.max(minJogadores, Math.ceil((jogadores.length + 1) / 4) * 4)) - jogadores.length);

  async function copiarLink() {
    const link = `${window.location.origin}/v2/?pagina=impostor&mesa=${encodeURIComponent(estado.codigo)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt("Copie o link da sala:", link);
    }
  }

  return (
    <div className="imp-espera">
      <section className="imp-painel imp-espera-topo">
        <div>
          <h1 className="imp-titulo">O IMPOSTOR</h1>
          <p className="imp-sub">Um de vocês não sabe a palavra. Descubra quem.</p>
        </div>
        <div className="imp-codigo">
          <span className="imp-rotulo">CÓDIGO DA SALA</span>
          <b className="imp-codigo-valor">{estado.codigo}</b>
          <button className="imp-botao pequeno contorno" onClick={copiarLink}>{copiado ? "Link copiado!" : "Copiar link"}</button>
        </div>
      </section>

      <section className="imp-modos" aria-label="Modos de jogo">
        {MODOS.map((m) => (
          <div key={m.nome} className={`imp-modo ${m.ativo ? "ativo" : ""}`} aria-disabled={!m.ativo}>
            <b>{m.nome}</b>
            <span>{m.texto}</span>
          </div>
        ))}
      </section>

      <section className="imp-painel">
        <div className="imp-linha-titulo">
          <h2>Jogadores</h2>
          <span className="imp-contagem">{jogadores.length} / {maxJogadores}</span>
        </div>
        <ul className="imp-grade-jogadores">
          {jogadores.map((j) => (
            <li key={j.id} className={`imp-jogador ${j.conectado ? "" : "fora"}`}>
              <AvatarImp nome={j.nickname} cor={j.cor} tamanho={52} />
              <span className="imp-jogador-nome">{j.nickname}{j.id === estado.euId ? " (você)" : ""}</span>
              <span className={`imp-tag ${j.anfitriao ? "anfitriao" : j.conectado ? "pronto" : "fora"}`}>
                {j.anfitriao ? "ANFITRIÃO" : j.conectado ? "PRONTO" : "ENTRANDO"}
              </span>
            </li>
          ))}
          {Array.from({ length: vagas }, (_, i) => (
            <li key={`vaga-${i}`} className="imp-jogador vaga" aria-hidden="true"><span className="imp-vaga-circulo" />vago</li>
          ))}
        </ul>
        <div className="imp-progresso" role="progressbar" aria-valuemin={0} aria-valuemax={minJogadores} aria-valuenow={Math.min(conectados, minJogadores)}>
          <div style={{ width: `${Math.min(100, (conectados / minJogadores) * 100)}%` }} />
        </div>
        <p className="imp-sub">
          {faltam > 0
            ? `Faltam ${faltam} ${faltam === 1 ? "jogador" : "jogadores"} para começar (mínimo ${minJogadores}).`
            : souAnfitriao ? "Mínimo atingido. Pode iniciar quando quiser." : "Mínimo atingido. Aguardando o anfitrião iniciar."}
        </p>
      </section>

      <div className="imp-acoes">
        <button className="imp-botao contorno" onClick={aoSair}>Sair da sala</button>
        {souAnfitriao && (
          <button className="imp-botao" disabled={faltam > 0} onClick={() => pedir("impostor-iniciar")}>Iniciar partida</button>
        )}
      </div>
    </div>
  );
}
