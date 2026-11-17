import { esc, button, select } from '../orcamentos/client.mjs';
import { AREAS, CASE_STATUS, deadlineState } from './domain.mjs';

export const areaStyle = {
  civil: { short: 'Cíveis', mark: 'CV', description: 'Cobranças, obrigações e ações cíveis' },
  labor: { short: 'Trabalhista', mark: 'TR', description: 'Relações de trabalho e reclamações' },
  tax: { short: 'Execução fiscal', mark: 'EF', description: 'Tributos e cobranças fiscais' },
  legal_admin: { short: 'Administrativo jurídico', mark: 'AJ', description: 'Procedimentos e demandas jurídicas' },
  administrative: { short: 'Administrativo', mark: 'AD', description: 'Assuntos internos e órgãos públicos' },
  contracts: { short: 'Contratos e consultivo', mark: 'CT', description: 'Revisões contratuais e consultas' },
};
const dateLabel = value => value ? value.split('-').reverse().join('/') : '—';
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export function classBadge(label) {
  const text = normalize(label);
  const tone = text.includes('cobranca') ? 'collection' : text.includes('obrigacao') ? 'obligation' : text.includes('adjudica') ? 'adjudication' : text.includes('dano') ? 'damage' : text.includes('embargo') ? 'appeal' : 'general';
  return `<span class="legal-class class-${tone}">${esc(label)}</span>`;
}

function deadlineCell(s, caseId) {
  const tasks = s.tasks.filter(t => t.caseId === caseId && !['done', 'cancelled'].includes(t.status));
  const pending = tasks.filter(t => t.status === 'pending_review');
  const next = tasks.filter(t => t.status === 'open').sort((a,b) => a.dueDate.localeCompare(b.dueDate))[0];
  const state = next && deadlineState(next);
  return `${next ? `<strong class="legal-date ${state === 'Atrasado' ? 'is-late' : ''}">${dateLabel(next.dueDate)}</strong><span class="cell-secondary">${esc(next.title)}</span><span class="legal-status ${state === 'Atrasado' ? 'status-late' : 'status-open'}">${esc(state)}</span>` : '<span class="cell-secondary">Sem prazo conferido</span>'}${pending.length ? `<span class="legal-status status-review">${pending.length} data(s) a conferir</span>` : ''}`;
}

function processRow(s, c) {
  const parent = s.cases.find(p => p.id === c.parentId);
  const children = s.cases.filter(p => p.parentId === c.id);
  const priority = {urgent:'Urgente', high:'Alta prioridade', normal:'Normal'};
  return `<tr>
    <td><button class="case-title" data-action="case-open" data-id="${esc(c.id)}">${esc(c.name)} <span aria-hidden="true">↗</span></button><div class="cell-tags"><span class="legal-status status-${esc(c.status)}">${esc(CASE_STATUS[c.status])}</span>${c.priority !== 'normal' ? `<span class="legal-priority priority-${esc(c.priority)}">${esc(priority[c.priority])}</span>` : ''}</div>${c.notes ? `<p class="case-note" title="${esc(c.notes)}">${esc(c.notes)}</p>` : ''}</td>
    <td><span class="case-number">${esc(c.number || 'Assunto interno')}</span><span class="cell-secondary">${parent ? `Apenso a ${esc(parent.number || parent.name)}` : 'Principal / independente'}</span>${children.length ? `<details class="case-appendices"><summary>${children.length} apenso(s) / relacionado(s)</summary>${children.map(a => `<button class="case-related" data-action="case-open" data-id="${esc(a.id)}">${esc(a.number || a.name)}</button>`).join('')}</details>` : ''}</td>
    <td>${esc(c.property || 'Não informado')}</td>
    <td>${classBadge(c.className)}</td>
    <td><span class="case-owner">${esc(c.owner)}</span></td>
    <td>${deadlineCell(s,c.id)}</td>
  </tr>`;
}

export function overview(s, filters) {
  const active = s.cases.filter(c => c.status === 'active');
  const q = normalize(filters.query);
  const visible = s.cases.filter(c => (!filters.area || c.area === filters.area) && (filters.status === 'all' || c.status === filters.status) && normalize(`${c.name} ${c.number} ${c.property} ${c.className} ${c.owner} ${c.notes}`).includes(q));
  const groups = Object.entries(AREAS).filter(([id]) => visible.some(c => c.area === id));
  const scope = filters.status === 'active' ? 'Processos e assuntos em andamento' : filters.status === 'all' ? 'Todos os processos e assuntos' : `${CASE_STATUS[filters.status]} · processos e assuntos`;
  return `<div class="legal-overview">
    <div class="area-heading"><div><h2>O departamento por área</h2><p>Selecione uma área para filtrar. Os números mostram os registros em andamento.</p></div><button class="btn ${!filters.area ? 'selected-filter' : ''}" data-action="overview-area" data-id="" aria-pressed="${!filters.area}">Todas as áreas · ${active.length}</button></div>
    <div class="legal-areas" aria-label="Filtrar processos por área">${Object.entries(areaStyle).map(([id,a]) => `<button class="area-card area-${id} ${filters.area === id ? 'is-selected' : ''}" data-action="overview-area" data-id="${id}" aria-pressed="${filters.area === id}" title="${a.description}"><span class="area-card-top"><span class="area-mark" aria-hidden="true">${a.mark}</span><strong class="area-count">${active.filter(c => c.area === id).length}</strong></span><span class="area-name">${a.short}</span><span class="area-description">${a.description}</span><span class="area-card-bottom">Em andamento <span aria-hidden="true">↗</span></span></button>`).join('')}</div>
    <section class="legal-register" aria-labelledby="register-title">
      <div class="register-head"><div><p class="eyebrow">ACOMPANHAMENTO DOS PROCESSOS</p><h2 id="register-title">${scope}</h2><p>${visible.length} registro(s) nesta seleção${filters.area ? ` · ${AREAS[filters.area]}` : ' · agrupados por área'}</p></div><div class="actions">${button('overview-clear','Limpar filtros')}</div></div>
      <form id="overview-filters" class="legal-search"><label class="search-field">Buscar processo<input type="search" name="overview-query" value="${esc(filters.query)}" placeholder="Nome, número, imóvel, classe ou responsável"></label>${select('overview-status','Situação',[['active','Em andamento'],['suspended','Suspensos'],['closed','Encerrados'],['all','Todas as situações']],filters.status)}<button class="btn primary" type="submit">Buscar</button></form>
      <div class="legal-groups">${groups.map(([id,label]) => {
        const rows = visible.filter(c => c.area === id);
        return `<section class="process-group area-${id}" aria-label="${esc(label)}"><header class="process-group-head"><div><span class="area-mark" aria-hidden="true">${areaStyle[id].mark}</span><h3>${label}</h3><span class="group-count">${rows.length}</span></div><span class="group-caption">${filters.status === 'active' ? 'Em andamento' : 'Situação conforme filtro'}</span></header><div class="table-wrap"><table class="legal-process-table"><thead><tr><th scope="col">Nome / assunto</th><th scope="col">Processo principal / apensos</th><th scope="col">Imóvel / unidade</th><th scope="col">Classe / tipo</th><th scope="col">Responsável</th><th scope="col">Próxima data conferida</th></tr></thead><tbody>${rows.map(c => processRow(s,c)).join('')}</tbody></table></div></section>`;
      }).join('') || `<div class="legal-no-results"><h3>Nenhum processo nesta seleção</h3><p>Altere a área, a situação ou o texto da busca para ver outros registros.</p>${button('overview-clear','Mostrar todos em andamento')}</div>`}</div>
      <p class="legal-caption">As cores identificam áreas e classes. Prioridade, situação e datas aparecem por escrito. Datas pendentes de conferência não são apresentadas como prazos confirmados.</p>
    </section>
  </div>`;
}
