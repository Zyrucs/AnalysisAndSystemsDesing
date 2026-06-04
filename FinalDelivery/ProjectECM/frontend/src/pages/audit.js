// ── Audit Log Page ───────────────────────────────────────────────────────────
import { api } from '../api.js';
import { showToast } from '../toast.js';

const ICONS = {
  LOGIN: '🔑', REGISTER: '👤', CREATE_REQUEST: '📋', APPROVE_REQUEST: '✅',
  DENY_REQUEST: '❌', CREATE_DEVICE: '💻', UPDATE_DEVICE: '✏️', RETIRE_DEVICE: '🗑️',
  SEND_TO_REPAIR: '🔧', RETURN_FROM_REPAIR: '🔄', RETURN_DEVICE: '📦',
  CHECK_OVERDUE: '⚠️', UPDATE_USER: '👥',
};
const LABELS = {
  LOGIN: 'Inicio de Sesión', REGISTER: 'Registro', CREATE_REQUEST: 'Crear Solicitud',
  APPROVE_REQUEST: 'Aprobar Solicitud', DENY_REQUEST: 'Denegar Solicitud',
  CREATE_DEVICE: 'Crear Dispositivo', UPDATE_DEVICE: 'Actualizar Dispositivo',
  RETIRE_DEVICE: 'Retirar Dispositivo', SEND_TO_REPAIR: 'Enviar a Reparación',
  RETURN_FROM_REPAIR: 'Retorno de Reparación', RETURN_DEVICE: 'Devolución de Dispositivo',
  CHECK_OVERDUE: 'Verificar Vencimientos', UPDATE_USER: 'Actualizar Usuario',
};

export function renderAudit(container) {
  const LIMIT = 30;
  let skip = 0;

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Registro de Auditoría</h1>
           <p class="page-subtitle">Historial de acciones del sistema</p></div>
    </div>
    <div class="card">
      <div id="audit-list"><div class="skeleton" style="height:400px"></div></div>
      <div class="pagination" id="pagination"></div>
    </div>`;

  loadLogs();

  async function loadLogs() {
    try {
      const logs = await api.getAuditLog({ skip, limit: LIMIT });
      const el = document.getElementById('audit-list');

      if (!logs.length && skip === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><div class="empty-text">No hay registros de auditoría</div></div>';
        document.getElementById('pagination').innerHTML = '';
        return;
      }

      el.innerHTML = `<div class="audit-list">${logs.map(log => {
        const icon = ICONS[log.action] || '📝';
        const label = LABELS[log.action] || log.action;
        const detail = [log.entity, log.entity_id ? `#${log.entity_id}` : '', log.detail].filter(Boolean).join(' · ');
        const time = log.timestamp ? new Date(log.timestamp).toLocaleString('es-CO') : '';
        return `<div class="audit-entry">
          <div class="audit-icon">${icon}</div>
          <div class="audit-content">
            <div class="audit-action">${label}</div>
            ${detail ? `<div class="audit-detail">${detail}</div>` : ''}
          </div>
          <div class="audit-time">${time}</div>
        </div>`;
      }).join('')}</div>`;

      const page = Math.floor(skip / LIMIT) + 1;
      document.getElementById('pagination').innerHTML = `
        <button class="btn btn-secondary btn-sm" id="pg-prev" ${skip === 0 ? 'disabled' : ''}>← Anterior</button>
        <span class="pagination-info">Página ${page}</span>
        <button class="btn btn-secondary btn-sm" id="pg-next" ${logs.length < LIMIT ? 'disabled' : ''}>Siguiente →</button>`;

      document.getElementById('pg-prev')?.addEventListener('click', () => { skip = Math.max(0, skip - LIMIT); loadLogs(); });
      document.getElementById('pg-next')?.addEventListener('click', () => { skip += LIMIT; loadLogs(); });
    } catch (e) { showToast(e.message, 'error'); }
  }
}
