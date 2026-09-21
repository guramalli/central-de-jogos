import { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "./api.js";

const MOTIVOS = [
  { key: "tema_errado", label: "A pergunta não é desse tema" },
  { key: "resposta_errada", label: "A resposta está errada" },
  { key: "escrita", label: "Erro de escrita / digitação" },
  { key: "outro", label: "Outro problema" },
];

function Modal({ titulo, aoFechar, children }) {
  return createPortal(
    <div className="v2-modal-fundo" onClick={aoFechar}>
      <div className="v2-modal" role="dialog" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <button className="v2-modal-fechar" aria-label="Fechar" onClick={aoFechar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <h3>{titulo}</h3>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalReportar({ questionId, texto, aoFechar }) {
  const [motivo, setMotivo] = useState("tema_errado");
  const [comentario, setComentario] = useState("");
  const [estado, setEstado] = useState(null); // null | enviando | {ok, msg}

  async function enviar(e) {
    e.preventDefault();
    setEstado("enviando");
    try {
      const { data } = await api.post("/quiz-questions/report", { questionId, reason: motivo, comment: comentario });
      setEstado({ ok: true, msg: data.message || "Obrigado! O time vai revisar essa pergunta." });
      setTimeout(aoFechar, 2200);
    } catch (err) {
      setEstado({ ok: false, msg: err.response?.data?.error || "Erro ao enviar. Tenta de novo?" });
    }
  }

  return (
    <Modal titulo="Reportar problema na pergunta" aoFechar={aoFechar}>
      {estado?.ok ? <p className="v2-modal-ok">{estado.msg}</p> : (
        <form onSubmit={enviar} className="v2-modal-form">
          <p className="v2-modal-citacao">“{texto}”</p>
          {estado && !estado.ok && estado !== "enviando" && <p className="v2-modal-erro">{estado.msg}</p>}
          {MOTIVOS.map((m) => (
            <label key={m.key} className={`v2-opcao ${motivo === m.key ? "ativa" : ""}`}>
              <input type="radio" name="motivo" value={m.key} checked={motivo === m.key} onChange={() => setMotivo(m.key)} />
              {m.label}
            </label>
          ))}
          <label htmlFor="v2-rep-com" className="v2-oculto">Comentário</label>
          <textarea id="v2-rep-com" rows={3} placeholder="Quer detalhar? (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value.slice(0, 300))} />
          <div className="v2-modal-acoes">
            <button type="button" className="v2-botao v2-botao-contorno" onClick={aoFechar}>Cancelar</button>
            <button type="submit" className="v2-botao v2-botao-amarelo" disabled={estado === "enviando"}>{estado === "enviando" ? "Enviando…" : "Enviar"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function ModalSugerir({ themeKey, aoFechar }) {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [estado, setEstado] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    setEstado("enviando");
    try {
      await api.post("/quiz-questions/suggest", { themeKey, question: pergunta, answer: resposta });
      setEstado({ ok: true, msg: "Enviada! Um admin vai revisar." });
      setPergunta(""); setResposta("");
    } catch (err) {
      setEstado({ ok: false, msg: err.response?.data?.error || "Erro ao enviar sugestão." });
    }
  }

  return (
    <Modal titulo="Sugerir uma pergunta" aoFechar={aoFechar}>
      <form onSubmit={enviar} className="v2-modal-form">
        <label htmlFor="v2-sug-p">Pergunta</label>
        <textarea id="v2-sug-p" rows={3} maxLength={300} required value={pergunta} onChange={(e) => setPergunta(e.target.value)} placeholder="Digite a pergunta…" />
        <label htmlFor="v2-sug-r">Resposta certa (curta)</label>
        <input id="v2-sug-r" maxLength={60} required value={resposta} onChange={(e) => setResposta(e.target.value)} />
        {estado && estado !== "enviando" && <p className={estado.ok ? "v2-modal-ok" : "v2-modal-erro"}>{estado.msg}</p>}
        <div className="v2-modal-acoes">
          <button type="button" className="v2-botao v2-botao-contorno" onClick={aoFechar}>Fechar</button>
          <button type="submit" className="v2-botao v2-botao-amarelo" disabled={estado === "enviando"}>Enviar sugestão</button>
        </div>
      </form>
    </Modal>
  );
}

export function ModalFeedback({ aoFechar }) {
  const [tipo, setTipo] = useState("ideia");
  const [mensagem, setMensagem] = useState("");
  const [estado, setEstado] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    setEstado("enviando");
    try {
      await api.post("/feedback", { type: tipo, message: mensagem });
      setEstado({ ok: true, msg: "Recebido! Obrigado por ajudar a melhorar o site." });
      setMensagem("");
      setTimeout(aoFechar, 2200);
    } catch (err) {
      setEstado({ ok: false, msg: err.response?.data?.error || "Erro ao enviar. Tenta de novo?" });
    }
  }

  return (
    <Modal titulo="Enviar feedback" aoFechar={aoFechar}>
      <form onSubmit={enviar} className="v2-modal-form">
        {[["ideia", "Ideia de atualização"], ["bug", "Aviso de bug"], ["outro", "Outro"]].map(([k, r]) => (
          <label key={k} className={`v2-opcao ${tipo === k ? "ativa" : ""}`}>
            <input type="radio" name="tipo" value={k} checked={tipo === k} onChange={() => setTipo(k)} />
            {r}
          </label>
        ))}
        <label htmlFor="v2-fb-msg">Mensagem</label>
        <textarea id="v2-fb-msg" rows={4} required maxLength={1000} value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Conta pra gente…" />
        {estado && estado !== "enviando" && <p className={estado.ok ? "v2-modal-ok" : "v2-modal-erro"}>{estado.msg}</p>}
        <div className="v2-modal-acoes">
          <button type="button" className="v2-botao v2-botao-contorno" onClick={aoFechar}>Fechar</button>
          <button type="submit" className="v2-botao v2-botao-amarelo" disabled={estado === "enviando"}>Enviar</button>
        </div>
      </form>
    </Modal>
  );
}
