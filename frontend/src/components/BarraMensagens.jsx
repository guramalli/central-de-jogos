import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import DmModal from "./DmModal.jsx";

// Barra de mensagens privadas fixa no canto inferior direito.
//
// PROPÓSITO: dar ao chat privado o mesmo conforto de um aplicativo de
// mensagem — ver quem está online, quem mandou mensagem e conversar sem
// mudar de página.
//
// COMPLETAMENTE SEPARADA DO CHAT DAS SALAS. Isso é decisão de desenho, não
// acaso: misturar os dois faria a pessoa mandar no lugar errado no meio de
// uma partida, que é um erro constrangedor e fácil de cometer.
//
// SÓ NO DESKTOP: no celular a tela é pequena demais pra uma janela flutuante
// competindo com o conteúdo. Lá a página de Amigos, com a caixa de mensagens
// no topo, já resolve.
//
// SEM PRÉVIA DAS MENSAGENS: a lista mostra só o nick, um ponto de online e a
// contagem de não lidas. Dois motivos — a barra fica compacta o bastante pra
// caber dentro das salas de jogo, e o conteúdo da conversa não fica exposto
// na tela durante uma partida.
export default function BarraMensagens() {
  // "aberta" | "recolhida" — guardado no navegador pra não reabrir sozinha a
  // cada página. Recolhida ela vira só uma bolinha com o contador: a pessoa
  // continua sabendo que chegou mensagem sem o painel ocupando a tela.
  const [aberta, setAberta] = useState(() => {
    try {
      return window.localStorage.getItem("barra-mensagens") !== "recolhida";
    } catch {
      return false;
    }
  });
  const [conversas, setConversas] = useState([]);
  const [amigos, setAmigos] = useState([]);
  const [chatWith, setChatWith] = useState(null);
  const [recarregar, setRecarregar] = useState(0);

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      try {
        const [c, f] = await Promise.all([
          api.get("/friends/conversas"),
          api.get("/friends"),
        ]);
        if (!vivo) return;
        const amigosTodos = f.data?.friends || [];
        // Cruza as conversas com a lista de amigos pra saber quem está online.
        // Quem não é amigo (conversa iniciada por admin, por exemplo) não
        // aparece na lista de amigos e fica como offline.
        const onlineIds = new Set(amigosTodos.filter((a) => a.online).map((a) => a.userId));
        setConversas((c.data || []).map((x) => ({ ...x, online: onlineIds.has(x.userId) })));
        setAmigos(amigosTodos.filter((a) => a.online));
      } catch {
        // silencioso: sem dados a barra só não mostra nada
      }
    }
    carregar();
    const t = setInterval(carregar, 20000);
    return () => { vivo = false; clearInterval(t); };
  }, [recarregar]);

  function alternar() {
    const nova = !aberta;
    setAberta(nova);
    try {
      window.localStorage.setItem("barra-mensagens", nova ? "aberta" : "recolhida");
    } catch {
      // armazenamento bloqueado: só não lembra o estado
    }
  }

  const naoLidas = conversas.reduce((s, c) => s + c.naoLidas, 0);

  // Recolhida: bolinha com o contador. É o estado "não me atrapalhe agora,
  // mas me avise se chegar algo".
  if (!aberta) {
    return (
      <button type="button" className="barra-msg-bolinha" onClick={alternar} title="Mensagens">
        <span className="material-symbols-outlined">chat_bubble</span>
        {naoLidas > 0 && <span className="barra-msg-bolinha-badge">{naoLidas}</span>}
      </button>
    );
  }

  return (
    <>
      <div className="barra-msg">
        <button type="button" className="barra-msg-topo" onClick={alternar}>
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="barra-msg-titulo">Mensagens</span>
          {naoLidas > 0 && <span className="barra-msg-badge">{naoLidas}</span>}
          <span className="material-symbols-outlined barra-msg-seta">expand_more</span>
        </button>

        <div className="barra-msg-corpo">
          {conversas.length > 0 && (
            <div className="barra-msg-secao">
              <h4>Conversas</h4>
              {conversas.slice(0, 6).map((c) => (
                <button
                  key={c.userId}
                  type="button"
                  className={`barra-msg-item ${c.naoLidas > 0 ? "barra-msg-item-novo" : ""}`}
                  onClick={() => setChatWith({ userId: c.userId, nickname: c.nickname })}
                  title={c.online ? "Online agora" : "Offline"}
                >
                  <span className={`barra-msg-ponto ${c.online ? "barra-msg-ponto-on" : ""}`} />
                  <span className="barra-msg-nick barra-msg-nick-largo">{c.nickname}</span>
                  {c.naoLidas > 0 && <span className="barra-msg-item-badge">{c.naoLidas}</span>}
                </button>
              ))}
            </div>
          )}

          <div className="barra-msg-secao">
            <h4>Amigos online ({amigos.length})</h4>
            {amigos.length === 0 && (
              <p className="barra-msg-vazio">Ninguém online agora.</p>
            )}
            {amigos.map((a) => (
              <button
                key={a.userId}
                type="button"
                className="barra-msg-item"
                onClick={() => setChatWith({ userId: a.userId, nickname: a.nickname })}
              >
                <span className="barra-msg-ponto barra-msg-ponto-on" />
                <span className="barra-msg-nick barra-msg-nick-largo">{a.nickname}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {chatWith && (
        <DmModal
          friend={chatWith}
          onClose={() => {
            setChatWith(null);
            // A conversa foi lida: recarrega pra o contador acertar.
            setRecarregar((n) => n + 1);
          }}
        />
      )}
    </>
  );
}
