import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AvatarImp, PontoPiscando } from "./comum.jsx";
import Agente from "./Agente.jsx";

// Reserva, caso o estado venha sem a lista (servidor antigo): só o Palavra.
const MODOS_PADRAO = [
  { id: "palavra", nome: "Palavra", descricao: "Todos recebem uma palavra secreta; o impostor, só o tema. Dicas de uma palavra." },
];

// Chamada do topo, por modo (computador / celular).
const CHAMADA = {
  palavra: ["Um de vocês não sabe a palavra. Dê dicas, desconfie de todo mundo e vote em quem está blefando.", "Um de vocês não sabe a palavra. Descubra quem."],
  situacao: ["Um de vocês não sabe onde vocês estão. Dê dicas curtas, desconfie de todo mundo e vote em quem está blefando.", "Um de vocês não sabe onde vocês estão. Descubra quem."],
  pergunta: ["Um de vocês respondeu outra pergunta — e nem sabe disso. Comparem as respostas e votem.", "Um de vocês respondeu outra pergunta. Descubra quem."],
  historia: ["Um de vocês não sabe o tema da história. Escrevam juntos, frase por frase, e descubram quem está inventando.", "Um de vocês não sabe o tema da história. Descubra quem."],
};

const IconeCopiar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

// Sala de espera. Computador: título e modos à esquerda, painel da sala à
// direita. Celular: tudo empilhado, botões no pé.
export default function SalaEspera({ estado, pedir, aoSair }) {
  const [copiado, setCopiado] = useState(false);
  const { jogadores, minJogadores, maxJogadores } = estado;
  const souAnfitriao = estado.anfitriaoId === estado.euId;
  const modos = estado.modos?.length ? estado.modos : MODOS_PADRAO;
  const modoAtual = modos.find((m) => m.id === estado.modo) || modos[0];
  const chamada = CHAMADA[modoAtual.id] || CHAMADA.palavra;
  const conectados = jogadores.filter((j) => j.conectado).length;
  const faltam = Math.max(0, minJogadores - conectados);
  // Vagas tracejadas até completar a fileira (6 no computador, 4 no celular
  // — 12 serve pros dois), sem passar do máximo.
  const vagas = Math.max(0, Math.min(maxJogadores, Math.max(minJogadores, Math.ceil((jogadores.length + 1) / 12) * 12)) - jogadores.length);
  const link = `${window.location.origin}/v2/?pagina=impostor&mesa=${encodeURIComponent(estado.codigo)}`;

  async function convidar() {
    // No celular, a folha de compartilhar do sistema; no computador, copiar.
    if (navigator.share && window.matchMedia("(max-width: 899px)").matches) {
      try { await navigator.share({ title: "O Impostor", text: `Entra na minha sala do Impostor: ${estado.codigo}`, url: link }); return; } catch { /* cancelou: cai no copiar */ }
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt("Copie o link da sala:", link);
    }
  }

  const aviso = faltam > 0
    ? `Faltam ${faltam} ${faltam === 1 ? "jogador" : "jogadores"} (mínimo de ${minJogadores}).`
    : souAnfitriao ? `Mínimo de ${minJogadores} atingido. Pode iniciar quando quiser.` : `Mínimo de ${minJogadores} atingido. Aguardando o anfitrião iniciar.`;

  return (
    <div className="imp-espera">
      <section className="imp-espera-heroi">
        <div className="imp-codigo imp-so-celular">
          <div>
            <span className="imp-rotulo">CÓDIGO DA SALA</span>
            <b className="imp-codigo-valor">{estado.codigo}</b>
          </div>
          <button className="imp-botao-icone" onClick={convidar} aria-label="Copiar link da sala"><IconeCopiar /></button>
        </div>
        {/* Título e o mascote lado a lado (no celular também: o título
            quebra em duas linhas pra caber o boneco). */}
        <div className="imp-espera-titulo">
          <h1 className="imp-titulo-heroi">O <br />IMPOSTOR</h1>
          <Agente humor="lobby" className="imp-agente-lobby" />
        </div>
        <p className="imp-sub">
          <span className="imp-so-computador">{chamada[0]}</span>
          <span className="imp-so-celular">{chamada[1]}</span>
        </p>
        {/* Modos: o anfitrião escolhe (o servidor confirma e manda o estado
            novo pra todos); os outros só veem qual está valendo. */}
        <div className="imp-modos-bloco">
          <span className="imp-rotulo">
            {souAnfitriao ? "ESCOLHA O MODO" : <>MODO DA PARTIDA<span className="imp-so-computador"> · ESCOLHIDO PELO ANFITRIÃO</span></>}
          </span>
          <div className={`imp-modos ${souAnfitriao ? "escolha" : ""}`} role="radiogroup" aria-label="Modo de jogo">
            {modos.map((m) => {
              const ativo = m.id === modoAtual.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  className={`imp-modo ${ativo ? "ativo" : ""}`}
                  disabled={!souAnfitriao}
                  onClick={() => { if (!ativo) pedir("impostor-modo", { modo: m.id }); }}
                >
                  <b>{m.nome}</b>
                  <span className="imp-so-computador">{m.descricao}</span>
                </button>
              );
            })}
          </div>
          {/* Celular: os modos são pílulas só com o nome; a explicação do
              escolhido vem aqui embaixo. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={modoAtual.id}
              className="imp-modo-descricao imp-so-celular"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <b>{modoAtual.nome}:</b> {modoAtual.descricao}
            </motion.p>
          </AnimatePresence>
        </div>
      </section>

      <section className="imp-painel imp-espera-painel">
        <div className="imp-codigo imp-so-computador">
          <div>
            <span className="imp-rotulo">CÓDIGO DA SALA</span>
            <b className="imp-codigo-valor">{estado.codigo}</b>
          </div>
          <button className="imp-botao secundario pequeno" onClick={convidar}><IconeCopiar />{copiado ? "Link copiado!" : "Copiar link"}</button>
        </div>
        <div className="imp-linha-titulo">
          <h2>Jogadores</h2>
          <span className="imp-contagem"><b>{jogadores.length}</b> / {maxJogadores}</span>
        </div>
        <ul className="imp-grade-jogadores">
          <AnimatePresence initial={false}>
            {jogadores.map((j) => (
              <motion.li
                key={j.id}
                layout
                className={`imp-jogador ${j.conectado ? "" : "fora"}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
              >
                <AvatarImp id={j.id} nome={j.nickname} cor={j.cor} tamanho={56} />
                <span className="imp-jogador-nome">{j.nickname}{j.id === estado.euId ? " (você)" : ""}</span>
                <span className={`imp-tag ${j.bot ? "bot" : j.anfitriao ? "anfitriao" : j.conectado ? "pronto" : "fora"}`}>
                  {j.bot ? "BOT" : j.anfitriao ? "ANFITRIÃO" : j.conectado ? "PRONTO" : "ENTRANDO"}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
          {Array.from({ length: vagas }, (_, i) => (
            <li key={`vaga-${i}`} className="imp-jogador vaga" aria-hidden="true"><span className="imp-vaga-circulo" />vago</li>
          ))}
        </ul>
        {souAnfitriao && (
          <div className="imp-bots">
            <button className="imp-botao secundario pequeno" onClick={() => pedir("impostor-bot", { acao: "adicionar" })} disabled={jogadores.length >= maxJogadores}>+ Adicionar bot</button>
            {estado.temBots && (
              <button className="imp-botao secundario pequeno" onClick={() => pedir("impostor-bot", { acao: "remover" })}>Remover bots</button>
            )}
          </div>
        )}
        <p className="imp-aviso-testes">
          🧪 <b>Em testes:</b> as partidas ainda não valem ranking.
          {estado.temBots ? " Os bots dão dicas e votam ao acaso." : " Sem gente suficiente? O anfitrião pode chamar bots."}
        </p>
        <div className="imp-espera-progresso">
          <div className="imp-progresso" role="progressbar" aria-label="Jogadores até o mínimo" aria-valuemin={0} aria-valuemax={minJogadores} aria-valuenow={Math.min(conectados, minJogadores)}>
            <motion.div initial={false} animate={{ width: `${Math.min(100, (conectados / minJogadores) * 100)}%` }} transition={{ duration: 0.4 }} />
          </div>
          <p className="imp-nota-status"><PontoPiscando cor={faltam > 0 ? "ambar" : "verde"} />{aviso}</p>
        </div>
        <div className="imp-acoes">
          <button className="imp-botao secundario" onClick={aoSair}>Sair</button>
          <button className="imp-botao secundario imp-so-celular" onClick={convidar}>{copiado ? "Link copiado!" : "Convidar amigos"}</button>
          {souAnfitriao ? (
            <button className="imp-botao principal largo" disabled={faltam > 0} onClick={() => pedir("impostor-iniciar")}>Iniciar partida</button>
          ) : (
            <span className="imp-sub imp-aguardando">Só o anfitrião inicia a partida.</span>
          )}
        </div>
      </section>
    </div>
  );
}
