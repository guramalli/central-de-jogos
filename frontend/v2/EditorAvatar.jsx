import { useEffect, useState } from "react";
import { api } from "./api.js";
import { esquecerPerfil } from "./perfil.js";
import { useCatalogoAvatar, motivoDe, minuscula, slotDasPecas, CHAVE_DO_MES, mesesDeCampeao, mesCurto } from "./avatarCatalogo.js";
import AvatarBoneco, { MiniaturaPeca, corDoCabelo } from "./AvatarBoneco.jsx";
import AvisoPecaNova from "./AvisoPecaNova.jsx";

// Editor do avatar (página "Meu perfil"): prévia ao vivo de um lado, abas
// por parte do corpo do outro. Peça trancada aparece com cadeado e a dica
// de como ganhar; peça liberada mostra COMO foi ganha (o `motivo` do
// catálogo) — os dois no hover e ao tocar, pro celular. Embaixo da prévia,
// uma linha diz de onde veio a peça escolhida na aba aberta.
//
// Cabelo pintável (item.pintavel) ganha a fileira de cores embaixo das
// peças; a cor fica em config.corCabelo (chave da paleta do catálogo).
//
// Duas mãos: a aba "Mão esq." usa as MESMAS peças da mão, espelhadas.
// Troféu de campeão leva o mês na plaqueta (config.mesTrofeu, e
// mesTrofeuEsquerda na outra mão): vestir escolhe o mês mais recente, e quem
// foi campeão daquele jogo mais de uma vez ganha um seletor de mês.
//
// Tudo é grátis — nada aqui é vendido. O servidor confere de novo, ao
// salvar, se cada peça está mesmo liberada (PUT /api/avatar).
//
// VISITANTE vê o catálogo inteiro trancado ("Crie sua conta para
// desbloquear") e não salva: o avatar dele é o padrão sorteado. Deixar
// salvar só as iniciais daria trabalho de montar num boneco que some quando
// a conta de visitante é limpa — melhor usar o editor como convite.

// `foto`: a foto de perfil atual (ou null), pra prévia da opção "Foto" das
// bolinhas.
export default function EditorAvatar({ usuario, foto = null }) {
  const catalogo = useCatalogoAvatar();
  const [meu, setMeu] = useState(null); // resposta de GET /avatar/meu
  const [config, setConfig] = useState(null);
  const [aba, setAba] = useState("pele");
  const [dica, setDica] = useState(null); // peça tocada: { item, livre }
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api.get("/avatar/meu")
      .then(({ data }) => { setMeu(data); setConfig(data.config); })
      .catch(() => setMsg({ ok: false, texto: "Não foi possível carregar seu avatar agora." }));
  }, []);

  if (!catalogo || !meu || !config) {
    return (
      <section className="v2-cartao v2-avatar-editor">
        <h2>Avatar</h2>
        {msg ? <p className="v2-modal-erro" role="status">{msg.texto}</p> : <div className="v2-carregando">Carregando…</div>}
      </section>
    );
  }

  const convidado = meu.convidado;
  const liberados = new Set(meu.liberados);
  const slotAtual = catalogo.slots.find((s) => s.slot === aba) || catalogo.slots[0];
  const pecas = catalogo.itens.filter((i) => i.slot === slotDasPecas(catalogo, slotAtual.slot));
  const campeonatos = meu.campeonatos || {};
  const mudou = JSON.stringify(limpar(config, catalogo)) !== JSON.stringify(limpar(meu.config, catalogo)) || !meu.jaMontou;
  const dicaDe = (item) => (convidado ? "Crie sua conta para desbloquear." : item.dica);
  // Peça escolhida na aba aberta (a linha embaixo da prévia fala dela).
  const escolhidaNaAba = catalogo.porId.get(config[slotAtual.slot]);
  const mostrarMotivo = !convidado && escolhidaNaAba && liberados.has(escolhidaNaAba.id);
  // Mês da plaqueta: só com troféu na mão da aba aberta e mais de um mês.
  const chaveDoMes = CHAVE_DO_MES[slotAtual.slot];
  const mesesDoTrofeu = escolhidaNaAba?.placa && chaveDoMes ? mesesDeCampeao(escolhidaNaAba, campeonatos) : [];
  // Cores do cabelo: só na aba do cabelo, com um cabelo pintável vestido.
  const cabeloVestido = catalogo.porId.get(config.cabelo);
  const cores = !convidado && aba === "cabelo" && cabeloVestido?.pintavel ? catalogo.coresCabelo || [] : [];
  const corAtual = config.corCabelo || "original";
  const corNasMiniaturas = corDoCabelo(catalogo, config) ? config.corCabelo : null;

  // Veste na aba aberta (a peça da mão também vai na mão esquerda).
  function vestir(item) {
    const livre = liberados.has(item.id);
    setDica({ item, livre });
    if (!livre) return;
    setMsg(null);
    const slot = slotAtual.slot;
    setConfig((c) => {
      const nova = { ...c, [slot]: item.id };
      const chave = CHAVE_DO_MES[slot];
      if (chave) {
        // Troféu: mantém o mês se ele vale pro jogo desse troféu; senão, o
        // mais recente. Sem troféu, a mão não leva mês.
        const meses = item.placa ? mesesDeCampeao(item, campeonatos) : [];
        nova[chave] = meses.includes(c[chave]) ? c[chave] : meses[0] || null;
      }
      return nova;
    });
  }
  function escolherMes(mes) {
    setMsg(null);
    setConfig((c) => ({ ...c, [chaveDoMes]: mes }));
  }
  function pintar(chave) {
    setMsg(null);
    setConfig((c) => ({ ...c, corCabelo: chave === "original" ? null : chave }));
  }
  // Setas movem a escolha dentro da fileira de cores (padrão de radiogroup).
  function teclaNasCores(e, i) {
    const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const alvo = passo ? (i + passo + cores.length) % cores.length : e.key === "Home" ? 0 : e.key === "End" ? cores.length - 1 : null;
    if (alvo === null) return;
    e.preventDefault();
    pintar(cores[alvo].chave);
    e.currentTarget.parentElement.children[alvo]?.focus();
  }
  function tirar(slot) {
    setDica(null);
    setMsg(null);
    setConfig((c) => ({ ...c, [slot]: null, ...(CHAVE_DO_MES[slot] ? { [CHAVE_DO_MES[slot]]: null } : {}) }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const { data } = await api.put("/avatar", { config });
      setMeu((m) => ({ ...m, config: data.avatar, jaMontou: true, mostrarAvatar: data.mostrarAvatar }));
      setConfig(data.avatar);
      // Avisa as bolinhas abertas nesta aba (placar, hover...) pra buscarem
      // o perfil de novo.
      esquecerPerfil(usuario.id);
      // Primeiro avatar: o servidor ligou o avatar nas bolinhas sozinho.
      setMsg({ ok: true, texto: data.avatarLigado ? "Avatar salvo! Seu avatar agora aparece nas bolinhas do site." : "Avatar salvo!" });
    } catch (err) {
      setMsg({ ok: false, texto: err.response?.data?.error || "Erro ao salvar o avatar." });
    } finally {
      setSalvando(false);
    }
  }

  // A preferência da bolinha salva na hora (é um interruptor, não um
  // formulário). Sem avatar montado vale o padrão, então sempre pode.
  async function escolherBolinha(mostrarAvatar) {
    if (mostrarAvatar === meu.mostrarAvatar) return;
    try {
      const { data } = await api.put("/avatar", { mostrarAvatar });
      setMeu((m) => ({ ...m, mostrarAvatar: data.mostrarAvatar }));
      esquecerPerfil(usuario.id);
      setMsg({ ok: true, texto: data.mostrarAvatar ? "Seu avatar aparece agora nas bolinhas." : "Sua foto aparece agora nas bolinhas (sem foto, fica o avatar)." });
    } catch (err) {
      setMsg({ ok: false, texto: err.response?.data?.error || "Erro ao salvar a preferência." });
    }
  }

  return (
    <section className="v2-cartao v2-avatar-editor" id="avatar">
      {!convidado && <AvisoPecaNova usuarioId={usuario.id} liberados={meu.liberados} config={config} campeonatos={campeonatos} />}
      <h2>Avatar</h2>
      <p className="v2-cartao-nota">
        {convidado
          ? "Este é o seu avatar de visitante. Crie sua conta para desbloquear as peças e montar o seu."
          : "Monte seu boneco. Tudo é grátis: as peças com cadeado você ganha jogando. No seu perfil e nos pódios o avatar aparece sempre; nas bolinhas do chat, você escolhe."}
      </p>

      <div className="v2-avatar-editor-grade">
        <div className="v2-avatar-previa">
          <AvatarBoneco config={config} altura={300} rotulo="Prévia do seu avatar" />
          {mostrarMotivo && (
            <p className="v2-avatar-motivo">
              <b>{escolhidaNaAba.nome}</b> — {minuscula(motivoDe(escolhidaNaAba, campeonatos))}
            </p>
          )}
          <div className="v2-avatar-previa-bolinha" title="Como fica na bolinha">
            <span className="v2-avatar-foto" style={{ width: 40, height: 40, background: "#22164d" }}>
              <AvatarBoneco config={config} busto="cabeca" tamanho={40} preencher />
            </span>
            <small>na bolinha</small>
          </div>
        </div>

        <div className="v2-avatar-lado">
          <div className="v2-avatar-abas" role="tablist" aria-label="Partes do avatar">
            {catalogo.slots.map((s) => (
              <button
                key={s.slot}
                role="tab"
                id={`v2-avatar-aba-${s.slot}`}
                aria-selected={aba === s.slot}
                aria-controls="v2-avatar-pecas"
                className={aba === s.slot ? "ativa" : ""}
                onClick={() => { setAba(s.slot); setDica(null); }}
              >
                {NOME_CURTO_DA_ABA[s.slot] || s.nome}
              </button>
            ))}
          </div>

          <div className="v2-avatar-pecas" id="v2-avatar-pecas" role="tabpanel" aria-labelledby={`v2-avatar-aba-${slotAtual.slot}`}>
            {!slotAtual.obrigatorio && !convidado && (
              <button className={`v2-avatar-peca ${!config[slotAtual.slot] ? "escolhida" : ""}`} aria-pressed={!config[slotAtual.slot]} onClick={() => tirar(slotAtual.slot)}>
                <span className="v2-avatar-miniatura v2-avatar-nenhum" aria-hidden="true">∅</span>
                <small>Nenhum</small>
              </button>
            )}
            {[...pecas].sort((a, b) => ordemRaridade(a) - ordemRaridade(b)).map((item) => {
              const livre = liberados.has(item.id);
              const escolhida = config[slotAtual.slot] === item.id;
              return (
                <button
                  key={item.id}
                  className={`v2-avatar-peca raridade-${item.raridade || "base"} ${escolhida ? "escolhida" : ""} ${livre ? "" : "trancada"}`}
                  aria-pressed={escolhida}
                  aria-label={livre ? `${item.nome} (${minuscula(motivoDe(item, campeonatos))})` : `${item.nome} (trancado: ${dicaDe(item)})`}
                  title={livre ? `${item.nome} — ${motivoDe(item, campeonatos)}` : `🔒 ${dicaDe(item)}`}
                  onClick={() => vestir(item)}
                >
                  <span className="v2-avatar-miniatura">
                    <MiniaturaPeca item={item} slot={slotAtual.slot} corpo={config} corCabelo={item.pintavel ? corNasMiniaturas : null} />
                    {!livre && <span className="v2-avatar-cadeado" aria-hidden="true">🔒</span>}
                  </span>
                  <small>{item.nome}</small>
                  {item.raridade && item.raridade !== "base" && <em className="v2-raridade-etiqueta">{NOME_RARIDADE[item.raridade]}</em>}
                </button>
              );
            })}
          </div>
          {mesesDoTrofeu.length > 1 && !convidado && (
            <label className="v2-avatar-mes">
              <span>Mês na plaqueta do troféu</span>
              <select value={config[chaveDoMes] || mesesDoTrofeu[0]} onChange={(e) => escolherMes(e.target.value)}>
                {mesesDoTrofeu.map((m) => <option key={m} value={m}>{mesCurto(m)}</option>)}
              </select>
            </label>
          )}
          {cores.length > 0 && (
            <div className="v2-avatar-cores">
              <span id="v2-avatar-cores-rotulo">Cor do cabelo</span>
              <div role="radiogroup" aria-labelledby="v2-avatar-cores-rotulo">
                {cores.map((c, i) => (
                  <button
                    key={c.chave}
                    type="button"
                    role="radio"
                    aria-checked={corAtual === c.chave}
                    aria-label={c.nome}
                    title={c.nome}
                    tabIndex={corAtual === c.chave ? 0 : -1}
                    className={`v2-avatar-cor ${c.cor ? "" : "original"} ${corAtual === c.chave ? "escolhida" : ""}`}
                    style={c.cor ? { background: c.cor } : undefined}
                    onClick={() => pintar(c.chave)}
                    onKeyDown={(e) => teclaNasCores(e, i)}
                  >
                    {!c.cor && "Original"}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="v2-avatar-dica" role="status">
            {dica ? (dica.livre ? <>✔ <b>{dica.item.nome}</b>: {motivoDe(dica.item, campeonatos)}</> : <>🔒 <b>{dica.item.nome}</b>: {dicaDe(dica.item)}</>) : " "}
          </p>
        </div>
      </div>

      {!convidado && (
        <div className="v2-avatar-rodape">
          <button className="v2-botao v2-botao-amarelo" onClick={salvar} disabled={salvando || !mudou}>
            {salvando ? "Salvando…" : mudou ? "Salvar" : "Salvo"}
          </button>
          {/* As duas opções com a prévia de como a bolinha fica (salva na
              hora, é um interruptor). Sem foto, a bolinha já é o avatar. */}
          <div className="v2-avatar-bolinha-opcao" role="group" aria-labelledby="v2-avatar-bolinha-rotulo">
            <span id="v2-avatar-bolinha-rotulo">Nas bolinhas do chat, das salas e das listas, mostrar:</span>
            <div className="v2-avatar-bolinha-escolhas">
              <button aria-pressed={!meu.mostrarAvatar} className={!meu.mostrarAvatar ? "ativa" : ""} onClick={() => escolherBolinha(false)}>
                <span className="v2-avatar-foto" aria-hidden="true" style={{ width: 40, height: 40, background: "#22164d" }}>
                  {foto ? <img src={foto} alt="" /> : <AvatarBoneco config={meu.config} busto="cabeca" tamanho={40} preencher />}
                </span>
                <span>Foto{!foto && <small>sem foto, fica o avatar</small>}</span>
              </button>
              <button aria-pressed={meu.mostrarAvatar} className={meu.mostrarAvatar ? "ativa" : ""} onClick={() => escolherBolinha(true)}>
                <span className="v2-avatar-foto" aria-hidden="true" style={{ width: 40, height: 40, background: "#22164d" }}>
                  <AvatarBoneco config={meu.config} busto="cabeca" tamanho={40} preencher />
                </span>
                <span>Avatar</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {msg && <p className={msg.ok ? "v2-modal-ok" : "v2-modal-erro"} role="status">{msg.texto}</p>}
    </section>
  );
}

// Compara montagens ignorando slots vazios ({ chapeu: null } == {}) e cor
// de cabelo que não vale (cabelo que não se pinta — o servidor descarta).
// Nível de dificuldade da peça (vem do catálogo): ordena as peças de cada
// aba da base até a lendária e dá nome à etiqueta do card.
const ORDEM_RARIDADE = ["base", "iniciante", "intermediario", "dificil", "lendario"];
// Rótulo mais curto pra aba (10+ partes numa fileira).
const NOME_CURTO_DA_ABA = { maoEsquerda: "Mão esq." };
const NOME_RARIDADE = { base: "Base", iniciante: "Iniciante", intermediario: "Intermediário", dificil: "Difícil", lendario: "Lendário" };
const ordemRaridade = (item) => Math.max(0, ORDEM_RARIDADE.indexOf(item.raridade || "base"));

function limpar(c, catalogo) {
  const semCor = !corDoCabelo(catalogo, c);
  return Object.fromEntries(
    Object.entries(c || {}).filter(([k, v]) => v && !(k === "corCabelo" && semCor)).sort(([a], [b]) => a.localeCompare(b))
  );
}
