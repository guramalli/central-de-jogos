/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎞️ LIMITADOR DE FPS (v410.3, dono: "coloque um limitador de fps nas configurações").
   Em monitor de 240/360 Hz o jogo desenhava 360 quadros por segundo: qualquer trabalho extra (uma vitória,
   um efeito) passava do tempo do quadro e a engasgada ficava bem visível. Com um limite (60, 120, 144...)
   sobra folga e o movimento fica constante. Fica em ⚙️ › 🖥️ Vídeo; o padrão é "sem limite" (nada muda).
   Carregar DEPOIS de todos os arquivos que embrulham loop() (chao_novo, desempenho_v408, fps).
   ============================================================ */
const LFPS_OPCOES = [[0, 'No limit'], [60, '60'], [120, '120'], [144, '144'], [165, '165'], [180, '180'], [240, '240']]; // (em monitor de 360 Hz, 60/120/180 dão ritmo perfeito)
let LFPS_MAX = 0;
try { LFPS_MAX = +(localStorage.getItem('rac_fps_max') || 0) || 0; } catch (e) { }
function lfpsMuda(v) { LFPS_MAX = +v || 0; try { localStorage.setItem('rac_fps_max', String(LFPS_MAX)); } catch (e) { } lfpsProx = 0; }
let lfpsProx = 0;
{
  const _loopLf = loop;
  loop = function (ts) {
    if (LFPS_MAX > 0 && ts) {
      const passo = 1000 / LFPS_MAX;
      if (lfpsProx && ts < lfpsProx - 1) { requestAnimationFrame(loop); return; } // ainda não deu a hora: pula este quadro
      lfpsProx = (lfpsProx && ts - lfpsProx < passo) ? lfpsProx + passo : ts + passo; // ritmo constante, sem acumular atraso
    }
    return _loopLf.apply(this, arguments);
  };
}
