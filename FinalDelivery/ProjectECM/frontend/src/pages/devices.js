// ── Devices Page ─────────────────────────────────────────────────────────────
import { api, getRole } from '../api.js';
import { showToast } from '../toast.js';

const ICONS  = { laptop: '💻', tablet: '📱', router: '📡' };
const STATES = {
  available: { label: 'Disponible',    badge: 'badge-success' },
  assigned:  { label: 'Asignado',      badge: 'badge-info' },
  in_repair: { label: 'En Reparación', badge: 'badge-warning' },
  overdue:   { label: 'Vencido',       badge: 'badge-danger' },
  retired:   { label: 'Retirado',      badge: 'badge-neutral' },
};

export function renderDevices(container) {
  const role = getRole();
  const isAdmin = role === 'admin';

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Dispositivos</h1><p class="page-subtitle">Inventario de equipos</p></div>
      ${isAdmin ? '<div class="page-actions"><button class="btn btn-primary" id="btn-new-device">+ Nuevo Dispositivo</button></div>' : ''}
    </div>
    <div class="filter-bar">
      <div class="filter-group">
        <label>Estado:</label>
        <select class="form-select" id="filter-state" style="width:160px">
          <option value="">Todos</option>
          <option value="available">Disponible</option><option value="assigned">Asignado</option>
          <option value="in_repair">En Reparación</option><option value="overdue">Vencido</option>
          <option value="retired">Retirado</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Tipo:</label>
        <select class="form-select" id="filter-type" style="width:140px">
          <option value="">Todos</option>
          <option value="laptop">Laptop</option><option value="tablet">Tablet</option><option value="router">Router</option>
        </select>
      </div>
    </div>
    <div id="device-list" class="device-grid">
      ${Array(6).fill('<div class="device-card"><div class="skeleton" style="height:160px"></div></div>').join('')}
    </div>
    <div id="modal-container"></div>`;

  const filterState = document.getElementById('filter-state');
  const filterType  = document.getElementById('filter-type');
  filterState.addEventListener('change', loadDevices);
  filterType.addEventListener('change', loadDevices);

  if (isAdmin) {
    document.getElementById('btn-new-device').addEventListener('click', () => showCreateModal());
  }

  loadDevices();

  async function loadDevices() {
    const params = {};
    if (filterState.value) params.state = filterState.value;
    if (filterType.value)  params.device_type = filterType.value;
    try {
      const devices = await api.getDevices(params);
      const grid = document.getElementById('device-list');
      if (!devices.length) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-text">No se encontraron dispositivos</div></div>';
        return;
      }
      grid.innerHTML = devices.map(d => {
        const s = STATES[d.state] || STATES.available;
        const condPct = Math.round(d.condition * 100);
        const condColor = d.condition > 0.7 ? 'var(--accent-emerald)' : d.condition > 0.3 ? 'var(--accent-amber)' : 'var(--accent-rose)';
        let actions = '';
        if (isAdmin) {
          const btns = [];
          if (d.state !== 'retired') btns.push(`<button class="btn btn-ghost btn-sm" data-edit="${d.id}">✏️</button>`);
          if (d.state === 'available') {
            btns.push(`<button class="btn btn-ghost btn-sm" data-repair="${d.id}" title="Enviar a reparación">🔧</button>`);
            btns.push(`<button class="btn btn-ghost btn-sm" data-retire="${d.id}" title="Retirar">🗑️</button>`);
          }
          if (d.state === 'in_repair') btns.push(`<button class="btn btn-ghost btn-sm" data-return-repair="${d.id}" title="Retornar de reparación">🔄</button>`);
          actions = `<div class="device-actions">${btns.join('')}</div>`;
        }
        return `
          <div class="device-card">
            <div class="device-icon">${ICONS[d.device_type] || '💻'}</div>
            <div class="device-name">${d.name}</div>
            <div class="device-serial">${d.serial_number}</div>
            <div class="device-meta">
              <span class="badge ${s.badge}">${s.label}</span>
              <span class="badge ${d.origin === 'donated' ? 'badge-purple' : 'badge-info'}">${d.origin === 'donated' ? 'Donado' : 'Propio'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-secondary)">
              <span>Condición</span><span style="font-weight:600;color:${condColor}">${condPct}%</span>
            </div>
            <div class="condition-bar"><div class="condition-fill" style="width:${condPct}%;background:${condColor}"></div></div>
            ${actions}
          </div>`;
      }).join('');

      // Bind admin actions
      if (isAdmin) {
        grid.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => showEditModal(devices.find(d => d.id == b.dataset.edit))));
        grid.querySelectorAll('[data-repair]').forEach(b => b.addEventListener('click', async () => { try { await api.sendToRepair(b.dataset.repair); showToast('Enviado a reparación', 'success'); loadDevices(); } catch(e) { showToast(e.message,'error'); } }));
        grid.querySelectorAll('[data-retire]').forEach(b => b.addEventListener('click', async () => { if(confirm('¿Retirar este dispositivo?')) { try { await api.retireDevice(b.dataset.retire); showToast('Dispositivo retirado','success'); loadDevices(); } catch(e) { showToast(e.message,'error'); } } }));
        grid.querySelectorAll('[data-return-repair]').forEach(b => b.addEventListener('click', async () => { try { await api.returnFromRepair(b.dataset.returnRepair); showToast('Retornado de reparación','success'); loadDevices(); } catch(e) { showToast(e.message,'error'); } }));
      }
    } catch (e) { showToast(e.message, 'error'); }
  }

  function showCreateModal() {
    showModal('Nuevo Dispositivo', `
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="m-name" required /></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Tipo</label>
          <select class="form-select" id="m-type"><option value="laptop">Laptop</option><option value="tablet">Tablet</option><option value="router">Router</option></select>
        </div>
        <div class="form-group"><label class="form-label">Origen</label>
          <select class="form-select" id="m-origin"><option value="owned">Propio</option><option value="donated">Donado</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Número de Serie</label><input class="form-input" id="m-serial" required /></div>
      <div class="form-group"><label class="form-label">Condición</label>
        <div class="slider-inline"><input type="range" class="range-slider" id="m-cond" min="0" max="1" step="0.01" value="1" /><span class="slider-val" id="m-cond-val">1.00</span></div>
      </div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-textarea" id="m-notes" rows="2"></textarea></div>
    `, async () => {
      const data = {
        name: document.getElementById('m-name').value,
        device_type: document.getElementById('m-type').value,
        serial_number: document.getElementById('m-serial').value,
        origin: document.getElementById('m-origin').value,
        condition: parseFloat(document.getElementById('m-cond').value),
        notes: document.getElementById('m-notes').value || null,
      };
      await api.createDevice(data);
      showToast('Dispositivo creado', 'success');
      loadDevices();
    });
    document.getElementById('m-cond').addEventListener('input', e => { document.getElementById('m-cond-val').textContent = parseFloat(e.target.value).toFixed(2); });
  }

  function showEditModal(device) {
    showModal('Editar Dispositivo', `
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="m-name" value="${device.name}" /></div>
      <div class="form-group"><label class="form-label">Condición</label>
        <div class="slider-inline"><input type="range" class="range-slider" id="m-cond" min="0" max="1" step="0.01" value="${device.condition}" /><span class="slider-val" id="m-cond-val">${device.condition.toFixed(2)}</span></div>
      </div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-textarea" id="m-notes" rows="2">${device.notes || ''}</textarea></div>
    `, async () => {
      await api.updateDevice(device.id, {
        name: document.getElementById('m-name').value,
        condition: parseFloat(document.getElementById('m-cond').value),
        notes: document.getElementById('m-notes').value || null,
      });
      showToast('Dispositivo actualizado', 'success');
      loadDevices();
    });
    document.getElementById('m-cond').addEventListener('input', e => { document.getElementById('m-cond-val').textContent = parseFloat(e.target.value).toFixed(2); });
  }

  function showModal(title, bodyHTML, onSave) {
    const mc = document.getElementById('modal-container');
    mc.innerHTML = `
      <div class="modal-overlay active" id="modal-overlay">
        <div class="modal">
          <div class="modal-header"><span class="modal-title">${title}</span><button class="modal-close" id="modal-close">✕</button></div>
          <div class="modal-body">${bodyHTML}</div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
            <button class="btn btn-primary" id="modal-save">Guardar</button>
          </div>
        </div>
      </div>`;
    const close = () => { mc.innerHTML = ''; };
    document.getElementById('modal-close').addEventListener('click', close);
    document.getElementById('modal-cancel').addEventListener('click', close);
    document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target.id === 'modal-overlay') close(); });
    document.getElementById('modal-save').addEventListener('click', async () => {
      try { await onSave(); close(); } catch (e) { showToast(e.message, 'error'); }
    });
  }
}
