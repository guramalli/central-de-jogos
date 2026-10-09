/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🚪 ENTRADA LEVE (v412.5, opção 3 da investigação de travadinhas nas cidades, 09/10/2026 — _teste/viagem_perf).
   O quadro da troca de mapa custava 40–75 ms de código: preparo do chão, prévia, painéis refeitos (6–7 ms), minimapa novo
   (5–7 ms) e bonecos novos dos personagens (5–17 ms: cada um lê a imagem de volta da placa de vídeo). Aqui:
   (1) os painéis da entrada ficam para o quadro seguinte (como já é feito na vitória, desempenho_v410.js §5);
   (2) chegando perto de uma saída (≤14 quadradinhos), nas folgas entre os quadros (requestIdleCallback, ≤3 ms por vez), o
       minimapa do vizinho e os bonecos dos personagens/adversários/figurantes dele já ficam prontos.
   Carregar DEPOIS de desempenho_v410.js (embrulha atualizaPaineis por fora) e antes do medidor.
   ============================================================ */
{
  const est = window.ENL_EST = { adiados: 0, tarefas: 0, msTarefas: 0, vizinhos: [] };
  let entrou = false, adiou = 0;
  const _ent = entrarMapa; entrarMapa = function () { entrou = true; return _ent.apply(this, arguments); };
  const _lp = loop; loop = function () { try { return _lp.apply(this, arguments); } finally { entrou = false; } };
  const _ap = atualizaPaineis; atualizaPaineis = function () { if (entrou && adiou < 3) { adiou++; est.adiados++; G.uiSujo = true; return; } adiou = 0; return _ap.apply(this, arguments); };
  const fila = [], feitos = new Set(); let rodando = false;
  const looks = v => { const l = []; const poe = x => { if (x && (x.tipo === 'humano' || !x.tipo)) l.push(x); };
    try { for (const n of v.npcs || []) poe(NPCS[n.id] && NPCS[n.id].look); for (const sp of v.spawns || []) poe(MONSTROS[sp.m] && MONSTROS[sp.m].look);
      for (const o of v.obj || []) if (o && o.t === 'figurante' && o.meta && o.meta.look) poe(o.meta.look); } catch (e) { }
    const vis = new Set(); return l.filter(x => { let k; try { k = chaveBoneco(x); } catch (e) { return false; } if (vis.has(k)) return false; vis.add(k); return true; }); };
  function anda(dl) {
    const t0 = performance.now();
    while (fila.length && performance.now() - t0 < 3) { const f = fila.shift(); const a = performance.now(); try { f(); } catch (e) { } est.tarefas++; est.msTarefas += performance.now() - a; }
    if (fila.length) requestIdleCallback(anda, { timeout: 1000 }); else rodando = false;
  }
  setInterval(function entVizinhos() {
    try {
      const m = G.mapa; if (!m || !G.p || !G.rodando) return;
      for (const s of m.saidas || []) {
        if (Math.abs(s.x - G.p.x) + Math.abs(s.y - G.p.y) > 14) continue;
        const id = s.para; if (feitos.has(id) || !MAPAS_DEF[id]) continue; feitos.add(id);
        let v; try { v = getMapa(id); } catch (e) { continue; } if (!v || v.interior) continue;
        est.vizinhos.push(id);
        fila.push(() => renderMiniHD(v));
        for (const l of looks(v)) fila.push(() => spriteBoneco(l, 'frente', 0));
        const anda4 = new Set(); try { for (const sp of v.spawns || []) { const l = MONSTROS[sp.m] && MONSTROS[sp.m].look; if (l && (l.tipo === 'humano' || !l.tipo)) anda4.add(l); } } catch (e) { }
        for (const l of anda4) for (const vi of ['frente', 'lado', 'costas']) for (let q = 0; q < 4; q++) if (vi !== 'frente' || q) fila.push(() => spriteBoneco(l, vi, q)); // (adversários andam: 3 vistas x 4 passos)
      }
      if (fila.length && !rodando) { rodando = true; requestIdleCallback(anda, { timeout: 1000 }); }
    } catch (e) { }
  }, 500);
}
