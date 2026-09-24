// Tempos do Tribunal que a tela, os sons e o juiz 3D precisam dividir
// (arquivo sem three.js: Tribunal.jsx importa daqui sem puxar o 3D).
// Medidos nos arquivos de som (pico do envelope, janelas de 50 ms).

// tribunal-vinheta.mp3 (4,05s): termina com um "toc" de martelo em 3,45s.
export const VINHETA_TOC = 3.45;
// tribunal-ordem.mp3 (6,1s): "Ordem no tribunal!" (0,5–1,6s) + tocs em 1,70s e 1,97s.
export const ORDEM_TOCS = [1.7, 1.97];
// Cena de tela cheia do "Ordem no tribunal!" (segundos).
export const CENA_ORDEM = 2.6;
// Carimbo do caso: na 1ª sessão entra por cima da vinheta (antes do toc
// final); nos outros casos, logo depois da cena de tela cheia.
export const CARIMBO_VINHETA = 0.7;
export const CARIMBO_ORDEM = CENA_ORDEM;
// Gestos "batida" e "condena" do juiz: do início até o martelo bater.
export const IMPACTO = 0.4;
// martelo-uma.mp3 tem o toc em 0,1s: toca 0,3s depois do gesto começar.
export const ATRASO_MARTELO_UMA = IMPACTO - 0.1;
// Veredito: o placar dos votos vai subindo e só então o resultado aparece.
export const REVELAR = 3.2;
// tribunal-suspense.mp3 chega no pico em ~4,6s: começa adiantado pra o pico
// cair na revelação.
export const SUSPENSE_INICIO = 4.6 - REVELAR;
// culpado.mp3 fica forte até ~1,8s; a vaia entra depois.
export const ATRASO_VAIA = 1.8;
// Relógio tiquetaqueando nos últimos segundos das fases com prazo.
export const RELOGIO_ULTIMOS = 10;
