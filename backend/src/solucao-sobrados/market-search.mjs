const assert = (condition, message) => { if (!condition) throw new Error(message); };
const positiveInteger = (value, label) => {
  assert(Number.isSafeInteger(value) && value > 0, `${label}: informe um número positivo válido.`);
  return value;
};
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function validateDimensions(criteria) {
  assert(object(criteria), 'Critérios de mercado inválidos.');
  assert(criteria.bedrooms === 'all' || (Number.isSafeInteger(criteria.bedrooms) && criteria.bedrooms >= 1 && criteria.bedrooms <= 10), 'Dormitórios: escolha de 1 a 10 ou todos.');
  positiveInteger(criteria.areaMin, 'Área mínima');
  positiveInteger(criteria.areaMax, 'Área máxima');
  assert(criteria.areaMax >= criteria.areaMin, 'A área máxima deve ser maior ou igual à mínima.');
}

// All areas use hundredths of a square metre, matching units and comparables.
// Null/undefined fields restore defaults; explicit filters remain independent
// from the reference unit, whose area is retained for price estimation.
export function resolveMarketCriteria(project, filter = {}) {
  assert(object(project) && Array.isArray(project.units) && project.units.length > 0, 'Selecione um empreendimento com unidades.');
  assert(object(filter), 'Filtros de mercado inválidos.');
  const unit = project.units.find(candidate => candidate.id === filter.unitId) || project.units[0];
  const area = positiveInteger(unit.area, 'Área da unidade');
  const criteria = {
    unitId: unit.id,
    area,
    bedrooms: filter.bedrooms ?? unit.bedrooms ?? project.bedrooms,
    areaMin: filter.areaMin ?? Math.ceil(area * 0.75),
    areaMax: filter.areaMax ?? Math.floor(area * 1.25),
    condition: filter.condition ?? 'new',
    includeUnknownZone: filter.includeUnknownZone ?? false,
  };
  validateDimensions(criteria);
  assert(['new', 'used', 'all'].includes(criteria.condition), 'Condição do imóvel inválida.');
  assert(typeof criteria.includeUnknownZone === 'boolean', 'Filtro de zona inválido.');
  return criteria;
}

export function dimensionExclusions(comparable, criteria) {
  validateDimensions(criteria);
  assert(object(comparable), 'Referência de mercado inválida.');
  const reasons = [];
  if (criteria.bedrooms !== 'all' && comparable.bedrooms !== criteria.bedrooms) reasons.push('outros dormitórios');
  if (!Number.isSafeInteger(comparable.area) || comparable.area < criteria.areaMin || comparable.area > criteria.areaMax) reasons.push('área fora do intervalo');
  return reasons;
}

export function buildMarketSearchUrl(project, criteria) {
  validateDimensions(criteria);
  assert(object(project) && ['individual', 'condominium'].includes(project.type), 'Tipo do imóvel inválido.');
  assert(['new', 'used', 'all'].includes(criteria.condition), 'Condição do imóvel inválida.');
  assert(typeof criteria.includeUnknownZone === 'boolean', 'Filtro de zona inválido.');
  const formatArea = area => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, useGrouping: false }).format(area / 100);
  const zone = !criteria.includeUnknownZone && project.zone !== 'Não informada' ? project.zone : '';
  const terms = [
    project.type === 'condominium' ? 'sobrado em condomínio' : 'sobrado individual',
    criteria.condition === 'new' ? 'novo' : criteria.condition === 'used' ? 'usado' : '',
    criteria.bedrooms === 'all' ? '' : `${criteria.bedrooms} ${criteria.bedrooms === 1 ? 'dormitório' : 'dormitórios'}`,
    project.neighborhood,
    zone,
    'Praia Grande',
    `de ${formatArea(criteria.areaMin)} a ${formatArea(criteria.areaMax)} m²`,
    'venda',
  ].filter(term => typeof term === 'string' && term.trim()).map(term => term.trim());
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', terms.join(' '));
  return url.href;
}
