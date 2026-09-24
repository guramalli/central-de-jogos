import { useEffect, useState } from "react";
import { api, sair } from "./api.js";
import Topo from "./Topo.jsx";
import JornadaTitulos from "./JornadaTitulos.jsx";
import Rodape from "./Rodape.jsx";
import { irParaPagina } from "./App.jsx";
import Avatar from "./Avatar.jsx";
import AvatarBoneco from "./AvatarBoneco.jsx";

const JOGOS = { stop: "Stop", quiz: "Quiz", acromania: "Acromania" };

function membroDesde(d) {
  if (!d) return "—";
  const s = new Date(d).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Mesma regra do clássico: o dado tem precisão de DIA.
function vistoPorUltimo(d) {
  if (!d) return null;
  const data = new Date(d);
  if (Number.isNaN(data.getTime())) return null;
  const dia = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const dias = Math.round((dia(new Date()) - dia(data)) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 30) { const s = Math.floor(dias / 7); return s === 1 ? "há 1 semana" : `há ${s} semanas`; }
  if (dias < 365) { const m = Math.floor(dias / 30); return m === 1 ? "há 1 mês" : `há ${m} meses`; }
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function horas(min) {
  if (!min) return "0 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h.toLocaleString("pt-BR")}h${min % 60 ? ` ${min % 60}min` : ""}`;
}

// "2026-08" -> "agosto de 2026"
function mesPorExtenso(k) {
  const [a, m] = String(k).split("-").map(Number);
  if (!a || !m) return k;
  return new Date(a, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

const nivelDaMedalha = (logo) => (typeof logo === "string" && logo.match(/-(bronze|prata|ouro)\.png$/i)?.[1]?.toLowerCase()) || "";

export default function Perfil({ usuario, userId }) {
  const [perfil, setPerfil] = useState(null);
  const [erro, setErro] = useState("");
  const [titulos, setTitulos] = useState([]);
  const [trofeus, setTrofeus] = useState([]);
  const [jornada, setJornada] = useState(null); // resposta completa de /titulos
  const [verJornada, setVerJornada] = useState(false);
  const [verTodos, setVerTodos] = useState(false);
  const [amizade, setAmizade] = useState(null);
  const [erroAmizade, setErroAmizade] = useState("");
  const [meuCla, setMeuCla] = useState(null);
  const [convite, setConvite] = useState("");
  const souEu = userId === usuario.id;

  useEffect(() => {
    api.get(`/users/${userId}/profile`).then(({ data }) => setPerfil(data)).catch(() => setErro("Não foi possível carregar esse perfil."));
    api.get(`/users/${userId}/titulos`)
      .then(({ data }) => {
        setTitulos([...(data.quiz || []), ...(data.stop || [])].map((t) => (t.desbloqueados || []).at(-1)).filter(Boolean));
        setTrofeus(data.trofeus?.todos || []);
        setJornada(data);
      })
      .catch(() => { setTitulos([]); setTrofeus([]); });
  }, [userId]);

  // Botão "convidar pro clã" só pra dono de clã, e só se o perfil não tem clã.
  useEffect(() => {
    if (!perfil || perfil.clan || souEu) return;
    api.get("/clans/mine").then(({ data }) => setMeuCla(data?.clan?.isOwner ? data.clan : null)).catch(() => {});
  }, [perfil, souEu]);

  async function addAmigo() {
    setAmizade("enviando"); setErroAmizade("");
    try { await api.post("/friends/request", { targetUserId: userId }); setAmizade("ok"); }
    catch (e) { setAmizade(null); setErroAmizade(e.response?.data?.error || "Erro ao enviar pedido."); }
  }
  async function convidarCla() {
    setConvite("enviando");
    try { await api.post("/clans/invite", { userId: perfil.id }); setConvite("ok"); }
    catch (e) { setConvite(e.response?.data?.error || "Não foi possível convidar."); }
  }

  const admin = perfil?.role === "ADMIN";
  const visiveis = verTodos ? titulos : titulos.slice(0, 12);
  const visto = vistoPorUltimo(perfil?.ultimoAcesso);

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo={souEu ? "jogador" : null} />
      <main className="v2-pagina">
        {erro && <div className="v2-faixa-aviso erro">{erro}</div>}
        {!perfil && !erro && <div className="v2-carregando">Carregando perfil…</div>}

        {perfil && (
          <>
            <section className="v2-cartao v2-perfil-cabeca">
              {/* Lugar grande: com avatar montado, o boneco de corpo inteiro
                  aparece sempre (a escolha Foto/Avatar vale só pras bolinhas). */}
              {perfil.avatar ? (
                <div className="v2-perfil-boneco"><AvatarBoneco config={perfil.avatar} altura={220} rotulo={`Avatar de ${perfil.nickname}`} /></div>
              ) : (
                <Avatar userId={userId} nickname={perfil.nickname} tamanho={112} borda />
              )}
              <div className="v2-perfil-info">
                <h1>{perfil.nickname}</h1>
                <div className="v2-perfil-fatos">
                  <span>Membro desde {membroDesde(perfil.memberSince)}</span>
                  <span>{horas(perfil.playtimeMinutes)} jogados</span>
                  {visto && <span>visto {visto}</span>}
                </div>
                <div className="v2-perfil-cla">
                  {perfil.clan ? <a href={`/v2/?pagina=cla&id=${perfil.clan.id}`} onClick={(e) => { e.preventDefault(); irParaPagina("cla", { id: perfil.clan.id }); }}>Clã {perfil.clan.name} [{perfil.clan.tag}]</a> : <span>Sem clã</span>}
                  {meuCla && (convite === "ok" ? <span className="ok">Convite enviado</span>
                    : <button className="v2-botao-pequeno" onClick={convidarCla} disabled={convite === "enviando"}>{convite === "enviando" ? "Enviando…" : `Convidar pro ${meuCla.name}`}</button>)}
                </div>
                {convite && !["ok", "enviando"].includes(convite) && <div className="v2-erro-pequeno">{convite}</div>}
                <div className="v2-perfil-acoes">
                  {souEu ? (
                    <div className="v2-perfil-meus-botoes">
                      <a className="v2-botao v2-botao-amarelo" href="/v2/?pagina=editar-perfil" onClick={(e) => { e.preventDefault(); irParaPagina("editar-perfil"); }}>Editar meu perfil</a>
                      <button className="v2-botao v2-botao-contorno" onClick={() => { if (confirm("Sair da conta?")) { sair(); window.location.replace("/v2/"); } }}>Sair</button>
                    </div>
                  ) : amizade === "ok" || perfil.friendshipStatus === "pending_sent" ? (
                    <span className="v2-selo-ok">Pedido de amizade enviado</span>
                  ) : perfil.friendshipStatus === "friends" ? (
                    <button className="v2-botao v2-botao-amarelo" onClick={() => irParaPagina("amigos", { id: userId })}>Mandar mensagem</button>
                  ) : perfil.friendshipStatus === "pending_received" ? (
                    <a className="v2-link" href="/v2/?pagina=amigos" onClick={(e) => { e.preventDefault(); irParaPagina("amigos"); }}>Te mandou um pedido — responder</a>
                  ) : (
                    <button className="v2-botao v2-botao-amarelo" onClick={addAmigo} disabled={amizade === "enviando"}>{amizade === "enviando" ? "Enviando…" : "+ Adicionar amigo"}</button>
                  )}
                </div>
                {erroAmizade && <div className="v2-erro-pequeno">{erroAmizade}</div>}
              </div>
            </section>

            {trofeus.length > 0 && (
              <section className="v2-trofeus-perfil" aria-label="Títulos de campeão mensal">
                {trofeus.map((t) => (
                  <div key={`${t.gameKey}-${t.monthKey}`} className="v2-trofeu-perfil">
                    <span className="v2-trofeu-brilho" aria-hidden="true" />
                    {t.logo && <img src={t.logo} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />}
                    <div>
                      <span className="v2-trofeu-rotulo">Campeão do mês</span>
                      <b>Vencedor de {mesPorExtenso(t.monthKey)} no {JOGOS[t.gameKey] || t.gameKey}</b>
                      <em>{Number(t.points || 0).toLocaleString("pt-BR")} pts no mês</em>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {admin ? (
              <section className="v2-cartao v2-perfil-admin">
                <img src="/ranks/admin.png" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div><h2>Administrador do Site</h2><p>Conta oficial do Educação Gamer. Não participa dos rankings nem da premiação.</p></div>
              </section>
            ) : (
              <>
                {perfil.monthly?.length > 0 && (
                  <section className="v2-cartao">
                    <h2>Este mês</h2>
                    <div className="v2-mes-grade">
                      {perfil.monthly.map((m) => (
                        <div key={m.gameKey} className="v2-mes-card">
                          <div className="v2-mes-topo"><b>{JOGOS[m.gameKey] || m.gameKey}</b>{m.position && <span>{m.position}º no mês</span>}</div>
                          {m.rank && (
                            <div className="v2-mes-patente">
                              {m.rank.icon && <img src={m.rank.icon} alt="" className={m.rank.brilha ? "brilha" : ""} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                              <span>{m.rank.name}</span>
                            </div>
                          )}
                          <div className="v2-mes-pontos"><b>{(m.points || 0).toLocaleString("pt-BR")}</b><span>pontos este mês</span></div>
                          {m.nextRank && <div className="v2-mes-falta">faltam {m.nextRank.pointsNeeded.toLocaleString("pt-BR")} pra {m.nextRank.name}</div>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {(perfil.achievements?.length > 0 || titulos.length > 0) && (
                  <section className="v2-cartao">
                    <h2>Conquistas</h2>
                    <div className="v2-conquistas">
                      {perfil.achievements.map((a, i) => (
                        <div key={`a${i}`} className="v2-conquista">
                          {a.iconUrl ? <img src={a.iconUrl} alt="" /> : <span className="v2-conquista-icone">{a.icon}</span>}
                          <div><b>{a.label}</b>{a.detalhe && <small>{a.detalhe}</small>}</div>
                        </div>
                      ))}
                      {visiveis.map((t) => (
                        <div key={t.nome} className="v2-conquista">
                          {t.logo ? <img src={t.logo} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} /> : <span className="v2-conquista-icone" />}
                          <div><b className={`v2-medalha-${nivelDaMedalha(t.logo)}`}>{t.nome}</b></div>
                        </div>
                      ))}
                    </div>
                    {titulos.length > 12 && (
                      <button className="v2-botao-pequeno" onClick={() => setVerTodos((v) => !v)}>{verTodos ? "Mostrar menos" : `Ver todos (+${titulos.length - 12})`}</button>
                    )}
                    {souEu ? <a className="v2-link v2-link-bloco" href="/v2/?pagina=editar-perfil" onClick={(e) => { e.preventDefault(); irParaPagina("editar-perfil"); }}>Ver e escolher meus títulos</a> : (
                      <button type="button" className="v2-link v2-link-bloco" aria-expanded={verJornada} onClick={() => setVerJornada((v) => !v)}>{verJornada ? "Esconder a jornada de títulos" : "Ver a jornada completa de títulos"}</button>
                    )}
                    {!souEu && verJornada && jornada && <JornadaTitulos titulos={jornada} />}
                  </section>
                )}

                <section className="v2-cartao">
                  <h2>Pontuação vitalícia</h2>
                  <p className="v2-cartao-nota">Total histórico desde o início — não zera e não tem patente.</p>
                  {perfil.lifetime.length === 0 && <p className="v2-cartao-nota">Ainda não pontuou em nenhum jogo.</p>}
                  <div className="v2-vitalicia">
                    {perfil.lifetime.map((l) => (
                      <div key={l.gameKey}><span>{JOGOS[l.gameKey] || l.gameKey}</span><b>{l.points.toLocaleString("pt-BR")}</b></div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
      <Rodape />
    </div>
  );
}
