import { useEffect, useState } from "react";
import { api } from "./api.js";
import { esquecerPerfil } from "./perfil.js";
import { useCatalogoAvatar } from "./avatarCatalogo.js";
import AvatarBoneco from "./AvatarBoneco.jsx";

// Editor do avatar (página "Meu perfil"): prévia ao vivo de um lado, abas
// por parte do corpo do outro. Peça trancada aparece com cadeado e a dica
// de como ganhar (no hover e ao tocar, pro celular).
//
// Tudo é grátis — nada aqui é vendido. O servidor confere de novo, ao
// salvar, se cada peça está mesmo liberada (PUT /api/avatar).

// Enquadramento da miniatura de cada parte (pixels da tela 900×1200): um
// chapéu visto no corpo inteiro ficaria minúsculo. Ajustar junto com a arte.
const CORPO_TODO = { x: -150, y: 0, lado: 1200 };
const ENQUADRAMENTO = {
  pele: CORPO_TODO,
  cabelo: { x: 225, y: 40, lado: 450 },
  chapeu: { x: 225, y: 0, lado: 450 },
  rosto: { x: 250, y: 150, lado: 400 },
  pescoco: { x: 250, y: 380, lado: 400 },
  roupa: { x: 175, y: 450, lado: 550 },
  parteDeBaixo: { x: 200, y: 700, lado: 500 },
  costas: CORPO_TODO,
  mao: CORPO_TODO,
  fundo: CORPO_TODO,
};

export default function EditorAvatar({ usuario }) {
  const catalogo = useCatalogoAvatar();
  const [meu, setMeu] = useState(null); // resposta de GET /avatar/meu
  const [config, setConfig] = useState(null);
  const [aba, setAba] = useState("pele");
  const [dica, setDica] = useState(null); // peça trancada tocada
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

  const liberados = new Set(meu.liberados);
  const slotAtual = catalogo.slots.find((s) => s.slot === aba) || catalogo.slots[0];
  const pecas = catalogo.itens.filter((i) => i.slot === slotAtual.slot);
  const mudou = JSON.stringify(limpar(config)) !== JSON.stringify(limpar(meu.config)) || !meu.jaMontou;

  function vestir(item) {
    if (!liberados.has(item.id)) { setDica(item); return; }
    setDica(null);
    setMsg(null);
    setConfig((c) => ({ ...c, [item.slot]: item.id }));
  }
  function tirar(slot) {
    setDica(null);
    setMsg(null);
    setConfig((c) => ({ ...c, [slot]: null }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const { data } = await api.put("/avatar", { config });
      setMeu((m) => ({ ...m, config: data.avatar, jaMontou: true }));
      setConfig(data.avatar);
      esquecerPerfil(usuario.id);
      setMsg({ ok: true, texto: "Avatar salvo!" });
    } catch (err) {
      setMsg({ ok: false, texto: err.response?.data?.error || "Erro ao salvar o avatar." });
    } finally {
      setSalvando(false);
    }
  }

  // A preferência da bolinha salva na hora (é um interruptor, não um
  // formulário). Só vale depois de ter um avatar salvo.
  async function escolherBolinha(mostrarAvatar) {
    if (mostrarAvatar === meu.mostrarAvatar) return;
    try {
      const { data } = await api.put("/avatar", { mostrarAvatar });
      setMeu((m) => ({ ...m, mostrarAvatar: data.mostrarAvatar }));
      esquecerPerfil(usuario.id);
      setMsg({ ok: true, texto: data.mostrarAvatar ? "Seu avatar aparece agora nas bolinhas." : "Sua foto aparece agora nas bolinhas." });
    } catch (err) {
      setMsg({ ok: false, texto: err.response?.data?.error || "Erro ao salvar a preferência." });
    }
  }

  return (
    <section className="v2-cartao v2-avatar-editor">
      <h2>Avatar</h2>
      <p className="v2-cartao-nota">Monte seu boneco. Tudo é grátis: as peças com cadeado você ganha jogando. No seu perfil, nos pódios e nas salas de jogo, o avatar aparece no lugar da foto.</p>

      <div className="v2-avatar-editor-grade">
        <div className="v2-avatar-previa">
          <AvatarBoneco config={config} altura={300} rotulo="Prévia do seu avatar" />
          <div className="v2-avatar-previa-bolinha" title="Como fica na bolinha">
            <span className="v2-avatar-foto" style={{ width: 52, height: 52, background: "#22164d" }}>
              <AvatarBoneco config={config} busto tamanho={52} preencher />
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
                {s.nome}
              </button>
            ))}
          </div>

          <div className="v2-avatar-pecas" id="v2-avatar-pecas" role="tabpanel" aria-labelledby={`v2-avatar-aba-${slotAtual.slot}`}>
            {!slotAtual.obrigatorio && (
              <button className={`v2-avatar-peca ${!config[slotAtual.slot] ? "escolhida" : ""}`} aria-pressed={!config[slotAtual.slot]} onClick={() => tirar(slotAtual.slot)}>
                <span className="v2-avatar-miniatura v2-avatar-nenhum" aria-hidden="true">∅</span>
                <small>Nenhum</small>
              </button>
            )}
            {pecas.map((item) => {
              const livre = liberados.has(item.id);
              const escolhida = config[item.slot] === item.id;
              return (
                <button
                  key={item.id}
                  className={`v2-avatar-peca ${escolhida ? "escolhida" : ""} ${livre ? "" : "trancada"}`}
                  aria-pressed={escolhida}
                  aria-label={livre ? item.nome : `${item.nome} (trancado: ${item.dica})`}
                  title={livre ? item.nome : `🔒 ${item.dica}`}
                  onClick={() => vestir(item)}
                >
                  <span className="v2-avatar-miniatura">
                    <AvatarBoneco config={{ [item.slot]: item.id }} busto tamanho={64} recorte={ENQUADRAMENTO[item.slot]} />
                    {!livre && <span className="v2-avatar-cadeado" aria-hidden="true">🔒</span>}
                  </span>
                  <small>{item.nome}</small>
                </button>
              );
            })}
          </div>
          <p className="v2-avatar-dica" role="status">
            {dica ? <>🔒 <b>{dica.nome}</b>: {dica.dica}</> : " "}
          </p>
        </div>
      </div>

      <div className="v2-avatar-rodape">
        <button className="v2-botao v2-botao-amarelo" onClick={salvar} disabled={salvando || !mudou}>
          {salvando ? "Salvando…" : mudou ? "Salvar" : "Salvo"}
        </button>
        <div className="v2-avatar-bolinha-opcao" role="group" aria-labelledby="v2-avatar-bolinha-rotulo">
          <span id="v2-avatar-bolinha-rotulo">Na bolinha do chat e das listas, mostrar:</span>
          <div className="v2-avatar-segmento">
            <button aria-pressed={!meu.mostrarAvatar} className={!meu.mostrarAvatar ? "ativa" : ""} onClick={() => escolherBolinha(false)}>Foto</button>
            <button
              aria-pressed={meu.mostrarAvatar}
              className={meu.mostrarAvatar ? "ativa" : ""}
              onClick={() => escolherBolinha(true)}
              disabled={!meu.jaMontou}
              title={meu.jaMontou ? undefined : "Salve seu avatar primeiro"}
            >
              Avatar
            </button>
          </div>
        </div>
      </div>
      {msg && <p className={msg.ok ? "v2-modal-ok" : "v2-modal-erro"} role="status">{msg.texto}</p>}
    </section>
  );
}

// Compara montagens ignorando slots vazios ({ chapeu: null } == {}).
function limpar(c) {
  return Object.fromEntries(Object.entries(c || {}).filter(([, v]) => v).sort(([a], [b]) => a.localeCompare(b)));
}
