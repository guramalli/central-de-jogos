import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { AvatarImp, CURVA, Cronometro, PontoPiscando, quem, useSegundos } from "./comum.jsx";
import { tocar } from "./sons.js";

// Modo PERGUNTA — as duas fases que só ele tem:
//   RESPOSTAS (40s): todo mundo responde a SUA pergunta ao mesmo tempo. O
//     servidor só conta quantos já responderam (não diz quem) e devolve a
//     sua resposta; a dos outros só aparece no confronto.
//   CONFRONTO (10s): as respostas na mesa, todas juntas, SEM a pergunta —
//     cada um compara e desconfia antes de a pergunta de verdade aparecer
//     (na votação).
export default function Pergunta({ estado, carta, tempo, pedir }) {
  if (estado.fase === "CONFRONTO") return <Confronto estado={estado} tempo={tempo} />;
  return <Respostas estado={estado} carta={carta} tempo={tempo} pedir={pedir} />;
}

function Respostas({ estado, carta, tempo, pedir }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [recusa, setRecusa] = useState("");
  const campo = useRef(null);
  const max = estado.limites?.caracteres || 60;
  const minha = estado.minhaResposta;
  const respondi = minha != null;
  const { responderam = 0, totalRespondentes = 0 } = estado;
  useEffect(() => { if (estado.participo && !respondi) campo.current?.focus(); }, [estado.participo, respondi]);

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim() || enviando || respondi) return;
    setEnviando(true);
    const r = await pedir("impostor-resposta", { texto: texto.trim() }, { avisoNoTopo: false });
    setEnviando(false);
    if (r.ok) { setRecusa(""); tocar("votoConfirmado"); return; }
    setRecusa(r.erro || "");
    campo.current?.focus();
  }

  return (
    <div className="imp-respostas">
      <header className="imp-cabecalho-rodada">
        <span className="imp-rotulo">RESPONDA<span className="imp-so-computador"> · TODOS AO MESMO TEMPO</span></span>
        <Cronometro tempo={tempo} variante="pilula" />
      </header>

      {estado.participo ? (
        <motion.section
          className="imp-painel imp-pergunta-painel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: CURVA }}
        >
          <span className="imp-rotulo">SUA PERGUNTA</span>
          <h1 className="imp-pergunta-texto">{carta?.pergunta || "Carregando a pergunta…"}</h1>

          {respondi ? (
            <motion.div
              className="imp-resposta-enviada"
              role="status"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
            >
              <span className="imp-resposta-check" aria-hidden="true">✓</span>
              <span>
                <small>Resposta enviada</small>
                <b className={minha ? "" : "imp-branco"}>{minha ? `“${minha}”` : "(em branco)"}</b>
              </span>
            </motion.div>
          ) : (
            <form className="imp-dica-form" onSubmit={enviar}>
              <label htmlFor="imp-resposta">Sua resposta (uma só, não dá pra trocar)</label>
              <div className="imp-dica-linha">
                <input
                  id="imp-resposta"
                  ref={campo}
                  className="imp-campo"
                  maxLength={max}
                  autoComplete="off"
                  value={texto}
                  onChange={(e) => { setTexto(e.target.value); if (recusa) setRecusa(""); }}
                  placeholder="Digite sua resposta"
                  aria-invalid={!!recusa}
                  aria-describedby={recusa ? "imp-resposta-recusa" : "imp-resposta-ajuda"}
                />
                <button className="imp-botao principal compacto" type="submit" disabled={!texto.trim() || enviando}>Responder</button>
              </div>
              <p id="imp-resposta-ajuda" className="imp-dica-ajuda">
                <span>Responda com sinceridade — as respostas aparecem juntas.</span>
                <span className={`imp-contador ${texto.length >= max ? "cheio" : ""}`}>{texto.length}/{max}</span>
              </p>
              {recusa && <p id="imp-resposta-recusa" className="imp-dica-recusa" role="alert">{recusa}</p>}
            </form>
          )}
        </motion.section>
      ) : (
        <section className="imp-painel imp-pergunta-painel">
          <p className="imp-sub">Os jogadores estão respondendo às perguntas deles…</p>
        </section>
      )}

      <ProgressoRespostas responderam={responderam} total={totalRespondentes} />
    </div>
  );
}

// "X de Y responderam": o servidor não diz QUEM já respondeu, então as
// marcas são anônimas — uma por jogador, preenchidas na ordem.
function ProgressoRespostas({ responderam, total }) {
  return (
    <div className="imp-respostas-progresso" role="status">
      <ul className="imp-marcas" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={i < responderam ? "feito" : ""}>
            {i < responderam && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>✓</motion.span>
            )}
          </li>
        ))}
      </ul>
      <p className="imp-nota-status">
        <PontoPiscando cor={responderam >= total ? "verde" : "ambar"} />
        <span><b>{responderam} de {total}</b> já responderam</span>
      </p>
    </div>
  );
}

// Aviso da contagem até a pergunta de verdade aparecer.
function ContagemConfronto({ tempo }) {
  const s = useSegundos(tempo);
  return (
    <p className="imp-fechando imp-confronto-aviso" role="status">
      <PontoPiscando cor="ambar" />
      <span>A pergunta de verdade aparece {s ? `em ${s}s` : "já"}…</span>
    </p>
  );
}

// As respostas "viram" na mesa uma depois da outra (80ms entre cartas).
function Confronto({ estado, tempo }) {
  const respostas = estado.respostas || [];
  const muitos = respostas.length > 6;
  useEffect(() => { tocar("cartaVirando"); }, []);
  return (
    <div className="imp-confronto">
      <header className="imp-votacao-topo">
        <div>
          <span className="imp-rotulo">AS RESPOSTAS NA MESA</span>
          <h1 className="imp-titulo-voto">QUEM RESPONDEU <br className="imp-so-celular" />OUTRA COISA?</h1>
        </div>
        <Cronometro tempo={tempo} variante="circulo" />
      </header>
      <ContagemConfronto tempo={tempo} />
      <ul className={`imp-respostas-mesa ${muitos ? "muitos" : ""}`}>
        {respostas.map((r, i) => (
          <CartaoResposta key={r.jogadorId} estado={estado} resposta={r} indice={i} />
        ))}
      </ul>
    </div>
  );
}

export function CartaoResposta({ estado, resposta, indice = 0 }) {
  const p = quem(estado, resposta.jogadorId);
  const eu = resposta.jogadorId === estado.euId;
  return (
    <motion.li
      className={`imp-resposta ${eu ? "minha" : ""}`}
      style={{ "--imp-cor-jogador": p.cor }}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ delay: 0.15 + indice * 0.08, duration: 0.5, ease: CURVA }}
    >
      <span className="imp-resposta-quem">
        <AvatarImp nome={p.nickname} cor={p.cor} tamanho={28} />
        <span className="imp-resposta-nome">{p.nickname}{eu ? " (você)" : ""}</span>
      </span>
      <b className={`imp-resposta-texto ${resposta.texto ? "" : "imp-branco"}`}>{resposta.texto || "(em branco)"}</b>
    </motion.li>
  );
}
