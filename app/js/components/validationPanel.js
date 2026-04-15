/**
 * validationPanel.js
 * Displays validation issues from the validator service.
 */

import { validateGraph, groupBySeverity } from '../services/validator.js';

let _state = null;

export function initValidationPanel(state) {
  _state = state;
}

export function renderValidation() {
  const container = document.getElementById('validation-content');
  if (!container) return;

  const { fragments, startId } = _state;

  if (fragments.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No fragments to validate</div></div>`;
    updateValidationBadge(0, 0);
    return;
  }

  const issues = validateGraph(fragments, startId);
  const { errors, warnings } = groupBySeverity(issues);

  updateValidationBadge(errors.length, warnings.length);

  if (issues.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <div class="empty-title">All clear!</div>
        <div class="empty-desc">No issues found in your story graph.</div>
      </div>`;
    return;
  }

  const renderSection = (title, items, type, icon) => {
    if (items.length === 0) return '';
    return `
      <div style="margin-bottom:16px">
        <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">${icon} ${title} (${items.length})</div>
        <div class="issue-list">
          ${items.map(issue => `
            <div class="issue-item ${type}">
              <span class="issue-icon">${icon}</span>
              <div class="issue-msg">
                ${escapeHtml(issue.message)}
                ${issue.sourceId ? `<br><small>Source: fragment ${issue.sourceId}</small>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  container.innerHTML =
    renderSection('Errors', errors, 'error', '🚫') +
    renderSection('Warnings', warnings, 'warning', '⚠️');
}

function updateValidationBadge(errors, warnings) {
  const badge = document.getElementById('validation-badge');
  if (!badge) return;
  if (errors > 0) {
    badge.className = 'badge badge-error';
    badge.textContent = `${errors} error${errors !== 1 ? 's' : ''}`;
    badge.style.display = '';
  } else if (warnings > 0) {
    badge.className = 'badge badge-warning';
    badge.textContent = `${warnings} warning${warnings !== 1 ? 's' : ''}`;
    badge.style.display = '';
  } else {
    badge.className = 'badge badge-success';
    badge.textContent = '✓ valid';
    badge.style.display = '';
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
