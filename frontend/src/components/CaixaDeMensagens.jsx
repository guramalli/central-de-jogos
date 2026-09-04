import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Caixa de mensagens: lista as CONVERSAS, não os amigos.
//
// O QUE ISSO RESOLVE:
// Antes o aviso dizia "você tem 2 mensagens" e a página mostrava a lista de
// amigos, sem indicar de QUEM eram. A pessoa abria conversa por conversa até
// achar. Com dez amigos, dez cliques pra ler uma mensagem — e a função de
// mensagem privada, que é o que segura comunidade, virava inútil.
//
// Aqui aparece o que qualquer aplicativo de mensagem mostra: quem falou, o
// começo da última mensagem, quando foi, e quantas estão por ler.
export default function CaixaDeMensagens({ aoAbrirConversa, recarregar }) {
  const [conversas, setConversas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      try {
        const { data } = await api.get("/friends/conversas");
        if (vivo) setConversas(data);
      } catch {
        // silencioso: sem conversas a página segue normal
      } finally {
        if (vivo) setCarregando(false);
      }
    }
    carregar();
    // Atualiza sozinho — mensagem nova precisa aparecer sem recarregar.
    const t = setInterval(carregar, 20000);
    return () => { vivo = false; clearInterval(t); };
  }, [recarregar]);

  // Sem conversa nenhuma: não ocupa espaço com uma caixa vazia.
  if (carregando || conversas.length === 0) return null;

  const naoLidas = conversas.reduce((s, c) => s + c.naoLidas, 0);

  return (
    <div className="card caixa-mensagens">
      <div className="caixa-mensagens-topo">
        <h2>
          <span className="material-symbols-outlined">forum</span>
          Mensagens
        </h2>
        {naoLidas > 0 && (
          <span className="caixa-mensagens-contador">{naoLidas} não lida{naoLidas > 1 ? "s" : ""}</span>
        )}
      </div>

      <div className="conversas-lista">
        {conversas.map((c) => (
          <button
            key={c.userId}
            type="button"
            className={`conversa-item ${c.naoLidas > 0 ? "conversa-nao-lida" : ""}`}
            onClick={() => aoAbrirConversa({ userId: c.userId, nickname: c.nickname })}
          >
            {c.avatarUrl ? (
              <img src={c.avatarUrl} alt="" className="conversa-avatar" />
            ) : (
              <span className="conversa-avatar conversa-avatar-vazio">
                {c.nickname.charAt(0).toUpperCase()}
              </span>
            )}

            <div className="conversa-texto">
              <div className="conversa-linha">
                <strong className="conversa-nick">{c.nickname}</strong>
                <span className="conversa-quando">{formatarQuando(c.quando)}</span>
              </div>
              <p className="conversa-previa">
                {/* "Você:" deixa claro que a bola está com o outro lado. */}
                {c.ultimaMinha && <span className="conversa-eu">Você: </span>}
                {c.ultima}
              </p>
            </div>

            {c.naoLidas > 0 && <span className="conversa-badge">{c.naoLidas}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// Tempo relativo curto: numa lista, "3h" lê mais rápido que a data inteira.
function formatarQuando(iso) {
  const agora = new Date();
  const quando = new Date(iso);
  const min = Math.floor((agora - quando) / 60000);

  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `${dias}d`;
  return quando.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
