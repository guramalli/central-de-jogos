// Área dos amigos: os personagens com rosto de amigos de verdade vêm trancados em assets/vip/amigos.bin
// (AES-256-GCM, ver tools/vip_trancar.mjs). Com a senha certa, o servidor devolve a chave; ela fica salva neste
// aparelho e o jogo destranca o pacote no navegador. Sem a chave, os amigos aparecem como bonecos.
// API: NSF.VIP.pronto (Promise: pacote destrancado ou não) ; .url(caminho) (endereço do arquivo destrancado, ou o
//      próprio caminho) ; .ativo() ; .entrar(senha) (Promise; rejeita com a mensagem de erro) ; .sair()
(function (global) {
  "use strict";
  const NSF = global.NSF = global.NSF || {};
  const LS = "nsf_vip_chave", PACOTE = "assets/vip/amigos.bin";
  const host = global.location ? global.location.hostname : "";
  const API = /(^|\.)educacaogamer\.com\.br$/.test(host) ? "https://api.educacaogamer.com.br"
    : "http://localhost:4000"; // o site rodando no computador (backend com npm run dev)

  const urls = new Map();
  const ler = () => { try { return global.localStorage.getItem(LS) || ""; } catch (e) { return ""; } };
  const hex = (h) => new Uint8Array(h.match(/../g).map((b) => parseInt(b, 16)));

  async function destrancar(chaveHex) {
    const bruto = new Uint8Array(await (await fetch(PACOTE, { cache: "no-cache" })).arrayBuffer());
    const chave = await global.crypto.subtle.importKey("raw", hex(chaveHex), "AES-GCM", false, ["decrypt"]);
    const claro = new Uint8Array(await global.crypto.subtle.decrypt({ name: "AES-GCM", iv: bruto.slice(0, 12) }, chave, bruto.slice(12)));
    const tam = new DataView(claro.buffer).getUint32(0, true);
    const indice = JSON.parse(new TextDecoder().decode(claro.subarray(4, 4 + tam)));
    const base = 4 + tam;
    for (const a of indice.arquivos) {
      urls.set(a.c, URL.createObjectURL(new Blob([claro.subarray(base + a.i, base + a.i + a.n)], { type: a.t })));
    }
  }

  const chaveSalva = ler();
  const pronto = (/^[0-9a-f]{64}$/.test(chaveSalva) && global.crypto && global.crypto.subtle)
    ? destrancar(chaveSalva).catch(() => { // chave velha (o pacote foi trancado de novo): pede a senha outra vez
      try { global.localStorage.removeItem(LS); } catch (e) { /* ok */ }
    })
    : Promise.resolve();

  async function entrar(senha) {
    let r;
    try {
      r = await fetch(API + "/api/thelastdance/vip", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }) });
    } catch (e) { throw new Error("Sem conexão com o servidor. Tente de novo."); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.chave) throw new Error(d.error || "Não deu certo. Tente de novo.");
    await destrancar(d.chave); // confere se a chave abre o pacote antes de guardar
    try { global.localStorage.setItem(LS, d.chave); } catch (e) { /* sem armazenamento: vale só agora */ }
  }
  function sair() {
    try { global.localStorage.removeItem(LS); } catch (e) { /* ok */ }
    for (const u of urls.values()) URL.revokeObjectURL(u);
    urls.clear();
  }

  NSF.VIP = { pronto, url: (c) => urls.get(c) || c, ativo: () => urls.size > 0, entrar, sair };
})(typeof window !== "undefined" ? window : globalThis);
