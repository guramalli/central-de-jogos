import { useState } from "react";
import { motion } from "motion/react";
import { AvatarImp, CURVA, Cronometro, falasDe, modoDe, rotuloTema } from "./comum.jsx";
import { tocar } from "./sons.js";

// O que cada suspeito "disse", por modo: dicas (palavra/situação), frases
// (história — texto longo, em letra normal) ou a resposta (pergunta).
const FALAS = {
  palavra: { rotulo: "DICAS", verbo: "disse" },
  situacao: { rotulo: "DICAS", verbo: "disse" },
  historia: { rotulo: "FRASES", verbo: "escreveu" },
  pergunta: { rotulo: "RESPOSTA", verbo: "respondeu" },
};
const AJUDA = {
  palavra: "Releia as dicas e escolha um suspeito.",
  situacao: "Releia as dicas e escolha um suspeito.",
  historia: "Releia as frases e escolha um suspeito.",
  pergunta: "Compare cada resposta com a pergunta. Discutam no chat.",
};

// Votação simultânea. O servidor só conta quantos já votaram; em quem cada
// um votou nunca aparece (só o seu próprio voto, pra você).
// Computador: cartões lado a lado. Celular: uma linha por suspeito.
// Pergunta: a pergunta de verdade (a da maioria) aparece no topo, e cada
// suspeito mostra a resposta dele.
export default function Votacao({ estado, tempo, pedir }) {
  const [escolhido, setEscolhido] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const modo = modoDe(estado);
  const falas = FALAS[modo] || FALAS.palavra;
  const longo = modo === "historia" || modo === "pergunta";
  const jaVotei = estado.meuVoto != null;
  const marcado = jaVotei ? estado.meuVoto : escolhido;
  const suspeitos = estado.jogadores.filter((j) => j.naPartida && j.id !== estado.euId);
  const nomeEscolhido = suspeitos.find((s) => s.id === marcado)?.nickname;
  const minhaResposta = modo === "pergunta" ? (estado.respostas || []).find((r) => r.jogadorId === estado.euId) : null;

  let rotulo = "Escolha um suspeito";
  if (jaVotei) rotulo = "Voto confirmado ✓";
  else if (nomeEscolhido) rotulo = `Confirmar voto em ${nomeEscolhido}`;

  async function confirmar() {
    setEnviando(true);
    const r = await pedir("impostor-votar", { alvoId: marcado });
    setEnviando(false);
    if (r.ok) tocar("votoConfirmado");
  }

  return (
    <div className={`imp-votacao ${longo ? "longo" : ""}`}>
      <header className="imp-votacao-topo">
        <div>
          <span className="imp-rotulo">
            HORA DO VOTO<span className="imp-so-computador"> · {rotuloTema(estado)}</span>
          </span>
          <h1 className="imp-titulo-voto">QUEM É O <br className="imp-so-celular" />IMPOSTOR?</h1>
        </div>
        <Cronometro tempo={tempo} variante="circulo" />
      </header>

      {modo === "pergunta" && estado.perguntaReal && (
        <motion.section
          className="imp-pergunta-real"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: CURVA }}
        >
          <span className="imp-rotulo">A PERGUNTA DE VERDADE ERA</span>
          <p className="imp-pergunta-texto">{estado.perguntaReal}</p>
          {minhaResposta && (
            <span className="imp-nota">Você respondeu <b className={minhaResposta.texto ? "" : "imp-branco"}>{minhaResposta.texto ? `“${minhaResposta.texto}”` : "(em branco)"}</b></span>
          )}
        </motion.section>
      )}

      <p className="imp-sub imp-so-celular">
        {modo === "palavra" && <>Tema: <b>{estado.tema}</b> · </>}{AJUDA[modo]}
      </p>
      {modo === "pergunta" && <p className="imp-sub imp-so-computador">{AJUDA.pergunta}</p>}

      {/* "muitos" (5+) encolhe um pouco; "lotado" (7+, mesa de até 12)
          vira grade de cartões pequenos, pra caber sem rolar muito. */}
      <ul className={`imp-suspeitos ${suspeitos.length > 4 ? "muitos" : ""} ${suspeitos.length > 6 ? "lotado" : ""}`} role="radiogroup" aria-label="Suspeitos">
        {suspeitos.map((s) => {
          const sel = marcado === s.id;
          const ditos = falasDe(estado, s.id);
          return (
            <li key={s.id}>
              <motion.button
                role="radio"
                aria-checked={sel}
                className={`imp-suspeito ${sel ? "selecionado" : ""}`}
                disabled={!estado.participo || jaVotei}
                onClick={() => setEscolhido(s.id)}
                animate={{ y: sel ? -6 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <AvatarImp nome={s.nickname} cor={s.cor} tamanho={96} className="imp-suspeito-avatar" />
                <span className="imp-suspeito-info">
                  <span className="imp-suspeito-nome">{s.nickname}</span>
                  <span className="imp-suspeito-disse imp-so-celular">
                    {falas.verbo} {ditos.length === 0 ? "nada" : ditos.map((d, i) => (
                      <b key={d.chave} className={d.texto ? "" : "imp-branco"}>{i > 0 && (longo ? " / " : ", ")}{d.texto ? `“${d.texto}”` : "(em branco)"}</b>
                    ))}
                  </span>
                </span>
                <span className="imp-suspeito-dicas imp-so-computador">
                  <span className="imp-rotulo">{falas.rotulo}</span>
                  {ditos.map((d) => (
                    <b key={d.chave} className={d.texto ? "" : "imp-branco"} title={`${d.titulo}: ${d.texto || "(em branco)"}`}>{d.texto || "(em branco)"}</b>
                  ))}
                </span>
                <span className={`imp-selo ${sel ? "ativo" : ""}`}>{sel ? "SEU VOTO" : "Votar"}</span>
              </motion.button>
            </li>
          );
        })}
      </ul>

      <div className="imp-votacao-pe">
        <span className="imp-sub"><b>{estado.votaram} de {estado.totalVotantes}</b> já votaram<span className="imp-so-computador"> · os votos aparecem juntos no final</span></span>
        {estado.participo && (
          <button className="imp-botao principal" disabled={jaVotei || !marcado || enviando} onClick={confirmar}>{rotulo}</button>
        )}
      </div>
    </div>
  );
}
