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
        // A rota devolve { accepted, receivedPending, sentPending } — não um
        // array. E o campo do amigo é `userId`, não `id`. Conferi antes de
        // escrever; do contrário a lista viria sempre vazia.
        //
        // Ela já informa quem está ONLINE, e isso é aproveitado abaixo: quem
        // está no site aparece primeiro, porque é quem pode aceitar agora.
        const lista = Array.isArray(data?.accepted) ? data.accepted : [];
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
      if (!ok && erro) alert(erro);
    }
    socketDaSala.on("convite-resultado", resultado);
    return () => socketDaSala.off("convite-resultado", resultado);
  }, [socketDaSala]);

  function convidar(amigo) {
    socketDaSala?.emit("convidar-para-sala", { amigoId: amigo.userId });
    // Marca na hora, sem esperar resposta: o retorno visual imediato é o que
    // impede a pessoa de clicar cinco vezes achando que não funcionou.
    setConvidados((c) => ({ ...c, [amigo.id]: true }));
  }

  return (
    <div className="convidar-amigo" ref={caixaRef}>
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
