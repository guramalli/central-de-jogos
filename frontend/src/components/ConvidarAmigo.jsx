import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";

/**
 * CONVIDAR UM AMIGO QUE JÁ ESTÁ NO SITE.
 *
 * Diferente do InviteButton, que copia um link pra mandar no WhatsApp: este
 * chama alguém que já está logado aqui dentro, agora. O convite chega como
 * aviso na tela do amigo, onde quer que ele esteja, e ninguém precisa sair
 * da sala pra mandar.
 *
 * `socketDaSala` existe por causa do multi-sala: lá cada painel tem a
 * própria conexão, e o convite tem que sair PELA CONEXÃO DAQUELA SALA —
 * senão o servidor olha `currentRoom` da conexão errada e convida pra outra
 * partida.
 */
export default function ConvidarAmigo({ socketDaSala }) {
  const [aberto, setAberto] = useState(false);
  const [amigos, setAmigos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [convidados, setConvidados] = useState({});
  // Aviso de confirmação. O "chamado ✓" na lista não bastava: some junto com
  // a lista, e quem fecha o painel logo após clicar fica sem saber se saiu.
  const [aviso, setAviso] = useState(null);
  const caixaRef = useRef(null);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    function aoClicar(e) {
      if (caixaRef.current && !caixaRef.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    let vivo = true;
    setCarregando(true);
    api
      .get("/friends")
      .then(({ data }) => {
        if (!vivo) return;
        // A chave é `friends`. Eu tinha escrito `accepted`, que é o nome da
        // VARIÁVEL interna da rota — li o meio do arquivo em vez da linha do
        // `res.json`, e a lista vinha sempre vazia mesmo com amigos.
        //
        // A rota já informa quem está ONLINE, e isso é usado abaixo: quem
        // está no site fica clicável, quem não está aparece apagado.
        const lista = Array.isArray(data?.friends) ? data.friends : [];
        setAmigos(lista);
      })
      .catch(() => vivo && setAmigos([]))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [aberto]);

  useEffect(() => {
    if (!socketDaSala) return;
    function resultado({ ok, erro }) {
      // O aviso vem da RESPOSTA DO SERVIDOR, não do clique: só diz "enviado"
      // quando realmente saiu. Se a amizade não valer ou o limite de tempo
      // barrar, aparece o motivo.
      setAviso(
        ok
          ? { ok: true, texto: "Convite enviado!" }
          : { ok: false, texto: erro || "Não foi possível convidar." }
      );
    }
    socketDaSala.on("convite-resultado", resultado);
    return () => socketDaSala.off("convite-resultado", resultado);
  }, [socketDaSala]);

  // Some sozinho — senão ficaria na tela durante a partida.
  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(timer);
  }, [aviso]);

  function convidar(amigo) {
    socketDaSala?.emit("convidar-para-sala", { amigoId: amigo.userId });
    // `amigo.userId` — estava `amigo.id`, sobra da primeira versão. A chave
    // gravada não batia com a lida na hora de desabilitar, e o botão nunca
    // travava: dava pra clicar sem parar no mesmo amigo.
    setConvidados((c) => ({ ...c, [amigo.userId]: true }));
    // Fecha a lista: a confirmação aparece no lugar dela.
    setAberto(false);
  }

  return (
    <div className="convidar-amigo" ref={caixaRef}>
      {aviso && (
        <div className={`convite-aviso ${aviso.ok ? "ok" : "erro"}`} role="status">
          {aviso.ok ? "✓" : "⚠"} {aviso.texto}
        </div>
      )}
      <button className="convidar-amigo-btn" onClick={() => setAberto((v) => !v)}>
        👥 Chamar amigo
      </button>

      {aberto && (
        <div className="convidar-amigo-lista">
          {carregando && <p className="convidar-amigo-vazio">carregando...</p>}

          {!carregando && amigos.length === 0 && (
            <p className="convidar-amigo-vazio">
              Você ainda não tem amigos adicionados.
            </p>
          )}

          {!carregando && amigos.length > 0 && amigos.every((a) => !a.online) && (
            <p className="convidar-amigo-vazio">
              Nenhum amigo seu está no site agora.
            </p>
          )}

          {!carregando &&
            amigos.map((a) => (
              <button
                key={a.userId}
                className="convidar-amigo-item"
                onClick={() => convidar(a)}
                // Quem está offline não recebe o aviso na tela — deixar o
                // botão ativo faria a pessoa achar que chamou alguém que
                // nunca vai ver.
                disabled={!a.online || !!convidados[a.userId]}
                title={a.online ? "" : "Está fora do site agora"}
              >
                <span className="convidar-amigo-nome">
                  <span
                    className={`convidar-amigo-ponto ${a.online ? "on" : ""}`}
                  />
                  {a.nickname}
                </span>
                <span className="convidar-amigo-acao">
                  {!a.online ? "offline" : convidados[a.userId] ? "chamado ✓" : "chamar"}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
