// ── Requests Page ────────────────────────────────────────────────────────────
import { api, getRole } from '../api.js';
import { showToast } from '../toast.js';

const STATUS = {
  pending:  { label: 'Pendiente',  badge: 'badge-warning' },
  approved: { label: 'Aprobada',   badge: 'badge-success' },
  denied:   { label: 'Denegada',   badge: 'badge-danger' },
  returned: { label: 'Devuelta',   badge: 'badge-purple' },
};

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function bandClass(score) { return score >= 0.7 ? 'priority-high' : score >= 0.45 ? 'priority-medium' : 'priority-low'; }

export function renderRequests(container) {
  const role = getRole();
  const isStudent = role === 'student';

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">${isStudent ? 'Mis Solicitudes' : 'Solicitudes'}</h1>
           <p class="page-subtitle">${isStudent ? 'Gestiona tus solicitudes de equipos' : 'Administra todas las solicitudes'}</p></div>
      ${isStudent ? '<div class="page-actions"><button class="btn btn-primary" id="btn-new-req">+ Nueva Solicitud</button></div>' : ''}
    </div>
    ${!isStudent ? `<div class="filter-bar">
      <div class="filter-group"><label>Estado:</label>
        <select class="form-select" id="filter-status" style="width:160px">
          <option value="">Todos</option><option value="pending">Pendiente</option>
          <option value="approved">Aprobada</option><option value="denied">Denegada</option>
          <option value="returned">Devuelta</option>
        </select>
      </div>
    </div>` : ''}
    <div id="req-list"></div>
    <div id="modal-container"></div>`;

  if (isStudent) {
    document.getElementById('btn-new-req')?.addEventListener('click', showCreateModal);
  } else {
    document.getElementById('filter-status')?.addEventListener('change', loadRequests);
  }
  loadRequests();

  async function loadRequests() {
    const params = {};
    if (!isStudent) {
      const st = document.getElementById('filter-status')?.value;
      if (st) params.status = st;
    }
    try {
      const reqs = await api.getRequests(params);
      const el = document.getElementById('req-list');
      if (!reqs.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">No hay solicitudes</div></div>'; return; }

      if (isStudent) {
        el.innerHTML = `<div class="request-cards">${reqs.map(r => {
          const s = STATUS[r.status] || STATUS.pending;
          return `<div class="request-card">
            <div class="request-card-header">
              <span class="badge ${s.badge}">${s.label}</span>
              <span class="${bandClass(r.priority_score || 0)}" style="font-weight:700">${(r.priority_score || 0).toFixed(2)}</span>
            </div>
            <div class="request-card-body">
              <p><strong>Programa:</strong> ${r.academic_program} · Sem. ${r.semester}</p>
              <p><strong>Motivo:</strong> ${r.reason}</p>
              ${r.admin_notes ? `<p><strong>Notas admin:</strong> ${r.admin_notes}</p>` : ''}
            </div>
            <div class="request-dates">
              <span>📅 Solicitado: ${fmtDate(r.requested_at)}</span>
              ${r.approved_at ? `<span>✅ Aprobado: ${fmtDate(r.approved_at)}</span>` : ''}
              ${r.due_date ? `<span>⏰ Vence: ${fmtDate(r.due_date)}</span>` : ''}
              ${r.returned_at ? `<span>📦 Devuelto: ${fmtDate(r.returned_at)}</span>` : ''}
            </div>
          </div>`;
        }).join('')}</div>`;
      } else {
        el.innerHTML = `<div class="table-wrapper"><table class="data-table">
          <thead><tr><th>ID</th><th>Estado</th><th>Puntaje</th><th>Programa</th><th>Sem.</th><th>Fecha</th><th>Acciones</th></tr></thead>
          <tbody>${reqs.map(r => {
            const s = STATUS[r.status] || STATUS.pending;
            let actions = '';
            if (r.status === 'pending') actions = `<button class="btn btn-sm btn-primary" data-review="${r.id}">Revisar</button>`;
            if (r.status === 'approved') actions = `<button class="btn btn-sm btn-secondary" data-return="${r.id}">Devolución</button>`;
            return `<tr>
              <td>#${r.id}</td>
              <td><span class="badge ${s.badge}">${s.label}</span></td>
              <td class="${bandClass(r.priority_score || 0)}" style="font-weight:700">${(r.priority_score || 0).toFixed(2)}</td>
              <td>${r.academic_program}</td><td>${r.semester}</td>
              <td>${fmtDate(r.requested_at)}</td>
              <td class="actions">${actions}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>`;
        el.querySelectorAll('[data-review]').forEach(b => b.addEventListener('click', () => showReviewModal(b.dataset.review)));
        el.querySelectorAll('[data-return]').forEach(b => b.addEventListener('click', () => showReturnModal(b.dataset.return)));
      }
    } catch (e) { showToast(e.message, 'error'); }
  }

  function showCreateModal() {
    openModal('Nueva Solicitud', `
      <div class="form-group"><label class="form-label">Motivo (mín. 10 caracteres)</label><textarea class="form-textarea" id="m-reason" minlength="10" required></textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Programa Académico</label><input class="form-input" id="m-program" required /></div>
        <div class="form-group"><label class="form-label">Semestre</label><input class="form-input" id="m-semester" type="number" min="1" max="12" required /></div>
      </div>
    `, async () => {
      await api.createRequest({ reason: document.getElementById('m-reason').value, academic_program: document.getElementById('m-program').value, semester: parseInt(document.getElementById('m-semester').value) });
      showToast('Solicitud creada', 'success'); loadRequests();
    });
  }

  async function showReviewModal(reqId) {
    let devices = [];
    try { devices = await api.getDevices({ state: 'available' }); } catch (_) {}
    openModal('Revisar Solicitud #' + reqId, `
      <div class="form-group"><label class="form-label">Decisión</label>
        <select class="form-select" id="m-approved"><option value="true">✅ Aprobar</option><option value="false">❌ Denegar</option></select></div>
      <div id="approve-fields">
        <div class="form-group"><label class="form-label">Dispositivo</label>
          <select class="form-select" id="m-device">${devices.map(d => `<option value="${d.id}">${d.name} (${d.serial_number})</option>`).join('')}${!devices.length ? '<option value="">Sin dispositivos disponibles</option>' : ''}</select></div>
        <div class="form-group"><label class="form-label">Días de préstamo</label><input class="form-input" id="m-days" type="number" value="30" min="1" max="90" /></div>
      </div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-textarea" id="m-notes"></textarea></div>
    `, async () => {
      const approved = document.getElementById('m-approved').value === 'true';
      const data = { approved, admin_notes: document.getElementById('m-notes').value || null, loan_days: parseInt(document.getElementById('m-days')?.value || 30) };
      if (approved) data.device_id = parseInt(document.getElementById('m-device').value);
      await api.reviewRequest(reqId, data);
      showToast(approved ? 'Solicitud aprobada' : 'Solicitud denegada', 'success'); loadRequests();
    });
    document.getElementById('m-approved').addEventListener('change', e => {
      document.getElementById('approve-fields').style.display = e.target.value === 'true' ? 'block' : 'none';
    });
  }

  function showReturnModal(reqId) {
    openModal('Registrar Devolución #' + reqId, `
      <div class="form-group"><label class="form-label">Condición del equipo</label>
        <div class="slider-inline"><input type="range" class="range-slider" id="m-cond" min="0" max="1" step="0.01" value="0.8" /><span class="slider-val" id="m-cond-val">0.80</span></div></div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-textarea" id="m-notes"></textarea></div>
    `, async () => {
      await api.returnDevice(reqId, { device_condition: parseFloat(document.getElementById('m-cond').value), notes: document.getElementById('m-notes').value || null });
      showToast('Devolución registrada', 'success'); loadRequests();
    });
    document.getElementById('m-cond').addEventListener('input', e => { document.getElementById('m-cond-val').textContent = parseFloat(e.target.value).toFixed(2); });
  }

  function openModal(title, body, onSave) {
    const mc = document.getElementById('modal-container');
    mc.innerHTML = `<div class="modal-overlay active" id="modal-overlay"><div class="modal">
      <div class="modal-header"><span class="modal-title">${title}</span><button class="modal-close" id="modal-close">✕</button></div>
      <div class="modal-body">${body}</div>
      <div class="modal-footer"><button class="btn btn-secondary" id="modal-cancel">Cancelar</button><button class="btn btn-primary" id="modal-save">Confirmar</button></div>
    </div></div>`;
    const close = () => { mc.innerHTML = ''; };
    document.getElementById('modal-close').onclick = close;
    document.getElementById('modal-cancel').onclick = close;
    document.getElementById('modal-overlay').onclick = e => { if (e.target.id === 'modal-overlay') close(); };
    document.getElementById('modal-save').onclick = async () => { try { await onSave(); close(); } catch (e) { showToast(e.message, 'error'); } };
  }
}
