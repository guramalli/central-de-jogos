// Tranca o conteúdo da área com senha em PACOTES separados (cada tela baixa só o que usa), para o site:
// assets/vip/<pacote>.bin = AES-256-GCM dos arquivos daquele pacote. Sem a chave, é ilegível.
// O jogo pede a senha ao servidor (api.educacaogamer.com.br/api/thelastdance/vip), recebe a chave e destranca no navegador
// (js/vip.js diz quais pacotes cada tela abre). As imagens PNG vão como WebP (bem menores; o caminho continua .png).
//
//   node tools/vip_trancar.mjs            → tranca tudo usando a chave de tools/.vip_chave (cria uma nova se não existir)
//
// A chave fica SÓ em tools/.vip_chave (fora do git) e na variável TLD_CHAVE do Render. Trocar a chave obriga a
// trancar de novo e publicar; trocar só a senha (TLD_SENHA no Render) não precisa de nada aqui.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, rmSync } from "node:fs";
import { join, relative, dirname, extname } from "node:path";
import { randomBytes, createCipheriv } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const NPC = (id) => "assets/characters/npcs/" + id;
// Pacotes (pastas ou arquivos). js/vip.js (PACOTES_DA_TELA) usa estes mesmos nomes.
const PACOTES = {
  amigos: ["gustavinho", "vibola", "vini", "juan", "pabo", "elcio", "jamil", "borrinha", "miltinho", "genival", "kaleb", "thiago", "sapata", "dj", "mogli", "cassio"].map(NPC), // rostos reais
  padaria: [NPC("dona_cida"), NPC("garcom_ze")],                                                  // dupla da padaria
  vozes: ["assets/audio/amigos"],                        // vozes gravadas (churrasco, ligação da Mãe, áudio no ZapZap)
  sertanejo: ["assets/audio/local/casa_amigo.mp3"],      // música com dono (jogo fechado por senha)
  tv: ["assets/audio/local/tv.mp3"],                     // som de TV com dono
  cena: ["assets/cena18"],                               // cena do quarto (sem nada explícito, com tarja)
};
const ARQ_CHAVE = join(RAIZ, "tools/.vip_chave");
const PASTA_SAIDA = join(RAIZ, "assets/vip");
const TIPOS = { ".mp3": "audio/mpeg", ".png": "image/png", ".json": "application/json", ".webp": "image/webp", ".jpg": "image/jpeg" };

let chave;
if (existsSync(ARQ_CHAVE)) chave = Buffer.from(readFileSync(ARQ_CHAVE, "utf8").trim(), "hex");
else {
  chave = randomBytes(32);
  writeFileSync(ARQ_CHAVE, chave.toString("hex") + "\n");
  console.log("Chave nova criada em tools/.vip_chave — copie o conteúdo para a variável TLD_CHAVE no Render.");
}
if (chave.length !== 32) throw new Error("tools/.vip_chave precisa ter 64 caracteres hex");

const listar = (alvo) => {
  const p = join(RAIZ, alvo);
  if (!existsSync(p)) { console.log("(sem " + alvo + ", pulando)"); return []; }
  if (!statSync(p).isDirectory()) return [p];
  const out = [];
  const varrer = (d) => { for (const n of readdirSync(d)) { const c = join(d, n); statSync(c).isDirectory() ? varrer(c) : out.push(c); } };
  varrer(p);
  return out.filter((f) => TIPOS[extname(f).toLowerCase()]);
};

// PNG -> WebP (qualidade alta, com transparência), de uma vez só, pelo Python (Pillow)
const TEMP = join(tmpdir(), "vip_webp_" + process.pid);
mkdirSync(TEMP, { recursive: true });
const pngs = Object.values(PACOTES).flat().flatMap(listar).filter((f) => extname(f).toLowerCase() === ".png");
const destinoWebp = (f) => join(TEMP, relative(RAIZ, f).split(/[\\/]/).join("__") + ".webp");
writeFileSync(join(TEMP, "lista.json"), JSON.stringify(pngs.map((f) => [f, destinoWebp(f)])));
execFileSync("python", ["-I", "-c", [
  "import json,sys", "from PIL import Image",
  "for a,b in json.load(open(sys.argv[1],encoding='utf-8')):",
  "    Image.open(a).convert('RGBA').save(b,'WEBP',quality=90,method=6)",
].join("\n"), join(TEMP, "lista.json")]);

mkdirSync(PASTA_SAIDA, { recursive: true });
let total = 0;
for (const [nome, alvos] of Object.entries(PACOTES)) {
  const arquivos = alvos.flatMap(listar).sort();
  // Conteúdo: [4 bytes = tamanho do índice][índice JSON][arquivos colados]. Índice: { arquivos: [{ c, i, n, t }] }
  const blocos = [], indice = { versao: 2, pacote: nome, arquivos: [] };
  let pos = 0;
  for (const a of arquivos) {
    const png = extname(a).toLowerCase() === ".png";
    const dados = readFileSync(png ? destinoWebp(a) : a);
    indice.arquivos.push({ c: relative(RAIZ, a).split("\\").join("/"), i: pos, n: dados.length,
      t: png ? "image/webp" : TIPOS[extname(a).toLowerCase()] });
    blocos.push(dados); pos += dados.length;
  }
  const cab = Buffer.from(JSON.stringify(indice), "utf8"), tam = Buffer.alloc(4);
  tam.writeUInt32LE(cab.length);
  const claro = Buffer.concat([tam, cab, ...blocos]);
  // Saída: [12 bytes iv][texto cifrado + 16 bytes de etiqueta] — o formato que o AES-GCM do navegador lê.
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", chave, iv);
  const cifrado = Buffer.concat([iv, c.update(claro), c.final(), c.getAuthTag()]);
  writeFileSync(join(PASTA_SAIDA, nome + ".bin"), cifrado);
  total += cifrado.length;
  console.log(`${nome}: ${arquivos.length} arquivos, ${(cifrado.length / 1024 / 1024).toFixed(2)} MB`);
}
rmSync(TEMP, { recursive: true, force: true });
// versão nova no js/vip.js: o navegador e o cache do site pegam os pacotes novos na hora
const VIP_JS = join(RAIZ, "js/vip.js");
const versao = Date.now().toString(36);
writeFileSync(VIP_JS, readFileSync(VIP_JS, "utf8").replace(/const VERSAO_PACOTES = "[^"]*";/, `const VERSAO_PACOTES = "${versao}";`));
console.log(`total ${(total / 1024 / 1024).toFixed(1)} MB em ${Object.keys(PACOTES).length} pacotes`);
