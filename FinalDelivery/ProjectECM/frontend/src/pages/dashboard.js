// ── Dashboard Page ───────────────────────────────────────────────────────────
import { api, getRole } from '../api.js';
import { showToast } from '../toast.js';

export function renderDashboard(container) {
  const role = getRole();
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Resumen general de la plataforma</p>
      </div>
      ${role === 'admin' ? `<div class="page-actions">
        <button class="btn btn-secondary" id="btn-overdue">⚠️ Verificar Vencimientos</button>
      </div>` : ''}
    </div>
    <div class="stats-grid" id="stats-grid">
      ${Array(9).fill('<div class="stat-card"><div class="skeleton" style="width:48px;height:48px"></div><div class="stat-info"><div class="skeleton" style="width:60px;height:24px;margin-bottom:6px"></div><div class="skeleton" style="width:100px;height:14px"></div></div></div>').join('')}
    </div>
    <div class="dashboard-row mt-3">
      <div class="card" id="recovery-card">
        <div class="card-header"><span class="card-title">Tasa de Recuperación</span></div>
        <div class="recovery-gauge"><div class="skeleton" style="width:130px;height:130px;border-radius:50%"></div></div>
      </div>
      ${role === 'admin' ? `<div class="card" id="queue-card">
        <div class="card-header"><span class="card-title">Cola de Prioridad</span></div>
        <div id="queue-content"><div class="skeleton" style="height:200px"></div></div>
      </div>` : '<div></div>'}
    </div>`;

  loadStats();
  if (role === 'admin') {
    loadQueue();
    const btn = document.getElementById('btn-overdue');
    if (btn) btn.addEventListener('click', async () => {
      try {
        const r = await api.checkOverdue();
        showToast(`${r.count} solicitud(es) vencida(s) detectada(s)`, r.count > 0 ? 'info' : 'success');
        loadStats();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  async function loadStats() {
    try {
      const s = await api.getStats();
      const cards = [
        { v: s.total_devices,      l: 'Total Dispositivos',      c: 'blue',   i: '💻' },
        { v: s.available,          l: 'Disponibles',             c: 'green',  i: '✅' },
        { v: s.assigned,           l: 'Asignados',               c: 'purple', i: '📦' },
        { v: s.in_repair,          l: 'En Reparación',           c: 'amber',  i: '🔧' },
        { v: s.overdue,            l: 'Vencidos',                c: 'rose',   i: '⚠️' },
        { v: s.pending_requests,   l: 'Solicitudes Pendientes',  c: 'amber',  i: '📋' },
        { v: s.approved_requests,  l: 'Solicitudes Aprobadas',   c: 'green',  i: '✓' },
        { v: s.academic_holds,     l: 'Retenciones Académicas',  c: 'rose',   i: '🚫' },
        { v: s.total_students,     l: 'Total Estudiantes',       c: 'blue',   i: '🎓' },
      ];
      document.getElementById('stats-grid').innerHTML = cards.map(c => `
        <div class="stat-card ${c.c}">
          <div class="stat-icon">${c.i}</div>
          <div class="stat-info">
            <div class="stat-value">${c.v}</div>
            <div class="stat-label">${c.l}</div>
          </div>
        </div>`).join('');

      // Recovery gauge
      const pct = s.recovery_rate;
      const color = pct >= 80 ? 'var(--accent-emerald)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)';
      document.getElementById('recovery-card').querySelector('.recovery-gauge, .skeleton')?.parentElement;
      const rc = document.getElementById('recovery-card');
      const gaugeArea = rc.querySelector('.recovery-gauge') || rc.querySelector('.card-body');
      if (rc) {
        const body = rc.querySelector('.recovery-gauge');
        if (body) body.innerHTML = `
          <div class="gauge-ring" style="background: conic-gradient(${color} ${pct * 3.6}deg, var(--bg-tertiary) 0deg);">
            <div class="gauge-value">${pct}%</div>
          </div>
          <div class="gauge-label">Devoluciones a tiempo</div>`;
      }
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function loadQueue() {
    try {
      const q = await api.getQueue();
      const el = document.getElementById('queue-content');
      if (!q.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">No hay solicitudes pendientes</div></div>';
        return;
      }
      el.innerHTML = `<div class="queue-list">${q.map(r => {
        const bc = r.priority_band === 'High' ? 'priority-high' : r.priority_band === 'Medium' ? 'priority-medium' : 'priority-low';
        return `
          <div class="queue-item">
            <div class="queue-info">
              <div class="queue-name">${r.student_name}</div>
              <div class="queue-detail">${r.program} · Sem. ${r.semester}</div>
            </div>
            <div class="queue-score">
              <div class="queue-score-value ${bc}">${(r.priority_score || 0).toFixed(2)}</div>
              <div class="queue-band ${bc}">${r.priority_band === 'High' ? 'Alta' : r.priority_band === 'Medium' ? 'Media' : 'Baja'}</div>
            </div>
          </div>`;
      }).join('')}</div>`;
    } catch (e) { showToast(e.message, 'error'); }
  }
}
