import { useEffect, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import AvatarBoneco, { MiniaturaPeca } from "./AvatarBoneco.jsx";
import AvisoPecaNova from "./AvisoPecaNova.jsx";
import { useCatalogoAvatar } from "./avatarCatalogo.js";
import { NOMES_JOGOS as NOMES } from "./navegacao.js";

// Resumo do jogador (antes no topo do Início, agora em Eu): avatar, patente
// do mês nos jogos em que mais pontuou, o próximo título e a próxima peça.
export default function PainelJogador({ usuario }) {
  const [perfil, setPerfil] = useState(null);
  const [titulos, setTitulos] = useState(null);
  const [meuAvatar, setMeuAvatar] = useState(null); // GET /avatar/meu

  useEffect(() => {
    let vivo = true;
    api.get(`/users/${usuario.id}/profile`).then(({ data }) => vivo && setPerfil(data)).catch(() => {});
    api.get(`/users/${usuario.id}/titulos`).then(({ data }) => vivo && setTitulos(data)).catch(() => {});
    // Peças liberadas + a próxima (cache de 60s no servidor): alimenta o
    // "Próxima peça" e o aviso de peça nova.
    api.get("/avatar/meu").then(({ data }) => vivo && setMeuAvatar(data)).catch(() => {});
    return () => { vivo = false; };
  }, [usuario.id]);

  // Próximo título mais perto de sair (mesma conta do clássico).
  const candidatos = [];
  for (const t of titulos?.quiz || []) if (t.proximo) candidatos.push({ nome: t.proximo.nome, atual: t.acertos, alvo: t.proximo.min, logo: t.proximo.logo, unidade: "acertos" });
  for (const t of titulos?.stop || []) if (t.proximo) candidatos.push({ nome: t.proximo.nome, atual: t.stops, alvo: t.proximo.min, logo: t.proximo.logo, unidade: "STOPs" });
  const proximoTitulo = candidatos.filter((c) => c.atual > 0).sort((a, b) => b.atual / b.alvo - a.atual / a.alvo)[0];
  // No máximo 3 cartões no painel da direita. Os jogos vão do que a pessoa
  // mais pontuou no mês pro que menos; se houver um título perto de sair,
  // ele fica com a última vaga (a meta mais concreta).
  const MAX_CARTOES = 3;
  const vagasJogos = MAX_CARTOES - (proximoTitulo ? 1 : 0);
  const mensal = (perfil?.monthly || [])
    .filter((m) => NOMES[m.gameKey])
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, vagasJogos);

  return (
    <section className="v2-cartao v2-boas-vindas">
      <div className="v2-boas-vindas-texto">
        <div className="v2-boas-vindas-eu">
          {perfil?.avatar && (
            <a className="v2-boas-vindas-avatar" href={linkDaPagina("editar-perfil")} onClick={(e) => { e.preventDefault(); irParaPagina("editar-perfil"); }} title="Editar meu avatar">
              {/* Sem o fundo escolhido: o quadrado dele brigava com o cartão. O
                  fundo aparece no editor, no perfil e no cartão de compartilhar. */}
              <AvatarBoneco config={perfil.avatar} altura={170} rotulo="Seu avatar" semFundo />
            </a>
          )}
          <div>
            <span className="v2-sobretitulo">Bem-vindo de volta</span>
            <h1>{usuario.nickname}</h1>
            {perfil?.visitas > 1 && <p>Essa é sua <b>{perfil.visitas}ª</b> vez no portal.</p>}
          </div>
        </div>
        <ProximaPeca meu={meuAvatar} />
      </div>
      {meuAvatar && !meuAvatar.convidado && <AvisoPecaNova usuarioId={usuario.id} liberados={meuAvatar.liberados} config={perfil?.avatar || meuAvatar.config} campeonatos={meuAvatar.campeonatos} />}
      <div className="v2-painel-jogador">
        {mensal.length === 0 && !proximoTitulo && <div className="v2-vazio">Jogue uma partida pra aparecer aqui a sua patente do mês.</div>}
        {mensal.map((m) => {
          const alvo = m.nextRank ? m.points + m.nextRank.pointsNeeded : null;
          const pct = alvo ? Math.min(100, Math.round((m.points / alvo) * 100)) : 100;
          return (
            <a key={m.gameKey} className="v2-painel-item" href={linkDaPagina("ranking", { jogo: m.gameKey })} onClick={(e) => { e.preventDefault(); irParaPagina("ranking", { jogo: m.gameKey }); }}>
              <div className="v2-painel-topo">
                {m.rank?.icon && <img src={m.rank.icon} alt="" className={m.rank.brilha ? "brilha" : ""} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                <div>
                  <span>{NOMES[m.gameKey]}</span>
                  <b>{m.rank?.name}{m.position ? ` · ${m.position}º no mês` : ""}</b>
                </div>
                <em>{m.points.toLocaleString("pt-BR")} pts</em>
              </div>
              {m.nextRank && (
                <>
                  <div className="v2-missao-barra"><div style={{ width: `${pct}%` }} /></div>
                  <small>faltam {m.nextRank.pointsNeeded.toLocaleString("pt-BR")} pra {m.nextRank.name}</small>
                </>
              )}
            </a>
          );
        })}
        {proximoTitulo && (
          <a className="v2-painel-item" href={linkDaPagina("editar-perfil")} onClick={(e) => { e.preventDefault(); irParaPagina("editar-perfil"); }}>
            <div className="v2-painel-topo">
              {proximoTitulo.logo && <img src={proximoTitulo.logo} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
              <div><span>Próximo título</span><b>{proximoTitulo.nome}</b></div>
              <em>{proximoTitulo.atual}/{proximoTitulo.alvo}</em>
            </div>
            <div className="v2-missao-barra"><div style={{ width: `${Math.min(100, Math.round((proximoTitulo.atual / proximoTitulo.alvo) * 100))}%` }} /></div>
            <small>{proximoTitulo.alvo - proximoTitulo.atual} {proximoTitulo.unidade} pra conquistar</small>
          </a>
        )}
      </div>
    </section>
  );
}

// "Próxima peça": a peça trancada mais perto de sair (calculada no servidor
// junto com as liberadas), com barra de progresso. Abre o editor do avatar.
function ProximaPeca({ meu }) {
  const catalogo = useCatalogoAvatar();
  if (!meu) return null;
  const abrir = (e) => { e.preventDefault(); irParaPagina("editar-perfil"); };
  if (meu.convidado) {
    return (
      <a className="v2-proxima-peca" href={linkDaPagina("editar-perfil")} onClick={abrir}>
        <div><span>Seu avatar</span><b>Crie sua conta para desbloquear peças</b></div>
      </a>
    );
  }
  const p = meu.proxima;
  const item = p && catalogo?.porId.get(p.id);
  if (!item) return null;
  const pct = Math.min(100, Math.round((p.atual / p.meta) * 100));
  return (
    <a className="v2-proxima-peca" href={linkDaPagina("editar-perfil")} onClick={abrir} title={item.dica}>
      <span className="v2-avatar-miniatura"><MiniaturaPeca item={item} tamanho={48} corpo={meu.config} /></span>
      <div>
        <span>Próxima peça</span>
        <b>{item.nome}</b>
        <div className="v2-missao-barra" role="progressbar" aria-valuemin={0} aria-valuemax={p.meta} aria-valuenow={p.atual} aria-label={`Progresso até ${item.nome}`}><div style={{ width: `${pct}%` }} /></div>
        <small>faltam {p.faltam.toLocaleString("pt-BR")} {p.unidade}</small>
      </div>
    </a>
  );
}
