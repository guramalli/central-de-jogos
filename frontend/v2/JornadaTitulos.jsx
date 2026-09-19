// JORNADA DE TÍTULOS (só leitura) — o que a pessoa já conquistou, o que
// falta e quanto falta pro próximo de cada tema. Mesmo conteúdo da vitrine
// do clássico no perfil dos outros (src/components/TitulosPerfil.jsx).
const nivel = (logo) => (typeof logo === "string" && logo.match(/-(bronze|prata|ouro)\.png$/i)?.[1]?.toLowerCase()) || "";

function Linha({ rotulo, valor = 0, unidade, niveis = [], proximo }) {
  const pct = proximo ? Math.min(100, Math.round((valor / proximo.min) * 100)) : 100;
  return (
    <div className="v2-titulos-linha">
      <div className="v2-titulos-linha-topo"><b>{rotulo}</b><span>{valor.toLocaleString("pt-BR")} {unidade}</span></div>
      <div className="v2-titulos">
        {niveis.map((n) => (
          <div key={n.nome} className={`v2-titulo ${n.desbloqueado ? "ok" : ""} leitura`}>
            {n.logo ? <img src={n.logo} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} /> : <span className="v2-titulo-sem" />}
            <b className={n.desbloqueado ? `v2-medalha-${nivel(n.logo)}` : ""}>{n.nome}</b>
            <small>{n.desbloqueado ? "conquistado" : `${n.min} ${unidade}`}</small>
          </div>
        ))}
      </div>
      {proximo && (
        <div className="v2-titulo-progresso" title={`${valor} de ${proximo.min} ${unidade}`}>
          <div className="v2-titulo-progresso-barra" role="progressbar" aria-valuemin={0} aria-valuemax={proximo.min} aria-valuenow={valor} aria-label={`Progresso até ${proximo.nome}`}><div style={{ width: `${pct}%` }} /></div>
          <span>faltam <b>{Math.max(0, proximo.min - valor).toLocaleString("pt-BR")}</b> {unidade} para <b>{proximo.nome}</b> · {pct}%</span>
        </div>
      )}
    </div>
  );
}

export default function JornadaTitulos({ titulos }) {
  const { lendario, quiz = [], stop = [] } = titulos || {};
  return (
    <div className="v2-jornada">
      {lendario && (
        <div className={`v2-lendario ${lendario.desbloqueado ? "ok" : ""}`}>
          {lendario.logo && <img src={lendario.logo} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />}
          <div>
            <b>{lendario.nome}</b>
            <small>{lendario.descricao}</small>
            {lendario.desbloqueado ? <span className="v2-selo-ok">Conquistado</span> : (
              <>
                <div className="v2-missao-barra"><div style={{ width: `${Math.round((lendario.conquistados / lendario.total) * 100)}%` }} /></div>
                <small>{lendario.conquistados} de {lendario.total} — faltam {lendario.faltam}</small>
              </>
            )}
          </div>
        </div>
      )}
      {quiz.length > 0 && <div className="v2-bloco-titulo">Quiz — acertos por tema</div>}
      {quiz.map((t) => <Linha key={t.tema} rotulo={t.nomeTema} valor={t.acertos} unidade="acertos" niveis={t.titulos} proximo={t.proximo} />)}
      {stop.length > 0 && <div className="v2-bloco-titulo">Stop — STOPs pedidos</div>}
      {stop.map((t) => <Linha key={t.grupo} rotulo={t.rotulo} valor={t.stops} unidade="STOPs" niveis={t.titulos} proximo={t.proximo} />)}
    </div>
  );
}
