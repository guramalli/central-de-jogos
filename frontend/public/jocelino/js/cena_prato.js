// Jocelino — cena_prato.js — as cenas de prato, como as do Bancho no Dave the Diver (especificação de 14/10:
// docs/superpowers/specs/2026-10-14-cenas-de-prato-design.md; pesquisa: docs/dave_bancho_servico_e_cenas.md, partes 1.3, 3.A e 4).
// No Dave, o prato comum nunca tem cena: o corte de cinema fica para o momento único (o VIP, o prato novo), o jogador só assiste,
// o serviço não anda e a cena já vista dá para pular. Aqui, na entrega de um prato especial ao cliente (o evento 'servido' do
// TurnoJanta), as faixas de cinema descem e a arte pronta do Higgsfield (a/cenas/) toca em camadas: o fundo com zoom lento, o
// personagem entrando, o efeito, o close do prato e a reação. O código só move, aproxima, gira e faz transparência: nada é
// desenhado aqui além das faixas pretas (o corte de tela) e do texto de interface nas faixas.
// Quando toca (no máximo 2 por noite): o prato do VIP que tem cena (sempre: a noite guarda uma vaga para ele); a 1ª venda no jogo
// de uma receita com cena (uma vez só); o prato do tema da festa (uma vez por noite de festa). Nunca o prato comum repetido.
// Durante a cena o jogo fica pausado como num menu (menuAberto): o relógio da janta e a paciência dos clientes não andam.
// window.TESTE_PULA_CENAS (a bateria de testes): a cena é registrada (vista, contador da noite) mas não toca nem pausa.
// As cenas especiais (CENAS_ESPECIAIS, fora da janta: o letreiro do fim da reforma) usam o mesmo motor por tocarEspecial().

// O prato → a cena dele (o prato da casa e as bebidas nunca têm cena).
const CENA_DO_PRATO = {
  pf_peao: 'pf',
  // os pratos de peixe inteiro (o close mostra dois peixes grandes fritos na travessa; o lambari, uma cesta de peixinhos, fica de fora)
  peixe_frito: 'peixe', sardinha_frita: 'peixe', robalo_assado: 'peixe', peixada: 'peixe',
  moqueca: 'moqueca', moqueca_capixaba: 'moqueca', moqueca_prefeito: 'moqueca',
};
const CENA_MAX_NOITE = 2;
const CENA_ESPERA_ARTE = 1.5;   // segundos, no máximo, esperando a arte decodificar antes de a cena andar
const CENA_PALCO = { L: 1920, A: 1080 };   // o quadro virtual da cena (16:9), que cobre a tela inteira
// As escamas do peixe: [direção em radianos (0 = direita, π/2 = baixo), giro até o fim] de cada cópia; o leque vai da esquerda
// um pouco para cima até quase reto para baixo, sem nunca ir para a direita e para cima, onde fica o rosto do Jocelino.
const CENA_ESCAMAS = [[Math.PI * 1.1, -1.4], [Math.PI * 0.92, 1.1], [Math.PI * 0.74, -0.9], [Math.PI * 0.56, 1.3]];

const _cs = (t, a, b) => clamp((t - a) / (b - a), 0, 1);   // o trecho [a, b] do tempo, de 0 a 1
const _eo = u => 1 - Math.pow(1 - u, 3);                   // sai rápido e chega devagar
const _pulo = u => u < 0.6 ? 1.25 * _eo(u / 0.6) : 1.25 - 0.25 * _eo((u - 0.6) / 0.4);   // o pulo de escala do "PLOFT!"

// As 3 cenas. artes: as camadas (a cena espera elas carregarem); sons: [segundo, som, tom, dB] (14/10, a vinheta do Dave: o efeito
// exagerado no momento certo, o "tchan!" no close e a plateia na reação; o zunido de entrada toca quando as faixas descem); legenda: o trecho do close, em que
// o nome do prato aparece na faixa de baixo; desenha(d, t): as camadas no segundo t (d = as ferramentas de desenho, abaixo).
const CENAS_PRATO = {
  // PF do Peão Valente (3,8 s): a Rosa vira a frigideira, o ovo voa girando e cai exato no prato, "PLOFT!"; o peão flexiona o braço.
  pf: { dur: 3.8, legenda: [1.3, 2.75],
    artes: ['cenas/pf_fundo', 'cenas/pf_rosa', 'cenas/pf_ovo', 'cenas/pf_prato', 'cenas/pf_ploft', 'cenas/pf_reacao'],
    sons: [[1.7, 'cena_ploft', 1, -2], [1.95, 'cena_tchan', 1, -6], [2.75, 'cena_plateia', 1.15, -6]],
    desenha(d, t) {
      if (t < 1.45) {   // a cozinha com o fogo alto
        d.fundo('cenas/pf_fundo', 1 + 0.05 * t / 1.45);
        const sobe = 1 - _eo(_cs(t, 0, 0.45));
        d.peca('cenas/pf_rosa', 700, 1080 + sobe * 820, 820, { ancora: 'base', rot: -0.07 * Math.sin(Math.PI * _cs(t, 0.3, 0.7)) });
        if (t >= 0.5) { const u = _cs(t, 0.5, 1.35);   // o ovo sai da frigideira girando, cruza o quadro no ar e sobe para fora dele
          d.peca('cenas/pf_ovo', 600 + 900 * u, 350 - 420 * u - 300 * u * u * u, 200 + 60 * u, { rot: u * 5 * Math.PI }); }
      }
      if (t >= 1.3 && t < 2.9) {   // o close do prato (o zoom fecha em volta do ovo do prato) e o ovo caindo exato em cima dele
        d.fundo('cenas/pf_prato', 1.15 - 0.15 * _eo(_cs(t, 1.3, 1.7)), _cs(t, 1.3, 1.42), 1200, 562);
        if (t < 1.85) { const u = _cs(t, 1.32, 1.7);
          d.peca('cenas/pf_ovo', 1200 + 260 * (1 - u), -320 + 882 * u * u, 534, { rot: (1 - u) * 4 * Math.PI, alfa: 1 - _cs(t, 1.7, 1.85) }); }
        if (t >= 1.7) { d.tremor(16 * (1 - _cs(t, 1.7, 1.86)));
          d.peca('cenas/pf_ploft', 640, 300, 430, { rot: -0.1, esc: _pulo(_cs(t, 1.7, 1.98)), alfa: 1 - _cs(t, 2.55, 2.75) }); }
      }
      if (t >= 2.7) d.fundo('cenas/pf_reacao', 1.08 - 0.08 * _eo(_cs(t, 2.7, 3.8)), _cs(t, 2.7, 2.9), 1300, 500);   // o peão e o prédio subindo
    } },
  // Os pratos de peixe (7,6 s): o Jocelino entra com o peixe, o risco de faca cruza a tela (a homenagem ao Bancho), as escamas voam;
  // o close do peixe na travessa; o mar de Aracaju com o barco à vela.
  peixe: { dur: 7.6, legenda: [2.9, 5.2],
    artes: ['cenas/peixe_fundo', 'cenas/peixe_jocelino', 'cenas/peixe_risco', 'cenas/peixe_escamas', 'cenas/peixe_prato', 'cenas/peixe_reacao'],
    sons: [[1.45, 'cena_faca', 1, -2], [2.95, 'cena_tchan', 1, -4], [5.25, 'cena_plateia', 1, -6]],
    desenha(d, t) {
      if (t < 3.1) {
        d.fundo('cenas/peixe_fundo', 1 + 0.06 * t / 3.1);
        const u = _eo(_cs(t, 0, 0.6));
        d.peca('cenas/peixe_jocelino', 1300 + (1 - u) * 250, 1080 + (1 - u) * 1000 + Math.sin(t * 4) * 6 * u, 1000, { ancora: 'base' });
        if (t >= 1.45 && t < 2.2) { const v = _eo(_cs(t, 1.45, 1.65));   // o risco cruza da ponta de baixo para a de cima
          d.peca('cenas/peixe_risco', 960 - 900 * (1 - v), 540 + 480 * (1 - v), 820, { alfa: 1 - _cs(t, 1.8, 2.2) });
          d.luz(0.35 * (1 - _cs(t, 1.62, 1.8)) * (t >= 1.62 ? 1 : 0)); }
        // as escamas voam do peixe na mão dele: 4 cópias pequenas da peça (240 px, crescendo até 1,3×), cada uma numa direção do
        // leque para a esquerda e para baixo (longe do rosto, perto de (1350, 270)), girando, caindo de leve e sumindo em 0,6 s
        for (let k = 0; k < CENA_ESCAMAS.length; k++) {
          const [ang, gira] = CENA_ESCAMAS[k], v = _cs(t, 1.65 + k * 0.05, 2.25 + k * 0.05);
          if (v <= 0 || v >= 1) continue;
          const r = 380 * _eo(v);
          d.peca('cenas/peixe_escamas', 1075 + Math.cos(ang) * r, 600 + Math.sin(ang) * r + 140 * v * v, 240 * (1 + 0.3 * _eo(v)),
            { rot: k * 0.9 + gira * v, alfa: Math.min(1, v / 0.1) * (1 - _cs(v, 0.4, 1)) });
        }
      }
      // o close do peixe na travessa (a arte já tem o vapor)
      if (t >= 2.9 && t < 5.4) d.fundo('cenas/peixe_prato', 1.2 - 0.2 * _eo(_cs(t, 2.9, 3.9)), _cs(t, 2.9, 3.05), 800, 560);
      if (t >= 5.2) d.fundo('cenas/peixe_reacao', 1.1 - 0.1 * _eo(_cs(t, 5.2, 7.6)), _cs(t, 5.2, 5.4), 1500, 420);
    } },
  // As moquecas (8,2 s): cai o fio de dendê, a nuvem de vapor toma a tela, a moqueca borbulha na panela de barro, o Jocelino leva a
  // panela com um pano; o Seu Orlando discursando no coreto, com fogos.
  moqueca: { dur: 8.2, legenda: [2.5, 5.0],
    artes: ['cenas/moqueca_fundo', 'cenas/moqueca_dende', 'cenas/moqueca_panela', 'cenas/moqueca_vapor', 'cenas/moqueca_jocelino', 'cenas/moqueca_reacao'],
    sons: [[0.35, 'agua', 0.7, -6], [2.6, 'cena_tchan', 1, -4], [2.9, 'cena_borbulha', 1, -6], [6.35, 'cena_plateia', 1, -6]],
    desenha(d, t) {
      if (t < 2.8) {
        d.fundo('cenas/moqueca_fundo', 1 + 0.05 * t / 2.8);
        d.peca('cenas/moqueca_panela', 960, 1120 + (1 - _eo(_cs(t, 0, 0.4))) * 300, 560, { ancora: 'base' });
        if (t < 1.9) d.peca('cenas/moqueca_dende', 920, -600 + 600 * _eo(_cs(t, 0.3, 1.0)), 600, { ancora: 'topo', alfa: 1 - _cs(t, 1.5, 1.9) });
      }
      if (t >= 2.5 && t < 5.1) {   // a panela de perto, borbulhando (a arte da panela já tem os fiapos de vapor)
        d.fundo('cenas/moqueca_fundo', 1.35, 0.5 * _cs(t, 2.5, 2.8), 960, 600);
        d.peca('cenas/moqueca_panela', 960, 600, 880, { esc: 1 + 0.012 * Math.sin(t * 16), alfa: _cs(t, 2.5, 2.8) });
      }
      if (t >= 4.9 && t < 6.5) {   // o Jocelino leva a panela com o pano
        d.fundo('cenas/moqueca_fundo', 1.03, _cs(t, 4.9, 5.05));
        const u = _eo(_cs(t, 4.9, 5.5));
        d.peca('cenas/moqueca_jocelino', 960, 1080 + (1 - u) * 1000 - Math.abs(Math.sin(t * 7)) * 12 * u, 1000, { ancora: 'base', rot: 0.02 * Math.sin(t * 7) });
      }
      if (t >= 6.3) d.fundo('cenas/moqueca_reacao', 1.08 - 0.08 * _eo(_cs(t, 6.3, 8.2)), _cs(t, 6.3, 6.5), 700, 400);
      // a nuvem de vapor (a camada moqueca_vapor) sobe da base da panela, cresce de 0,5 a 1,3 da largura da tela e cobre tudo no
      // corte para o close (2,5 s); a transparência faz 0 → 0,9 → 0 (por cima de tudo, até o close aparecer por trás)
      if (t >= 1.0 && t < 2.7) {
        const esc = 0.5 + 0.8 * _eo(_cs(t, 1.0, 2.5)), img = spr('cenas/moqueca_vapor');
        const h = img ? CENA_PALCO.L * esc * img.naturalHeight / img.naturalWidth : 0;
        d.peca('cenas/moqueca_vapor', 960, 1120, h, { ancora: 'base', alfa: 0.9 * _cs(t, 1.0, 1.6) * (1 - _cs(t, 2.5, 2.7)) });
      }
    } },
};

// As cenas ESPECIAIS (fora da janta, uma vez na história): o mesmo motor, mas tocadas por CenaPrato.tocarEspecial(id, aoAcabar).
// Não entram no limite de 2 por noite nem na conta das cenas de prato da Caderneta (G.cenasVistas): as vistas ficam em
// G.cenasEspeciais. titulo: o texto da faixa de baixo no trecho da legenda (no lugar do nome do prato).
// O letreiro (9,6 s; 14/10, o pedido do jogador: "ele terminando de pintar o letreiro e a Rosa feliz da vida vendo seu sonho
// começar a se realizar"): o fim da última etapa da reforma ('pintura'). A fachada no fim da tarde com o letreiro sem a última
// letra; o Jocelino na escada dá a última pincelada; o letreiro pronto acende com brilho; a Rosa entra com um pulinho, chorando de
// alegria; o close dos dois abraçados no pôr do sol.
// LETREIRO: o centro e a largura da placa pintada na arte do fundo (no quadro de 1920×1080, sem zoom), onde o letreiro pronto
// encaixa por cima (um pouco maior: cobre a placa antiga inteira). LETREIRO_JOC: o pé da escada e a altura da peça do Jocelino,
// que fica ESPELHADA à direita da placa (o braço dele cruza só a ponta dela e a letra que falta; o corpo não tapa o letreiro);
// LETREIRO_PINCEL: a ponta do pincel na peça sem espelho (fração da largura e da altura), onde a última gota de brilho nasce
// e para onde ela aponta: a letra que falta, perto de (1235, 255).
const LETREIRO = { x: 966, y: 244, l: 712 };
const LETREIRO_JOC = { x: 1464, y: 1128, h: 900 };
const LETREIRO_PINCEL = { fx: 0.94, fy: 0.03 };
const LETREIRO_AFASTA = { x: 170, y: 150 };          // o passo do Jocelino depois da última pincelada (fora da placa)
const LETREIRO_ZOOM = { x: 960, y: 330 };                       // o ponto em volta do qual a fachada aproxima devagar
const LETREIRO_CLOSE = { x: 1536, y: 234, l: 340, rot: -0.05 };   // a placa na arte do close da reação
const CENAS_ESPECIAIS = {
  letreiro: { dur: 9.6, legenda: [6.7, 9.3], titulo: 'A Pensão da Rosa está pronta!',
    artes: ['cenas/letreiro_fundo', 'cenas/letreiro_jocelino', 'cenas/letreiro_pronto', 'cenas/letreiro_brilho', 'cenas/letreiro_rosa', 'cenas/letreiro_reacao'],
    sons: [[2.55, 'pousar', 0.8, -8], [3.15, 'cena_tchan', 1, -4], [3.35, 'degrau_fanfarra', 1, -4], [4.75, 'rosa_animada', 1, -4], [6.75, 'fanfarra', 1, -6]],
    desenha(d, t) {
      if (t < 7.0) {
        // a fachada no fim da tarde, aproximando devagar em volta do letreiro; as peças de cima seguem o mesmo zoom (z)
        const zoom = 1 + 0.08 * _eo(_cs(t, 0, 7.0)), F = LETREIRO_ZOOM;
        const z = (x, y) => [F.x + (x - F.x) * zoom, F.y + (y - F.y) * zoom];
        d.fundo('cenas/letreiro_fundo', zoom, 1, F.x, F.y);   // (o fundo tem 16:9: sem zoom ele cobre o quadro exato)
        // o letreiro pronto acende por cima do que está sem a última letra: o clarão, a placa brilhando e um pulso de escala
        if (t >= 3.0) {
          const u = _cs(t, 3.0, 3.3), [lx, ly] = z(LETREIRO.x, LETREIRO.y), img = spr('cenas/letreiro_pronto');
          const h = img ? LETREIRO.l * zoom * img.naturalHeight / img.naturalWidth : 0;
          d.peca('cenas/letreiro_pronto', lx, ly, h, { alfa: u, esc: 1 + 0.06 * Math.sin(Math.PI * _cs(t, 3.1, 3.8)) });
          d.luz(0.55 * (1 - _cs(t, 3.0, 3.55)) * (t >= 3.0 ? 1 : 0));
          // as faíscas de brilho: nas pontas da placa, girando, crescendo e sumindo (uma depois da outra)
          const pontas = [[-0.46, -0.3], [0.47, 0.25], [0.1, -0.42], [-0.3, 0.36], [0.44, -0.32]];
          for (let k = 0; k < pontas.length; k++) {
            const v = _cs(t, 3.1 + k * 0.28, 3.9 + k * 0.28); if (v <= 0 || v >= 1) continue;
            d.peca('cenas/letreiro_brilho', lx + pontas[k][0] * LETREIRO.l * zoom, ly + pontas[k][1] * h, 190 * zoom * Math.sin(Math.PI * v), { rot: v * 2.2 * (k % 2 ? -1 : 1), alfa: Math.sin(Math.PI * v) });
          }
        }
        // o Jocelino na escada (espelhado, à direita da placa): sobe do pé da tela, dá as pinceladas (o balanço do corpo e do braço
        // pelo giro da peça em volta do pé da escada) e a última, mais larga, em 2,3 a 2,9 s; depois fica olhando a obra e sai
        // quando a Rosa já está na tela
        if (t < 6.4) {
          // (no clarão do letreiro acendendo ele desce um degrau e afasta para a direita: o pincel sai de cima do "a" que pintou)
          const ent = _eo(_cs(t, 0, 0.7)), af = _eo(_cs(t, 3.0, 3.3)), jh = LETREIRO_JOC.h * zoom;
          const [jx, jy] = z(LETREIRO_JOC.x + af * LETREIRO_AFASTA.x, LETREIRO_JOC.y + (1 - ent) * 900 + af * LETREIRO_AFASTA.y);
          const pinc = t < 2.3 ? 0.02 * Math.sin(t * 9) * _cs(t, 0.6, 0.9) : 0.07 * Math.sin(Math.PI * _cs(t, 2.3, 2.9)) + 0.004 * Math.sin(t * 3);
          d.peca('cenas/letreiro_jocelino', jx, jy, jh, { ancora: 'base', rot: pinc, espelho: true, alfa: 1 - _cs(t, 6.0, 6.4) });
          // a gota de brilho na ponta do pincel (que gira junto com a peça) na última pincelada
          const v = _cs(t, 2.55, 3.15), img = spr('cenas/letreiro_jocelino');
          if (v > 0 && v < 1 && img) {
            const jw = jh * img.naturalWidth / img.naturalHeight, vx = -(LETREIRO_PINCEL.fx - 0.5) * jw, vy = -jh * (1 - LETREIRO_PINCEL.fy);
            const bx = jx + vx * Math.cos(pinc) - vy * Math.sin(pinc), by = jy + vx * Math.sin(pinc) + vy * Math.cos(pinc);
            d.peca('cenas/letreiro_brilho', bx, by, 200 * zoom * Math.sin(Math.PI * v), { rot: v * 3, alfa: Math.sin(Math.PI * v) });
          }
        }
        // a Rosa entra pela esquerda com um pulinho de alegria (e mais dois pulinhos menores), olhando o letreiro
        if (t >= 4.6) {
          const u = _eo(_cs(t, 4.6, 5.2)), p = _cs(t, 5.2, 6.6);
          const pulo = t < 5.2 ? 0 : Math.abs(Math.sin(Math.PI * p * 3)) * 70 * (1 - p);
          d.peca('cenas/letreiro_rosa', 470 - (1 - u) * 700, 1110 - pulo, 780, { ancora: 'base', rot: 0.03 * Math.sin(t * 6) * (1 - p) });
        }
      }
      // o close da reação: os dois abraçados na frente da pensão, com os filhos, no pôr do sol; a placa lá atrás (que na arte do
      // close saiu sem letras) recebe o mesmo letreiro pronto, pequeno e um pouco inclinado como ela (LETREIRO_CLOSE)
      if (t >= 6.6) {
        const zoom = 1.1 - 0.1 * _eo(_cs(t, 6.6, 9.6)), a = _cs(t, 6.6, 6.9), C = LETREIRO_CLOSE, img = spr('cenas/letreiro_pronto');
        d.fundo('cenas/letreiro_reacao', zoom, a, 960, 420);
        if (img) d.peca('cenas/letreiro_pronto', 960 + (C.x - 960) * zoom, 420 + (C.y - 420) * zoom, C.l * zoom * img.naturalHeight / img.naturalWidth, { rot: C.rot, alfa: a });
      }
    } },
};

// ---------- o estado (no save): as cenas vistas, as receitas que já tiveram a cena da 1ª venda e o contador da noite ----------
INICIADORES.push(s => {
  G.cenasEspeciais = Array.isArray(s.cenasEspeciais) ? s.cenasEspeciais.slice() : [];
  G.cenasVistas = Array.isArray(s.cenasVistas) ? s.cenasVistas.slice() : [];
  G.cenasReceitas = Array.isArray(s.cenasReceitas) ? s.cenasReceitas.slice() : [];
  G.cenasNoite = { n: 0, festa: false, vip: false }; for (const k in G.cenasNoite) if (s.cenasNoite && k in s.cenasNoite) G.cenasNoite[k] = s.cenasNoite[k];   // (onda final: o "dia" de um save antigo, nunca lido, fica de fora)
  CenaPrato.parar();
});
COLETORES.push(s => { s.cenasEspeciais = (G.cenasEspeciais || []).slice(); s.cenasVistas = (G.cenasVistas || []).slice(); s.cenasReceitas = (G.cenasReceitas || []).slice(); s.cenasNoite = Object.assign({}, G.cenasNoite); });

const CenaPrato = {
  _cena: null,     // a cena tocando: { id, def, t, tr, espera, podePular, primeira, prato, aoAcabar, sons }
  _fixo: null,     // (testes) o segundo em que a cena fica parada para a foto
  _ultimo: 0,
  cenaDe(prato) { return CENA_DO_PRATO[prato] || ''; },
  tocando() { return this._cena ? this._cena.id : ''; },
  // A janta nova zera o contador da noite (e já pede a arte das cenas, para a 1ª não esperar).
  _noite(t) {
    if (!t || t._cenaNoite) return;
    t._cenaNoite = true;
    G.cenasNoite = { n: 0, festa: false, vip: false };
    if (!window.TESTE_PULA_CENAS) for (const id in CENAS_PRATO) for (const n of CENAS_PRATO[id].artes) spr(n);
  },
  // Por que este prato entregue toca a cena ('vip', 'primeira', 'festa'), ou '' (o prato comum, ou a noite já teve as dela).
  motivo(t, prato, cliente) {
    if (!CENA_DO_PRATO[prato]) return '';
    const n = G.cenasNoite || { n: 0 };
    if (cliente && cliente.mania === 'vip') return n.n < CENA_MAX_NOITE ? 'vip' : '';
    // o VIP da noite com prato de cena e ainda por servir: a noite guarda uma vaga para ele
    const reserva = t && t.vip && CENA_DO_PRATO[t.vip.prato] && !n.vip && !(t.relatorio && t.relatorio.vip) ? 1 : 0;
    if (n.n >= CENA_MAX_NOITE - reserva) return '';
    if (!(G.cenasReceitas || []).includes(prato)) return 'primeira';
    if (t && t.pratoTema === prato && !n.festa) return 'festa';
    return '';
  },
  // O VIP foi embora sem o prato (cansou de esperar): a vaga guardada para ele volta para as outras cenas da noite.
  soltarVaga(t) { this._noite(t); if (G.cenasNoite) G.cenasNoite.vip = true; },
  // O prato chegou à banqueta (o evento 'servido' do turno): decide, registra e toca. Devolve o id da cena, ou ''.
  // O prato errado (o salão antigo, montado errado) não tem cena.
  aoServir(t, ev) {
    this._noite(t);
    if (this._cena || ev.certo === false) return '';
    const motivo = this.motivo(t, ev.prato, ev.cliente);
    if (!motivo) return '';
    const id = CENA_DO_PRATO[ev.prato], n = G.cenasNoite;
    n.n++;
    if (motivo === 'vip') n.vip = true;
    if (t && t.pratoTema === ev.prato) n.festa = true;
    if (!G.cenasReceitas.includes(ev.prato)) G.cenasReceitas.push(ev.prato);
    if (window.TESTE_PULA_CENAS) { if (!G.cenasVistas.includes(id)) G.cenasVistas.push(id); return id; }
    this.tocar(id, ev.prato);
    return id;
  },
  // Toca a cena: a 1ª vez de cada cena toca inteira; a já vista o clique pula.
  tocar(id, prato) {
    const def = CENAS_PRATO[id];
    if (!def || this._cena) return false;
    const primeira = !G.cenasVistas.length, podePular = G.cenasVistas.includes(id);
    if (!podePular) G.cenasVistas.push(id);
    return this._iniciar(id, def, { podePular, primeira, prato: prato || '' });
  },
  // A cena especial, fora da janta (o letreiro no fim da reforma): CenaPrato.tocarEspecial('letreiro', aoAcabar). Não conta no
  // limite de 2 por noite nem nas cenas de prato; para o relógio como as outras; a 1ª vez toca inteira, a já vista o clique pula.
  // aoAcabar() é chamada sempre uma vez: quando a cena termina (ou é pulada, ou para por erro); na hora, se a cena não pode tocar
  // (outra tocando, id desconhecido) ou com TESTE_PULA_CENAS (a cena fica registrada como vista). Devolve true se tocou.
  tocarEspecial(id, aoAcabar) {
    const def = CENAS_ESPECIAIS[id], fim = () => { if (typeof aoAcabar === 'function') aoAcabar(); };
    if (!Array.isArray(G.cenasEspeciais)) G.cenasEspeciais = [];
    if (!def || this._cena) { fim(); return false; }
    const podePular = G.cenasEspeciais.includes(id);
    if (!podePular) G.cenasEspeciais.push(id);
    if (window.TESTE_PULA_CENAS) { fim(); return false; }
    return this._iniciar(id, def, { podePular, primeira: false, prato: '', aoAcabar: fim });
  },
  _iniciar(id, def, op) {
    for (const n of def.artes) spr(n);
    this._cena = { id, def, t: 0, tr: 0, espera: 0, podePular: op.podePular, primeira: op.primeira, prato: op.prato, aoAcabar: op.aoAcabar || null, sons: def.sons.slice() };
    this._ultimo = performance.now();
    // as faixas descem: o zunido com rufar; a música e o burburinho baixam enquanto a cena toca
    if (typeof sons !== 'undefined') { sons.tocar('cena_entrada', 1, 0.03, -4); sons.abafar(def.dur + 0.5, 0.3); }
    const o = this._overlay();
    o.hidden = false; document.body.classList.add('cena-prato');
    G.teclas.clear(); if (G.mouse) G.mouse.segura = false;
    if (G.jog) G.jog.alvoPalco = null;
    return true;
  },
  // O clique (ou Esc, Espaço, Enter): pula a cena já vista; a de 1ª vez segue inteira.
  pular() {
    const c = this._cena;
    if (!c || !c.podePular) return false;
    this.terminar();
    return true;
  },
  terminar() {
    const c = this._cena;
    if (!c) return;
    this.parar();
    if (typeof sons !== 'undefined' && c.t < c.def.dur - 0.5) sons.abafar(0);   // pulou no meio: a música volta já
    // a primeira cena de todas: a Rosa ensina que dá para pular (a frase no lugar, como toda 1ª vez do jogo)
    if (c.primeira && typeof avisar === 'function') avisar('A Rosa: "Prato especial tem cena: da próxima vez, clique para pular."');
    if (c.aoAcabar) try { c.aoAcabar(); } catch (e) { console.warn('o fim da cena especial deu erro:', e && e.message); }
  },
  parar() {
    this._cena = null; this._fixo = null;
    const o = document.getElementById('cena-prato');
    if (o) o.hidden = true;
    if (document.body && document.body.classList) document.body.classList.remove('cena-prato');
  },
  _overlay() {
    let o = document.getElementById('cena-prato');
    if (o) return o;
    o = el('div', { id: 'cena-prato', hidden: true }, el('canvas'));
    o.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); this.pular(); });
    o.addEventListener('contextmenu', e => e.preventDefault());
    document.body.append(o);
    return o;
  },
  // Um quadro da cena: o relógio próprio (o jogo está pausado), a espera da arte, os sons e as camadas.
  // (um erro no meio da cena nunca deixa o jogo pausado para sempre: a cena termina)
  _quadro() {
    if (!this._cena) return;
    try { this._passo(); }
    catch (e) { console.warn('a cena de prato parou por erro:', e && e.message); this.terminar(); }
  },
  _passo() {
    const c = this._cena;
    const agora = performance.now(), dt = Math.min(0.05, Math.max(0, (agora - this._ultimo) / 1000));
    this._ultimo = agora;
    c.tr += dt;
    const pronta = c.def.artes.every(n => { spr(n); const r = SPR.get(n); return r && (r.pronta || r.erro); });
    if (this._fixo != null) c.t = this._fixo;
    else if (pronta || c.espera >= CENA_ESPERA_ARTE) c.t += dt;
    else c.espera += dt;
    if (this._fixo == null) while (c.sons.length && c.t >= c.sons[0][0]) { const s = c.sons.shift(); if (typeof sons !== 'undefined') sons.tocar(s[1], s[2], 0.03, s[3]); }
    this._desenha(c);
    if (this._fixo == null && c.t >= c.def.dur) this.terminar();
  },
  _desenha(c) {
    const o = this._overlay(), cv = o.firstChild, dpr = window.devicePixelRatio || 1;
    const W = innerWidth, H = innerHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    const fim = c.def.dur, t = c.t;
    // as faixas entram no começo (pelo tempo real: já descem enquanto a arte termina de chegar) e saem no fim
    const entra = _eo(_cs(c.tr, 0, 0.3)), sai = _cs(t, fim - 0.35, fim), vela = entra * (1 - sai);
    // o fundo preto escurece o salão enquanto as faixas descem; depois a cena cobre a tela inteira
    ctx.globalAlpha = vela; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.globalAlpha = 1;
    // o quadro virtual de 1920×1080 cobrindo a tela (cortando o que sobra, nunca esticando)
    const S = Math.max(W / CENA_PALCO.L, H / CENA_PALCO.A), ox = (W - CENA_PALCO.L * S) / 2, oy = (H - CENA_PALCO.A * S) / 2;
    const A = _cs(t, 0, 0.25) * (1 - sai);
    let tremor = 0;
    const base = () => ctx.setTransform(S * dpr, 0, 0, S * dpr, (ox + (tremor ? rnd(-tremor, tremor) * S : 0)) * dpr, (oy + (tremor ? rnd(-tremor, tremor) * S : 0)) * dpr);
    const d = {
      // o fundo opaco 16:9 cobrindo o quadro, com zoom em volta do ponto (fx, fy) do quadro
      fundo(nome, zoom = 1, alfa = 1, fx = 960, fy = 540) {
        const img = spr(nome); if (!img || alfa <= 0) return;
        const k = zoom * Math.max(CENA_PALCO.L / img.naturalWidth, CENA_PALCO.A / img.naturalHeight), w = img.naturalWidth * k, h = img.naturalHeight * k;
        const x0 = (CENA_PALCO.L - img.naturalWidth * k / zoom) / 2, y0 = (CENA_PALCO.A - img.naturalHeight * k / zoom) / 2;
        base(); ctx.globalAlpha = A * alfa;
        ctx.drawImage(img, fx + (x0 - fx) * zoom, fy + (y0 - fy) * zoom, w, h);
      },
      // a peça recortada com altura h no ponto (x, y): ancora 'centro', 'base' (o pé em y) ou 'topo'; giro, escala, transparência e
      // espelho (a peça virada da esquerda para a direita)
      peca(nome, x, y, h, op = {}) {
        const img = spr(nome), alfa = op.alfa == null ? 1 : op.alfa; if (!img || alfa <= 0) return;
        const w = img.naturalWidth * h / img.naturalHeight, ay = op.ancora === 'base' ? -h : op.ancora === 'topo' ? 0 : -h / 2;
        base(); ctx.globalAlpha = A * alfa;
        ctx.translate(x, y); if (op.rot) ctx.rotate(op.rot); if (op.esc && op.esc !== 1) ctx.scale(op.esc, op.esc); if (op.espelho) ctx.scale(-1, 1);
        ctx.drawImage(img, -w / 2, ay, w, h);
      },
      // o clarão discreto do risco de faca
      luz(a) { if (a <= 0) return; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = A * a; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); },
      tremor(px) { tremor = Math.max(0, px); },
    };
    ctx.save(); c.def.desenha(d, t); ctx.restore();
    ctx.globalAlpha = 1;
    // as faixas de cinema (o corte de tela) e o texto delas
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const B = Math.round(H * 0.08), y1 = -B + B * entra * (1 - sai);
    ctx.fillStyle = '#000'; ctx.fillRect(0, y1, W, B); ctx.fillRect(0, H - B - y1, W, B);
    if (typeof texto === 'function') {
      const [l0, l1] = c.def.legenda;
      const nome = c.def.titulo || (c.prato && typeof Pensao !== 'undefined' ? Pensao.prato(c.prato).nome : '');
      if (nome && t >= l0 && t <= l1) { ctx.globalAlpha = Math.min(_cs(t, l0, l0 + 0.25), 1 - _cs(t, l1 - 0.25, l1)); texto(ctx, nome, W / 2, H - B / 2 + 9 - y1, Math.round(clamp(B * 0.42, 16, 34)), '#ffd34d', '900'); }
      if (c.podePular) { ctx.globalAlpha = 0.75 * entra * (1 - sai); texto(ctx, 'Clique para pular', W - 110, H - B / 2 + 7 - y1, 16, '#fff4cf', '800'); }
      ctx.globalAlpha = 1;
    }
  },
};
// Pausa o jogo como um menu aberto (ui.js: menuAberto).
function cenaPratoTocando() { return !!CenaPrato._cena; }
// A cena anda junto com o desenho do jogo (que segue rodando com o jogo pausado).
DESENHOS_TELA.push(() => CenaPrato._quadro());
// A janta nova zera o contador da noite.
ATUALIZADORES.push(() => { if (G.turno) CenaPrato._noite(G.turno); });
// O teclado é da cena enquanto ela toca: Esc, Espaço, Enter, X e E pulam a já vista; nenhuma tecla chega ao jogo.
addEventListener('keydown', e => {
  if (!CenaPrato._cena) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (!e.repeat && ['Escape', 'Space', 'Enter', 'KeyX', 'KeyE'].includes(e.code)) CenaPrato.pular();
}, true);
