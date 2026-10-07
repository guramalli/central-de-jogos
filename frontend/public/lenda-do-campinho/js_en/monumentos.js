/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏛️ MONUMENTOS (v153): cada cidade do mundo ganha o seu monumento
   famoso (Cristo Redentor, Big Ben, Torre Eiffel...), grande, com uma
   placa de curiosidade na frente (é um jogo da Educação Gamer!).
   - O monumento é um "prédio" sem porta: bloqueia a base e o desenho sobe.
   - O lugar é procurado no mapa JÁ pronto (depois de casas, caçadas, NPCs):
     perto do lugar preferido, sem cobrir ninguém e sem fechar caminho.
   - Paris: chefão com desenho próprio (ch_paris).
   Carregar DEPOIS de todos os arquivos que mexem nos mapas (luxo.js, vale.js...).
   ============================================================ */
// ar = altura/largura do desenho (a/mon_*.webp); w,h = base em quadros; ref = lugar preferido (coordenada de projeto)
const MONUMENTOS = {
  cairo: [{ spr: 'mon_esfinge', w: 7, h: 4, ar: 0.787, ref: [30, 24], nome: 'The Great Sphinx of Giza', txt: 'It has a lion\'s body and a pharaoh\'s head, and it was carved from a single rock about 4,500 years ago!' }],
  toquio: [{ spr: 'mon_toquio', w: 5, h: 3, ar: 2.018, ref: [30, 24], nome: 'Tokyo Tower', txt: 'It\'s 333 meters tall and painted orange and white so airplanes can see it clearly.' }],
  doha: [{ spr: 'mon_doha', w: 7, h: 4, ar: 0.773, ref: [30, 24], nome: 'Museum of Islamic Art', txt: 'It sits on a man-made island and holds works of art more than a thousand years old.' }],
  miami: [{ spr: 'mon_miami', w: 4, h: 3, ar: 1.852, ref: [30, 24], nome: 'Freedom Tower', txt: 'It welcomed thousands of people who arrived in Miami to start a new life.' }],
  lisboa: [{ spr: 'mon_belem', w: 5, h: 4, ar: 1.345, ref: [30, 24], nome: 'Belém Tower', txt: 'It guarded the entrance to Lisbon on the Tagus River. The ships of the Age of Discovery sailed from there!' }],
  madri: [{ spr: 'mon_alcala', w: 7, h: 3, ar: 0.726, ref: [30, 24], nome: 'Puerta de Alcalá', txt: 'It was one of the entrance gates of Madrid and it\'s more than 240 years old.' }],
  milao: [{ spr: 'mon_duomo', w: 7, h: 4, ar: 0.929, ref: [30, 24], nome: 'Milan Cathedral', txt: 'It took almost 600 years to finish and has more than 3,400 statues!' }],
  munique: [{ spr: 'mon_rathaus', w: 6, h: 4, ar: 1.335, ref: [30, 24], nome: 'New Town Hall and the Glockenspiel', txt: 'Every day, little figures on the tower clock dance and spin to the sound of the bells.' }],
  londres: [{ spr: 'mon_bigben', w: 4, h: 3, ar: 1.731, ref: [30, 24], nome: 'Big Ben', txt: 'Big Ben is the name of the giant bell inside the tower: it weighs more than 13 tons!' }],
  paris: [
    { spr: 'mon_eiffel', w: 6, h: 3, ar: 1.682, ref: [44, 24], nome: 'Eiffel Tower', txt: 'It\'s 330 meters tall and was built in 1889. In summer, the heat makes the iron expand and it grows about 15 cm!' },
    { spr: 'mon_arco', w: 6, h: 4, ar: 0.934, ref: [38, 32], nome: 'Arc de Triomphe', txt: 'Twelve avenues leave the square around it, making a star shape.' },
    { spr: 'mon_louvre', w: 8, h: 4, ar: 0.736, ref: [24, 6], nome: 'Louvre Museum', txt: 'The biggest art museum in the world. It\'s where the Mona Lisa lives!' },
    { spr: 'mon_notredame', w: 6, h: 4, ar: 1.343, ref: [28, 31], nome: 'Notre-Dame Cathedral', txt: 'It stands on an island in the middle of the Seine River and has stone gargoyles on the roofs.' },
  ],
  buenos: [{ spr: 'mon_obelisco', w: 4, h: 3, ar: 1.466, ref: [30, 24], nome: 'Obelisk of Buenos Aires', txt: 'It\'s 67 meters tall and stands on 9 de Julio Avenue, one of the widest in the world.' }],
  rio: [
    { spr: 'mon_cristo', w: 6, h: 4, ar: 1.442, ref: [6, 22], nome: 'Christ the Redeemer', txt: 'On top of Corcovado Mountain, it\'s 38 meters tall and one of the New Seven Wonders of the World!' },
    { spr: 'mon_paodeacucar', w: 8, h: 4, ar: 0.852, ref: [30, 30], nome: 'Sugarloaf Mountain', txt: 'The cable car that goes up to the top has been around since 1912, one of the first in the world.' },
  ],
  // v234: Santos
  santos: [
    { spr: 'mon_pele', w: 3, h: 2, ar: 1.689, ref: [24, 32], chao: CH.GRAMA, nome: 'Golden Statue of King Pelé', txt: 'Pelé, the King of Soccer: he scored more than a thousand goals and is the only player to win the World Cup three times (1958, 1962 and 1970). He played almost his whole career right here, at Santos!' },
    { spr: 'mon_museu_pele', w: 7, h: 3, ar: 0.762, ref: [6, 10], nome: 'Pelé Museum', txt: 'It’s in restored historic mansions in the Valongo neighborhood and holds the King’s trophies, photos and jerseys. Talk to the museum guide!' },
    { spr: 'mon_bolsa_cafe', w: 5, h: 3, ar: 1.331, ref: [21, 10], nome: 'Official Coffee Exchange', txt: 'For over a hundred years, Brazil\'s coffee shipped out through the Port of Santos, the biggest in Latin America. Its clock tower is famous!' },
    { spr: 'mon_predios_tortos', w: 5, h: 3, ar: 1.327, ref: [6, 25], nome: 'Leaning Beachfront Buildings', txt: 'Some buildings on the Santos beachfront lean because they were built on soft clay ground. Some lean more than 1 meter out of line at the top!' },
  ],
};
for (const lista of Object.values(MONUMENTOS)) for (const d of lista) {
  if (!ASSET_SET.has(d.spr)) { ASSETS.push(d.spr); ASSET_SET.add(d.spr); }
  // desenho centrado na base e o pé do desenho só um pouquinho abaixo dela
  const W = d.w + 0.5, H = W * d.ar;
  PORTAS[d.spr] = { x: d.w % 2 ? 0.5 : 0.5 + 0.5 / W, y: 1 - 0.3 / H };
  d.alto = Math.max(0, Math.ceil(H * 0.97 - d.h));
}

function poeMonumento(m, d) {
  const { w, h, alto } = d, i = (x, y) => y * m.w + x;
  const dentro = (x, y) => x >= 1 && y >= 1 && x < m.w - 1 && y < m.h - 1;
  // d.limpa (estádios): árvore e enfeite solto não impedem — saem do terreno
  const cid = typeof CIDADES !== 'undefined' && CIDADES.find(k => k.id === m.id);
  const deco = d.limpa ? new Set(['arvore', 'arvore2', 'arbusto', 'pedra', 'flores', 'vaso', 'lixeira2', 'banco', ...(cid ? [...(cid.props || []), ...(cid.arvores || [])] : [])]) : null;
  const solto = k => { const o = m.obj[k]; return !o || (deco && deco.has(o.t) && !o.predio); };
  const livre = (x, y) => dentro(x, y) && solto(i(x, y)) && CH_ANDA(m.chao[i(x, y)]) && m.chao[i(x, y)] !== CH.AGUA;
  // chão mais comum do mapa: o monumento prefere ficar numa praça, não em cima da rua
  const conta = {}; for (const c of m.chao) conta[c] = (conta[c] || 0) + 1;
  const base = d.chao != null ? d.chao : +Object.keys(conta).filter(c => CH_ANDA(+c) && +c !== CH.AGUA).sort((a, b) => conta[b] - conta[a])[0]; // v234: d.chao = chão preferido (a estátua do Rei fica no jardim)
  const dp = typeof dimProjeto === 'function' && dimProjeto(m.id);
  const ref = dp ? { x: escalaCoord(d.ref[0], dp[0], tamNovo(dp[0])), y: escalaCoord(d.ref[1], dp[1], tamNovo(dp[1])) } : { x: m.w >> 1, y: m.h >> 1 };
  const cruza = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const pontosIn = (V, lista) => lista.some(p => p.x >= V[0] && p.x < V[2] && p.y >= V[1] && p.y < V[3]);
  const cands = [];
  for (let estrito = 1; estrito >= 0 && !cands.length; estrito--) {
    for (let y = Math.max(2, alto + 1); y < m.h - h - 3; y++) for (let x = 2; x < m.w - w - 2; x++) {
      let ok = true;
      for (let j = y; j <= y + h && ok; j++) for (let k = x - 1; k <= x + w && ok; k++) if (!livre(k, j) || (estrito && m.chao[i(k, j)] !== base)) ok = false; // estrito: base e a volta toda na praça (não colado na rua)
      if (!ok) continue;
      const V = [x - 1, y - alto, x + w + 1, y + h + 1];
      if (pontosIn(V, m.npcs) || pontosIn(V, m.saidas) || pontosIn(V, m.placas) || pontosIn(V, m.pontos)) continue;
      if (m.campos.some(c => cruza(V, [c.x - 1, c.y - 1, c.x + c.w + 1, c.y + c.h + 1]))) continue;
      if ((m.zonas || []).some(z => cruza(V, [z.x, z.y, z.x + z.w, z.y + z.h]))) continue;
      if (m.predios.some(p => { const f = p.monumento ? 4 : 1; return cruza(V, [p.x - f, p.y - (p.alto || 4), p.x + p.w + f, p.y + p.h + f]); })) continue; // entre dois monumentos, uma praça de folga
      if (m.spawns.some(s => (!d.limpa || s.qtd === 1) && s.x >= V[0] - 1 && s.x < V[2] + 1 && s.y >= V[1] - 1 && s.y < V[3] + 1)) continue; // estádio: só o chefão precisa de espaço (os outros mudam de lugar, veja abaixo)
      cands.push({ x, y, d: Math.hypot(x + w / 2 - ref.x, y + h - ref.y) });
    }
  }
  cands.sort((a, b) => a.d - b.d);
  if (m.lotes && m.lotes[d.spr]) cands.unshift({ x: m.lotes[d.spr].x, y: m.lotes[d.spr].y }); // v272: lote desenhado no mapa (cidades_novas.js)
  const inicio = m.renasce || m.inicio || { x: m.w >> 1, y: m.h >> 1 };
  const antes = alcancaveis(m, inicio), importantes = pontosImportantes(m).filter(pt => antes[pt.y * m.w + pt.x]);
  for (const { x, y } of cands.slice(0, 40)) {
    const pl = { x: x - 1, y: y + h - 1 }, guarda = [];
    const marca = (k, j, o) => { guarda.push([i(k, j), m.obj[i(k, j)]]); m.obj[i(k, j)] = o; };
    if (d.limpa) for (let j = y; j <= y + h; j++) for (let k = x - 1; k <= x + w; k++) if (m.obj[i(k, j)]) marca(k, j, null); // tira as árvores/enfeites do terreno
    for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) marca(k, j, { t: 'x', v: 0, predio: true });
    marca(pl.x, pl.y, { t: 'placa', v: 1 });
    const px = x + Math.floor(w / 2); if (d.interior) m.obj[i(px, y + h - 1)] = null; // prédio com porta (estádio): a porta fica aberta
    const depois = alcancaveis(m, inicio);
    if (importantes.every(pt => depois[pt.y * m.w + pt.x]) && (!d.interior || depois[(y + h) * m.w + px])) {
      m.predios.push({ spr: d.spr, x, y, w, h, porta: { x: px, y: y + h - 1 }, alto, monumento: d.nome, interior: d.interior });
      if (d.interior) { m.saidas.push({ x: px, y: y + h - 1, para: d.interior, porta: true }); if (d.aoPor) d.aoPor({ x: px, y: y + h - 1 }); }
      if (d.limpa) for (const sp of m.spawns) if (sp.x >= x - 2 && sp.x <= x + w + 1 && sp.y >= y - 1 && sp.y <= y + h + 1) { // o grupo que nascia debaixo do estádio vai para a frente dele
        let melhor = null; for (let r = 1; r < 14 && !melhor; r++) for (let dy = -r; dy <= r && !melhor; dy++) for (let dx = -r; dx <= r && !melhor; dx++) { const a = sp.x + dx, b = sp.y + dy; if (Math.max(Math.abs(dx), Math.abs(dy)) === r && !(a >= x - 2 && a <= x + w + 1 && b >= y - 1 && b <= y + h + 2) && livre(a, b) && depois[b * m.w + a]) melhor = { x: a, y: b }; }
        if (melhor) { sp.x = melhor.x; sp.y = melhor.y; }
      }
      m.placas.push({ x: pl.x, y: pl.y, texto: `🏛️ ${d.nome.toUpperCase()} — ${d.txt}` });
      return true;
    }
    for (let g = guarda.length - 1; g >= 0; g--) m.obj[guarda[g][0]] = guarda[g][1]; // fecharia algum caminho: desfaz
  }
  console.warn('monument with no spot:', m.id, d.spr); return false;
}
for (const [id, lista] of Object.entries(MONUMENTOS)) {
  const base = MAPAS_DEF[id]; if (!base) continue;
  MAPAS_DEF[id] = function () { const m = base(); for (const d of lista) try { poeMonumento(m, d); } catch (e) { console.error('monumento', id, e); } return m; };
}

/* ---------- Paris: o chefão com desenho próprio ---------- */
Object.assign(META_BONECOS, { ch_paris: [{"cabeca":[38,40,159,142],"tronco":[82,142,118,205]},{"cabeca":[39,41,159,143],"tronco":[82,143,118,206]},{"cabeca":[41,45,161,145],"tronco":[82,145,118,207]},{"cabeca":[39,41,159,143],"tronco":[82,143,118,206]},{"cabeca":[48,52,158,149],"tronco":[82,149,118,209]},{"cabeca":[48,52,158,149],"tronco":[82,149,118,209]},{"cabeca":[50,52,158,149],"tronco":[82,149,118,209]},{"cabeca":[49,52,158,149],"tronco":[82,149,118,209]},{"cabeca":[42,41,158,143],"tronco":[82,143,118,206]},{"cabeca":[41,48,158,147],"tronco":[82,147,118,208]},{"cabeca":[42,49,158,147],"tronco":[82,147,118,208]},{"cabeca":[41,46,159,145],"tronco":[82,145,118,207]}] });
CORPOS_MODO.ch_paris = 'fixo';
if (typeof FOLHAS !== 'undefined' && !FOLHAS.ch_paris) FOLHAS.ch_paris = folhaSobDemanda('ch_paris', '153'); // v407 (Raio-X A2): baixa só quando aparecer
if (MONSTROS.paris_chefe) { MONSTROS.paris_chefe.look = Object.assign({}, MONSTROS.paris_chefe.look, { folha: 'ch_paris' }); delete MONSTROS.paris_chefe.look._kb; }
