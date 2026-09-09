import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Seo from "../components/Seo.jsx";
import TitulosPerfil from "../components/TitulosPerfil.jsx";
import { classeDoNivel } from "../utils/nivelTitulo.js";

const GAME_NAMES = { stop: "Stop", quiz: "Quiz", acromania: "Acromania" };

function formatMemberSince(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default function PublicProfile() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [friendStatus, setFriendStatus] = useState(null); // null | "sending" | "sent"
  // Só carregado se a pessoa não tiver clã: serve pra saber se EU lidero
  // algum e posso convidá-la.
  const [meuCla, setMeuCla] = useState(null);
  const [conviteStatus, setConviteStatus] = useState("");
  const [friendError, setFriendError] = useState("");
  // Títulos já conquistados, pra aparecerem junto das outras conquistas.
  const [titulosGanhos, setTitulosGanhos] = useState([]);
  // Conquistas recolhidas por padrão quando são muitas — com 20 temas, a
  // grade tomava a página inteira e empurrava o ranking pra fora da tela.
  const [verTodasConquistas, setVerTodasConquistas] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/users/${userId}/profile`)
      .then(({ data }) => setProfile(data))
      .catch(() => setError("Não foi possível carregar esse perfil."))
      .finally(() => setLoading(false));
    setFriendStatus(null);

    // Reaproveita o endpoint que a vitrine de títulos já usa (com cache de 10
    // min no servidor) em vez de engordar o /profile — este último é chamado
    // a CADA passada de mouse num nick dentro das salas, e é o caminho mais
    // movimentado do site. Aqui roda só quando alguém abre um perfil.
    api
      .get(`/users/${userId}/titulos`)
      .then(({ data }) => {
        const todos = [...(data.quiz || []), ...(data.stop || [])];
        // Só o MAIOR título de cada tema.
        //
        // Os níveis vêm em ordem crescente (bronze, prata, ouro...), e antes
        // isto era um flatMap que juntava todos os desbloqueados — quem
        // evoluiu num tema aparecia três vezes ("Conhecedor de Futebol",
        // "Mestre de Futebol"...), o que enche a lista repetindo a mesma
        // conquista e esconde a variedade real de temas.
        setTitulosGanhos(
          todos
            .map((t) => (t.desbloqueados || []).at(-1))
            .filter(Boolean)
        );
      })
      .catch(() => setTitulosGanhos([])); // sem títulos não é erro, é começo de jornada
  }, [userId]);

  async function handleAddFriend() {
    setFriendStatus("sending");
    setFriendError("");
    try {
      await api.post("/friends/request", { targetUserId: userId });
      setFriendStatus("sent");
    } catch (e) {
      setFriendStatus(null);
      setFriendError(e.response?.data?.error || "Erro ao enviar pedido.");
    }
  }

  // ATENÇÃO: este hook tem que ficar ANTES dos `return` antecipados abaixo
  // ("Carregando..." e "Perfil não encontrado"). Hooks precisam rodar na
  // MESMA ORDEM em todo render — colocado depois deles, ele não executava
  // enquanto carregava e passava a executar quando os dados chegavam. O
  // React percebe a mudança na contagem de hooks e derruba a página inteira.
  //
  // Por isso `me?.id === userId` é calculado aqui dentro em vez de usar a
  // constante `isMe`, que só existe mais abaixo.
  useEffect(() => {
    let vivo = true;
    if (!profile || profile.clan || me?.id === userId) return;
    api
      .get("/clans/mine")
      .then(({ data }) => vivo && setMeuCla(data?.clan?.isOwner ? data.clan : null))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [profile, me?.id, userId]);

  if (loading) return <p>Carregando...</p>;
  if (error || !profile) return <p style={{ color: "var(--text-dim)" }}>{error || "Perfil não encontrado."}</p>;

  const isMe = me?.id === userId;
  const ehAdmin = profile.role === "ADMIN";

  // Teto de 8 medalhas de título. Acima disso, o resto fica atrás de um
  // botão — a pessoa não perde nada e a página continua navegável.
  const LIMITE_CONQUISTAS = 8;
  const titulosVisiveis = verTodasConquistas
    ? titulosGanhos
    : titulosGanhos.slice(0, LIMITE_CONQUISTAS);
  const conquistasOcultas = titulosGanhos.length - titulosVisiveis.length;


  async function convidarProCla() {
    setConviteStatus("enviando");
    try {
      await api.post("/clans/invite", { userId: profile.id });
      setConviteStatus("enviado");
    } catch (e) {
      setConviteStatus(e.response?.data?.error || "Não foi possível convidar.");
    }
  }



  return (
    <div>
      <Seo title={profile.nickname} description={`Veja o perfil de ${profile.nickname} na Educação Gamer.`} />

      <div className="card public-profile-header">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.nickname} className="avatar-img avatar-img-large" />
        ) : (
          <div className="avatar-placeholder avatar-placeholder-large">🎮</div>
        )}
        <div>
          <h1 style={{ margin: 0 }}>{profile.nickname}</h1>
          <p style={{ color: "var(--text-dim)", margin: "4px 0" }}>
            📅 Membro desde {formatMemberSince(profile.memberSince)} · ⏱ {profile.playtimeMinutes} min jogados
          </p>
          {profile.clan ? (
            <p style={{ color: "var(--accent-2)", margin: "4px 0", fontWeight: 700 }}>
              🚩 <Link to={`/cla/${profile.clan.id}`}>{profile.clan.name} [{profile.clan.tag}]</Link>
            </p>
          ) : (
            <p style={{ color: "var(--text-dim)", margin: "4px 0" }}>
              🚩 Sem clã
              {/* O convite só aparece pra quem LIDERA um clã: membro comum não
                  tem essa permissão, e mostrar o botão daria erro no clique. */}
              {meuCla && (
                <>
                  {" · "}
                  {conviteStatus === "enviado" ? (
                    <span style={{ color: "#06d6a0" }}>✓ Convite enviado</span>
                  ) : (
                    <button
                      className="btn btn-sm"
                      style={{ marginLeft: 4 }}
                      onClick={convidarProCla}
                      disabled={conviteStatus === "enviando"}
                    >
                      {conviteStatus === "enviando" ? "Enviando..." : `Convidar pro ${meuCla.name}`}
                    </button>
                  )}
                </>
              )}
            </p>
          )}
          {conviteStatus && conviteStatus !== "enviado" && conviteStatus !== "enviando" && (
            <p style={{ color: "var(--danger, #e60000)", fontSize: 13, margin: "4px 0" }}>
              {conviteStatus}
            </p>
          )}
          {!isMe && (
            <div style={{ marginTop: 10 }}>
              {friendStatus === "sent" || profile.friendshipStatus === "pending_sent" ? (
                <span style={{ color: "#06d6a0" }}>✓ Pedido de amizade enviado!</span>
              ) : friendStatus === "sending" ? (
                <span style={{ color: "var(--text-dim)" }}>Enviando...</span>
              ) : profile.friendshipStatus === "friends" ? (
                <span style={{ color: "#06d6a0" }}>✓ Já são amigos</span>
              ) : profile.friendshipStatus === "pending_received" ? (
                <span style={{ color: "var(--accent-2)" }}>
                  Te mandou um pedido de amizade — <Link to="/amigos">confere aqui</Link>
                </span>
              ) : (
                <>
                  <button className="btn" onClick={handleAddFriend}>+ Adicionar amigo</button>
                  {friendError && (
                    <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 6 }}>{friendError}</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Perfil de ADMIN não exibe estatística nenhuma.
          Conta de administração não compete: mostrar conquistas, patente e
          pontuação ao lado de quem joga de verdade sugere uma disputa que
          não existe — e o site inteiro já exclui admin de todo ranking. */}
      {ehAdmin ? (
        <div className="card perfil-admin">
          <img src="/ranks/admin.png" alt="" className="perfil-admin-emblema" />
          <div>
            <h2 className="perfil-admin-titulo">Administrador do Site</h2>
            <p className="perfil-admin-sub">
              Conta oficial do Educação Gamer. Não participa dos rankings nem da premiação.
            </p>
          </div>
        </div>
      ) : (
        <>
      {(profile.achievements.length > 0 || titulosGanhos.length > 0) && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Conquistas</h2>
          <div className="achievements-grid">
            {profile.achievements.map((a, i) => (
              <div key={i} className="achievement-badge">
                {a.iconUrl ? (
                  <img src={a.iconUrl} alt="" className="achievement-icon-img" />
                ) : (
                  <span className="achievement-icon">{a.icon}</span>
                )}
                <span>
                  {a.label}
                  {/* Contexto opcional (ex.: "270 de 300 perguntas"), pra a
                      porcentagem não parecer sorte de poucas tentativas. */}
                  {a.detalhe && <small className="achievement-detalhe">{a.detalhe}</small>}
                </span>
              </div>
            ))}

            {/* Títulos conquistados entram como medalha aqui também. A vitrine
                mais abaixo mostra a jornada completa (inclusive o que falta);
                aqui ficam só os já ganhos, no resumo de conquistas.
                O nome sai na cor do material da medalha, igual ao hover. */}
            {titulosVisiveis.map((t) => (
              <div key={t.nome} className="achievement-badge">
                {t.logo ? (
                  <img
                    src={t.logo}
                    alt=""
                    className="achievement-icon-img"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <span className="achievement-icon">🏅</span>
                )}
                <span className={classeDoNivel(t.logo)}>{t.nome}</span>
              </div>
            ))}
          </div>

          {(conquistasOcultas > 0 || verTodasConquistas) && (
            <button
              type="button"
              className="btn secondary btn-sm"
              style={{ marginTop: 10 }}
              onClick={() => setVerTodasConquistas((v) => !v)}
            >
              {verTodasConquistas
                ? "Mostrar menos"
                : `Ver todas (+${conquistasOcultas})`}
            </button>
          )}
        </div>
      )}

      {profile.monthly.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Ranking mensal</h2>
          <div className="monthly-rank-cards">
            {profile.monthly.map((m) => (
              <div key={m.gameKey} className="monthly-rank-card">
                <div className="monthly-rank-card-top">
                  <span className="monthly-rank-game-name">{GAME_NAMES[m.gameKey] || m.gameKey}</span>
                  {m.position && <span className="monthly-rank-position">{m.position}º no mês</span>}
                </div>

                {m.rank && (
                  <div className="monthly-rank-patent">
                    <img
                      src={m.rank.icon}
                      alt={m.rank.name}
                      className={`monthly-rank-patent-icon${m.rank.brilha ? " rank-badge-icon-brilha" : ""}`}
                    />
                    <span className="monthly-rank-patent-name">{m.rank.name}</span>
                  </div>
                )}

                <div className="monthly-rank-points">
                  <strong>{m.points}</strong>
                  <span>pontos este mês</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!ehAdmin && <TitulosPerfil userId={userId} />}

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Pontuação vitalícia</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: -6 }}>
          Total histórico desde o início — só um título, sem patente vinculada (patente é do mês).
        </p>
        {profile.lifetime.length === 0 && (
          <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Ainda não pontuou em nenhum jogo.</p>
        )}
        {profile.lifetime.map((l) => (
          <div key={l.gameKey} className="friend-row">
            <span>{GAME_NAMES[l.gameKey] || l.gameKey}</span>
            <strong>{l.points} pts</strong>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
}
