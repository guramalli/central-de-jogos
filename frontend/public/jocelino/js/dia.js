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
  if (G.minutos < 18 * 60) {
    perguntar('Ainda é cedo. Dormir até amanhã mesmo assim?', ['Dormir', 'Agora não'], i => { if (i === 0) dormir(); });
  } else perguntar('Dormir até amanhã? (o jogo salva)', ['Dormir', 'Agora não'], i => { if (i === 0) dormir(); });
  return true;
}

function dormir(desmaiou = false) {
  if (_dormindo) return;
  _dormindo = true;
  const linhas = [];
  if (desmaiou) {
    const perde = Math.min(100, Math.floor(G.dinheiro / 10));
    G.dinheiro -= perde;
    linhas.push(`O Jocelino desmaiou de cansaço às 2h. Acharam ele no meio do caminho e levaram para casa${perde ? `; sumiram Cr$ ${perde} do bolso` : ''}.`);
  }
  for (const f of NOITE) { try { f(linhas); } catch (e) { console.error(e); } }
  if (G.ganhoHoje) linhas.push('Ganhou hoje: Cr$ ' + G.ganhoHoje);
  if (G.gastoHoje) linhas.push('Gastou hoje: Cr$ ' + G.gastoHoje);
  for (const f of G.feitosHoje) linhas.push(f);
  if (!linhas.length) linhas.push('Um dia tranquilo.');
  linhas.push('Dinheiro: Cr$ ' + G.dinheiro);
  const diaQueAcabou = G.dia;
  // Vira o dia.
  relogio.novoDia();
  G.energia = desmaiou ? Math.round(G.energiaMax * 0.6) : G.energiaMax;
  G.ganhoHoje = 0; G.gastoHoje = 0; G.feitosHoje = [];
  for (const f of MANHA) { try { f(); } catch (e) { console.error(e); } }
  // Acorda na porta de casa.
  entrarMapa('quintal', { x: 7, y: 10 });
  G.jog.dir = DIR.BAIXO;
  salvar();
  _dormindo = false;
  mostrarResumo('Fim do dia ' + ((diaQueAcabou - 1) % 28 + 1), linhas);
}

// Ficou acordado até as 2h: desmaia.
ATUALIZADORES.push(() => { if (G.minutos >= relogio.FIM && !_dormindo) dormir(true); });

// O resumo da noite: um cartão com o céu da noite e as linhas em páginas de 7.
function mostrarResumo(titulo, linhas) {
  const paginas = [];
  for (let i = 0; i < linhas.length; i += 7) paginas.push(linhas.slice(i, i + 7));
  let p = 0;
  const corpo = el('div');
  const caixa = el('div', { class: 'painel', style: 'min-width:min(86vw,640px);background:linear-gradient(#1d2450,#3b2f5c 45%,var(--papel) 46%);padding-top:0' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'color:#ffe9a8;font-size:30px;text-align:center;padding:18px 0 22px;text-shadow:0 2px 0 #1d2450' }, '☾  ' + titulo));
    caixa.append(el('div', { style: 'font-size:19px;line-height:1.5;padding:10px 6px' }, paginas[p].map(l => el('div', { style: l.startsWith('   ') ? 'padding-left:18px;color:var(--madeira)' : '' }, l.trim()))));
    caixa.append(el('div', { class: 'rodape' }, p < paginas.length - 1 ? `página ${p + 1} de ${paginas.length} — clique para continuar` : 'clique para começar o dia'));
  };
  caixa.onclick = e => { e.stopPropagation(); if (p < paginas.length - 1) { p++; desenha(); } else fecharModal(); };
  caixa._avancar = () => caixa.onclick({ stopPropagation() {} });
  caixa.classList.add('placa');
  desenha();
  abrirModal(caixa);
}
