// Era "visual" de uma altura: a da altitude, mas nunca abaixo da era mínima da cidade (na Base Lunar a torre já nasce
// com cara de era do Espaço: fachada metálica, blocos e todos de traje). O anúncio de era nova e as regras continuam
// pela altitude de verdade (eraAt).
import { eraAt } from '../data/eras.js';
import { city } from '../sim/prestige.js';

export const eraVis = alt => Math.max(eraAt(alt), city().scene.eraMin || 0);
export const onMoon = () => !!city().scene.moon;
