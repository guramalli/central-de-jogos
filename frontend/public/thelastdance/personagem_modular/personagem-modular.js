/*
 * Personagem modular: desenha e anima um personagem feito de peças (cabeça, tronco, braços, pernas)
 * presas a um esqueleto, direto no <canvas>. Roupas são camadas extras presas aos mesmos ossos,
 * então qualquer roupa funciona com qualquer animação sem gerar spritesheet.
 *
 * Uso básico:
 *   const p = new PersonagemModular(window.PERSONAGEM_MODULAR, 'thelastdance/personagem_modular/');
 *   await p.carregar();
 *   p.vestir('jaqueta_couro');
 *   // no loop do jogo:
 *   p.atualizar(dtEmSegundos);
 *   p.desenhar(ctx, xDosPes, yDosPes, 0.25);
 *
 * Vistas: 'frente', 'costas', 'lado_direito', 'lado_esquerdo'
 * Animações: 'andar', 'parado'
 */
(function (global) {
  'use strict';

  // matriz 2D no formato do canvas: [a, b, c, d, e, f]  (x' = a*x + c*y + e ; y' = b*x + d*y + f)
  const ID = [1, 0, 0, 1, 0, 0];
  function mul(m, n) {
    return [
      m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
      m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
    ];
  }

  const cacheImagens = new Map();
  function carregarImagem(url) {
    if (cacheImagens.has(url)) return cacheImagens.get(url);
    const p = new Promise((ok, erro) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => erro(new Error('Não carregou a imagem: ' + url));
      img.src = url;
    });
    cacheImagens.set(url, p);
    return p;
  }

  class PersonagemModular {
    /**
     * @param {object} dados  conteúdo de dados.js (window.PERSONAGEM_MODULAR) ou {rig, animacoes, roupas}
     * @param {string} base   caminho da pasta personagem_modular (termina com /)
     */
    constructor(dados, base = '') {
      this.rig = dados.rig;
      this.animacoes = dados.animacoes;
      this.roupas = Object.assign({}, dados.roupas || {});
      this.base = base;
      this.imagens = {};          // caminho -> HTMLImageElement
      this.vestidas = [];         // ids de roupas, na ordem em que foram vestidas
      this.vista = 'frente';
      this.animacao = 'parado';
      this.tempo = 0;
      this.velocidade = 1;        // multiplica o fps da animação
      this.pixelado = true;       // false = suaviza ao girar as peças
    }

    /** Carrega as imagens do corpo (todas as vistas) e das roupas já registradas. */
    async carregar() {
      const urls = new Set();
      for (const v of Object.values(this.rig.vistas)) for (const c of v.camadas) urls.add(c.img);
      for (const r of Object.values(this.roupas)) this._urlsRoupa(r).forEach((u) => urls.add(u));
      await this._carregarUrls(urls);
      return this;
    }

    /** Registra uma roupa nova (objeto do roupa.json) e carrega as imagens dela. */
    async adicionarRoupa(roupa) {
      this.roupas[roupa.id] = roupa;
      await this._carregarUrls(this._urlsRoupa(roupa));
      return this;
    }

    vestir(id) {
      if (!this.roupas[id]) throw new Error('Roupa não registrada: ' + id);
      if (!this.vestidas.includes(id)) this.vestidas.push(id);
    }
    tirar(id) { this.vestidas = this.vestidas.filter((r) => r !== id); }
    alternar(id) { this.vestidas.includes(id) ? this.tirar(id) : this.vestir(id); return this.vestidas.includes(id); }
    estaVestindo(id) { return this.vestidas.includes(id); }

    definirVista(vista) {
      if (!this.rig.vistas[vista]) throw new Error('Vista inexistente: ' + vista);
      this.vista = vista;
    }

    /** Troca de animação. Por padrão recomeça do quadro 0 só se a animação mudou. */
    tocar(nome, recomecar = false) {
      if (!this.animacoes[nome]) throw new Error('Animação inexistente: ' + nome);
      if (nome !== this.animacao || recomecar) { this.animacao = nome; this.tempo = 0; }
    }

    /** Escolhe a vista a partir de uma direção de movimento (dx, dy). */
    olharPara(dx, dy) {
      if (Math.abs(dx) > Math.abs(dy)) this.definirVista(dx > 0 ? 'lado_direito' : 'lado_esquerdo');
      else if (dy !== 0) this.definirVista(dy > 0 ? 'frente' : 'costas');
    }

    atualizar(dt) { this.tempo += dt * this.velocidade; }

    quadroAtual() {
      const a = this.animacoes[this.animacao];
      const quadros = a.vistas[this.vista];
      const i = Math.floor(this.tempo * a.fps);
      return a.loop ? ((i % quadros.length) + quadros.length) % quadros.length : Math.min(i, quadros.length - 1);
    }

    /**
     * Desenha o personagem com os pés em (x, y) do canvas.
     * escala 1 = 1536 px de altura; 0.25 = 384 px.
     */
    desenhar(ctx, x, y, escala = 0.25) {
      const v = this.rig.vistas[this.vista];
      const quadro = this.animacoes[this.animacao].vistas[this.vista][this.quadroAtual()];
      const pes = this.rig.pes;
      // soma à transformação que o canvas já tem (zoom/câmera do jogo), em vez de substituí-la
      const t = ctx.getTransform();
      const base = mul(mul([t.a, t.b, t.c, t.d, t.e, t.f], [escala, 0, 0, escala, x - pes[0] * escala, y - pes[1] * escala]), v.norm);

      // matriz de mundo de cada osso (pai * local)
      const mundo = {};
      const calcular = (osso) => {
        if (mundo[osso]) return mundo[osso];
        const info = v.ossos[osso];
        const local = quadro[osso] || ID;
        mundo[osso] = info && info.pai ? mul(calcular(info.pai), local) : local;
        return mundo[osso];
      };

      // camadas do corpo + roupas vestidas (roupas podem substituir uma peça, ex.: cabeça por cima da gola)
      const camadas = v.camadas.map((c) => c);
      for (const id of this.vestidas) {
        const rv = this.roupas[id].vistas[this.vista];
        if (!rv) continue;
        if (rv.substituir) {
          for (const [nome, sub] of Object.entries(rv.substituir)) {
            const i = camadas.findIndex((c) => c.nome === nome);
            if (i >= 0) camadas[i] = Object.assign({}, camadas[i], sub);
          }
        }
        for (const c of rv.camadas) camadas.push(c);
      }
      camadas.sort((a, b) => a.z - b.z);

      ctx.save();
      ctx.imageSmoothingEnabled = !this.pixelado;
      for (const c of camadas) {
        const img = this.imagens[c.img];
        if (!img) continue;
        const m = mul(base, calcular(c.osso));
        ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        if (c.w) ctx.drawImage(img, c.x, c.y, c.w, c.h); // peça gravada menor: w/h = tamanho no canvas
        else ctx.drawImage(img, c.x, c.y);
      }
      ctx.restore();
    }

    _urlsRoupa(r) {
      const urls = [];
      for (const rv of Object.values(r.vistas)) {
        rv.camadas.forEach((c) => urls.push(c.img));
        if (rv.substituir) Object.values(rv.substituir).forEach((s) => s.img && urls.push(s.img));
      }
      return urls;
    }
    async _carregarUrls(urls) {
      await Promise.all([...urls].map(async (u) => { this.imagens[u] = await carregarImagem(this.base + u); }));
    }
  }

  global.PersonagemModular = PersonagemModular;
  if (typeof module !== 'undefined' && module.exports) module.exports = PersonagemModular;
})(typeof window !== 'undefined' ? window : globalThis);
