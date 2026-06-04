// ── Users Management Page (Admin) ────────────────────────────────────────────
import { api } from '../api.js';
import { showToast } from '../toast.js';

const ROLE_BADGES = { student: 'badge-success', admin: 'badge-info', donor: 'badge-purple' };
const ROLE_LABELS = { student: 'Estudiante', admin: 'Admin', donor: 'Donante' };

export function renderUsers(container) {
  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Usuarios</h1><p class="page-subtitle">Gestión de usuarios del sistema</p></div>
    </div>
    <div class="filter-bar">
      <div class="filter-group"><label>Rol:</label>
        <select class="form-select" id="filter-role" style="width:150px">
          <option value="">Todos</option><option value="student">Estudiante</option>
          <option value="admin">Admin</option><option value="donor">Donante</option>
        </select>
      </div>
    </div>
    <div id="users-table"></div>
    <div id="modal-container"></div>`;

  document.getElementById('filter-role').addEventListener('change', loadUsers);
  loadUsers();

  async function loadUsers() {
    const params = {};
    const role = document.getElementById('filter-role').value;
    if (role) params.role = role;
    try {
      const users = await api.getUsers(params);
      const el = document.getElementById('users-table');
      if (!users.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">No se encontraron usuarios</div></div>'; return; }
      el.innerHTML = `<div class="table-wrapper"><table class="data-table">
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Retención</th><th>V-Index</th><th>Carga Ac.</th><th>Cumpl.</th><th>Acciones</th></tr></thead>
        <tbody>${users.map(u => {
          const progBar = (val, color) => `<div class="user-progress"><div class="progress-bar"><div class="progress-fill" style="width:${val * 100}%;background:${color}"></div></div><span>${val.toFixed(2)}</span></div>`;
          return `<tr>
            <td style="font-weight:600">${u.full_name}</td>
            <td style="color:var(--text-secondary);font-size:0.8rem">${u.email}</td>
            <td><span class="badge ${ROLE_BADGES[u.role]}">${ROLE_LABELS[u.role]}</span></td>
            <td><span class="status-dot ${u.is_active ? 'active' : 'inactive'}"></span>${u.is_active ? 'Activo' : 'Inactivo'}</td>
            <td>${u.academic_hold ? '<span class="badge badge-danger">⚠ Retención</span>' : '<span class="badge badge-success">✓ Normal</span>'}</td>
            <td>${progBar(u.vulnerability_index, 'var(--accent-blue)')}</td>
            <td>${progBar(u.academic_load, 'var(--accent-purple)')}</td>
            <td>${progBar(u.compliance_history, 'var(--accent-emerald)')}</td>
            <td><button class="btn btn-ghost btn-sm" data-edit="${u.id}">✏️ Editar</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
      el.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
        const user = users.find(u => u.id == b.dataset.edit);
        if (user) showEditModal(user);
      }));
    } catch (e) { showToast(e.message, 'error'); }
  }

  function showEditModal(user) {
    const mc = document.getElementById('modal-container');
    mc.innerHTML = `<div class="modal-overlay active" id="modal-overlay"><div class="modal">
      <div class="modal-header"><span class="modal-title">Editar Usuario</span><button class="modal-close" id="modal-close">✕</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="m-name" value="${user.full_name}" /></div>
        <div class="form-group"><label class="form-label">Índice de Vulnerabilidad</label>
          <div class="slider-inline"><input type="range" class="range-slider" id="m-vi" min="0" max="1" step="0.01" value="${user.vulnerability_index}" /><span class="slider-val" id="val-vi">${user.vulnerability_index.toFixed(2)}</span></div></div>
        <div class="form-group"><label class="form-label">Carga Académica</label>
          <div class="slider-inline"><input type="range" class="range-slider" id="m-al" min="0" max="1" step="0.01" value="${user.academic_load}" /><span class="slider-val" id="val-al">${user.academic_load.toFixed(2)}</span></div></div>
        <div class="form-group"><label class="form-label">Historial de Cumplimiento</label>
          <div class="slider-inline"><input type="range" class="range-slider" id="m-ch" min="0" max="1" step="0.01" value="${user.compliance_history}" /><span class="slider-val" id="val-ch">${user.compliance_history.toFixed(2)}</span></div></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Retención Académica</label>
            <label class="toggle-switch"><input type="checkbox" id="m-hold" ${user.academic_hold ? 'checked' : ''} /><span class="toggle-slider"></span></label></div>
          <div class="form-group"><label class="form-label">Activo</label>
            <label class="toggle-switch"><input type="checkbox" id="m-active" ${user.is_active ? 'checked' : ''} /><span class="toggle-slider"></span></label></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" id="modal-cancel">Cancelar</button><button class="btn btn-primary" id="modal-save">Guardar</button></div>
    </div></div>`;

    ['vi','al','ch'].forEach(k => {
      const s = document.getElementById(`m-${k}`); const d = document.getElementById(`val-${k}`);
      if (s && d) s.addEventListener('input', () => { d.textContent = parseFloat(s.value).toFixed(2); });
    });

    const close = () => { mc.innerHTML = ''; };
    document.getElementById('modal-close').onclick = close;
    document.getElementById('modal-cancel').onclick = close;
    document.getElementById('modal-overlay').onclick = e => { if (e.target.id === 'modal-overlay') close(); };
    document.getElementById('modal-save').onclick = async () => {
      try {
        await api.updateUser(user.id, {
          full_name: document.getElementById('m-name').value,
          vulnerability_index: parseFloat(document.getElementById('m-vi').value),
          academic_load: parseFloat(document.getElementById('m-al').value),
          compliance_history: parseFloat(document.getElementById('m-ch').value),
          academic_hold: document.getElementById('m-hold').checked,
          is_active: document.getElementById('m-active').checked,
        });
        showToast('Usuario actualizado', 'success'); close(); loadUsers();
      } catch (e) { showToast(e.message, 'error'); }
    };
  }
}
