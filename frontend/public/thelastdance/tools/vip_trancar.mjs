// Tranca os personagens dos amigos (rostos de pessoas reais) num pacote criptografado que pode ir para o site:
// assets/vip/amigos.bin = AES-256-GCM de todas as imagens/arquivos das pastas abaixo. Sem a chave, é ilegível.
// O jogo pede a senha ao servidor (api.educacaogamer.com.br/api/thelastdance/vip), recebe a chave e destranca no navegador.
//
//   node tools/vip_trancar.mjs            → tranca usando a chave de tools/.vip_chave (cria uma nova se não existir)
//
// A chave fica SÓ em tools/.vip_chave (fora do git) e na variável TLD_CHAVE do Render. Trocar a chave obriga a
// trancar de novo e publicar; trocar só a senha (TLD_SENHA no Render) não precisa de nada aqui.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, relative, dirname, extname } from "node:path";
import { randomBytes, createCipheriv } from "node:crypto";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASTAS = ["assets/characters/npcs/gustavinho", "assets/characters/npcs/vibola",
  "assets/characters/npcs/vini", "assets/characters/npcs/juan",
  "assets/characters/npcs/pabo", "assets/characters/npcs/elcio", "assets/characters/npcs/jamil",
  "assets/audio/amigos", // vozes dos amigos (áudios de WhatsApp)
  "assets/audio/local"];  // músicas/sons com dono (sertanejo do churrasco, TV): só trancados, jogo fechado por senha
const ARQ_CHAVE = join(RAIZ, "tools/.vip_chave");
const SAIDA = join(RAIZ, "assets/vip/amigos.bin");
const TIPOS = { ".mp3": "audio/mpeg", ".png": "image/png", ".json": "application/json", ".webp": "image/webp", ".jpg": "image/jpeg" };

let chave;
if (existsSync(ARQ_CHAVE)) chave = Buffer.from(readFileSync(ARQ_CHAVE, "utf8").trim(), "hex");
else {
  chave = randomBytes(32);
  writeFileSync(ARQ_CHAVE, chave.toString("hex") + "\n");
  console.log("Chave nova criada em tools/.vip_chave — copie o conteúdo para a variável TLD_CHAVE no Render.");
}
if (chave.length !== 32) throw new Error("tools/.vip_chave precisa ter 64 caracteres hex");

const arquivos = [];
const varrer = (p) => {
  for (const nome of readdirSync(p)) {
    const c = join(p, nome);
    if (statSync(c).isDirectory()) varrer(c);
    else if (TIPOS[extname(nome).toLowerCase()]) arquivos.push(c);
  }
};
for (const pasta of PASTAS) {
  const p = join(RAIZ, pasta);
  if (!existsSync(p)) { console.log("(sem a pasta " + pasta + ", pulando)"); continue; }
  varrer(p);
}

// Conteúdo: [4 bytes = tamanho do índice][índice JSON][arquivos colados]. Índice: { arquivos: [{ c, i, n, t }] }
const blocos = [], indice = { versao: 1, arquivos: [] };
let pos = 0;
for (const a of arquivos.sort()) {
  const dados = readFileSync(a);
  indice.arquivos.push({ c: relative(RAIZ, a).split("\\").join("/"), i: pos, n: dados.length, t: TIPOS[extname(a).toLowerCase()] });
  blocos.push(dados); pos += dados.length;
}
const cab = Buffer.from(JSON.stringify(indice), "utf8"), tam = Buffer.alloc(4);
tam.writeUInt32LE(cab.length);
const claro = Buffer.concat([tam, cab, ...blocos]);

// Saída: [12 bytes iv][texto cifrado + 16 bytes de etiqueta] — o mesmo formato que o AES-GCM do navegador lê.
const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", chave, iv);
const cifrado = Buffer.concat([iv, c.update(claro), c.final(), c.getAuthTag()]);
mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, cifrado);
console.log(`${arquivos.length} arquivos trancados em assets/vip/amigos.bin (${(cifrado.length / 1024 / 1024).toFixed(1)} MB)`);
