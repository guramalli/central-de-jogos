export const $ = id => document.getElementById(id);
// troca texto só quando muda (evita relayout a cada 0,2 s)
export const setText = (el, t) => { if (el.textContent !== t) el.textContent = t; };
export const setHTML = (el, h) => { if (el.innerHTML !== h) el.innerHTML = h; };
