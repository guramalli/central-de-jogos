// Dicionário português → inglês, dividido por parte do jogo (cada arquivo cuida de uma parte; chaves repetidas: vale a última).
import ui from './en-ui.js';
import arvore from './en-arvore.js';
import historia from './en-historia.js';
import risco from './en-risco.js';
export const EN = { ...ui, ...arvore, ...historia, ...risco };
