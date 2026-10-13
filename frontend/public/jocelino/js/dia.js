// Jocelino — dia.js — o fim do dia e a manhã seguinte (como no Stardew): dormir na casa do Tio Juca (ou desmaiar às
// 2h, perdendo um pouco de dinheiro), o resumo da noite em páginas, a energia cheia, o dia novo e o save.
// Os sistemas acrescentam linhas ao resumo (NOITE) e o que muda de manhã (MANHA); o quadro de tarefas junta o que
// cada sistema pede (TAREFAS).

const NOITE = [];      // (linhas) antes de virar o dia: cada sistema fecha o seu e escreve no resumo
const MANHA = [];      // () depois de virar o dia
const TAREFAS = [];    // () -> [{texto, feito, meta}] para o quadro de tarefas
let _dormindo = false;

function tarefasQuadro() { const r = []; for (const f of TAREFAS) r.push(...(f() || [])); return r; }

function pedirDormir() {
  // (13/10) Na cama de casa, o Jocelino deita e a tela escurece antes da noite (casa_dentro.js), como no Stardew.
  const vai = () => (typeof deitarNaCama === 'function' && typeof naCasa === 'function' && naCasa() ? deitarNaCama() : dormir());
  if (G.minutos < 18 * 60) {
    perguntar('Ainda é cedo. Dormir até amanhã mesmo assim?', ['Dormir', 'Agora não'], i => { if (i === 0) vai(); });
  } else perguntar('Dormir até amanhã? (o jogo salva)', ['Dormir', 'Agora não'], i => { if (i === 0) vai(); });
  return true;
}

let _acordaEm = null;   // o posto de saúde do Bairro Novo (desmaio)
function dormir(desmaiou = false) {
  if (_dormindo) return;
  _dormindo = true;
  const linhas = [];
  if (desmaiou) {
    const posto = typeof desmaioNoPosto === 'function' ? desmaioNoPosto() : null;
    const perde = posto ? Math.min(G.dinheiro, posto.custo) : Math.max(0, Math.min(100, Math.floor(G.dinheiro / 10)));
    G.dinheiro -= perde;
    linhas.push(posto ? `O Jocelino desmaiou de cansaço às 2h e acordou no posto de saúde do Bairro Novo. A consulta custou Cr$ ${perde}.` : `O Jocelino desmaiou de cansaço às 2h. Acharam ele no meio do caminho e levaram para casa${perde ? `; sumiram Cr$ ${perde} do bolso` : ''}.`);
    _acordaEm = posto;
  }
  for (const f of NOITE) { try { f(linhas); } catch (e) { console.error(e); } }
  if (G.ganhoHoje) linhas.push('Ganhou hoje: Cr$ ' + G.ganhoHoje);
  if (G.gastoHoje) linhas.push('Gastou hoje: Cr$ ' + G.gastoHoje);
  for (const f of G.feitosHoje) linhas.push(f);
  if (!linhas.length) linhas.push('Um dia tranquilo.');
  linhas.push('Dinheiro: Cr$ ' + G.dinheiro);
  // (revisão final) Da conversa da Rosa até a compra, o destino do dinheiro é a entrada da lojinha (uma linha só, no lugar do Bazar e da meta).
  // (dia cheio, Frente A) A mesma regra da barrinha sob o relógio: a meta da família; o Bazar só com o "Juntar para" escolhido.
  const mb = typeof metaDaBarrinha === 'function' ? metaDaBarrinha() : null;
  if (mb) linhas.push(mb.texto);
  // (13/10) O dinheiro tem destino à vista, como no Stardew: a meta da família no fim do dia. (revisão 3: uma linha de meta só — com a
  // da barrinha, só ela; sem a barrinha, a meta da família)
  if (!mb && typeof metaFamilia === 'function') { const mf = metaFamilia(); if (mf) linhas.push(`A meta da família: ${mf.texto}`); }
  const diaQueAcabou = G.dia;
  // Vira o dia.
  relogio.novoDia();
  G.energia = desmaiou && !(typeof Habilidades !== 'undefined' && Habilidades.tem('incansavel')) ? Math.round(G.energiaMax * 0.6) : G.energiaMax;
  if (!desmaiou && typeof CasaFamilia !== 'undefined' && CasaFamilia.tem(5) && G.casa.mudou) G.energia = Math.round(G.energiaMax * ECO.casa.quarto);   // o quarto do casal
  if (typeof afetoFimDoDia === 'function') afetoFimDoDia();   // (o total ganho, com tudo o que entrou na noite)
  G.ganhoHoje = 0; G.gastoHoje = 0; G.feitosHoje = [];
  for (const f of MANHA) { try { f(); } catch (e) { console.error(e); } }
  // Acorda ao lado da cama, dentro de casa (13/10, como no Stardew; casa_dentro.js), ou no posto de saúde depois do desmaio.
  if (_acordaEm) { entrarMapa(_acordaEm.mapa, _acordaEm.tile); _acordaEm = null; }
  else if (typeof acordarEmCasa === 'function') acordarEmCasa();
  else entrarMapa('quintal', typeof CasaFamilia !== 'undefined' && CasaFamilia.mudou() ? CasaFamilia.porta() : { x: 7, y: 10 });
  G.jog.dir = DIR.BAIXO; G.jog.deitado = false;
  salvar();
  _dormindo = false;
  mostrarResumo('Fim do dia ' + ((diaQueAcabou - 1) % 28 + 1), linhas, typeof escolherVantagens === 'function' ? escolherVantagens : null);
}

// Ficou acordado até as 2h: desmaia.
ATUALIZADORES.push(() => { if (G.minutos >= relogio.FIM && !_dormindo) dormir(true); });

// O resumo da noite: um cartão com o céu da noite e as linhas em páginas de 7.
function mostrarResumo(titulo, linhas, depois) {
  const paginas = [];
  for (let i = 0; i < linhas.length; i += 7) paginas.push(linhas.slice(i, i + 7));
  let p = 0;
  const corpo = el('div');
  const caixa = el('div', { class: 'painel', style: 'min-width:min(86vw,640px);padding-top:0' });
  const desenha = () => {
    caixa.innerHTML = '';
    // O céu da noite fica só na faixa do título (no fundo da caixa inteira, ele cobria as linhas quando o resumo crescia).
    caixa.append(el('div', { class: 'titulo', style: 'color:#ffe9a8;font-size:30px;text-align:center;padding:18px 0 22px;margin:0 -22px;border-radius:6px 6px 0 0;background:linear-gradient(#1d2450,#3b2f5c);text-shadow:0 2px 0 #1d2450' }, '☾  ' + titulo));
    caixa.append(el('div', { style: 'font-size:19px;line-height:1.5;padding:10px 6px' }, paginas[p].map(l => el('div', { style: l.startsWith('   ') ? 'padding-left:18px;color:var(--madeira)' : '' }, l.trim()))));
    caixa.append(el('div', { class: 'rodape' }, p < paginas.length - 1 ? `página ${p + 1} de ${paginas.length} — clique para continuar` : 'clique para começar o dia'));
  };
  caixa.onclick = e => { e.stopPropagation(); if (p < paginas.length - 1) { p++; desenha(); } else fecharModal(); };
  caixa._avancar = () => caixa.onclick({ stopPropagation() {} });
  caixa.classList.add('placa');
  desenha();
  abrirModal(caixa, depois);
}
