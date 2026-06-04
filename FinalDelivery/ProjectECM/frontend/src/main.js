// ── ECM Platform — Entry Point & Router ──────────────────────────────────────
import './styles/index.css';
import './styles/components.css';
import './styles/pages.css';

import { isAuthenticated, getRole, getUserName, clearAuth } from './api.js';
import { renderLogin }     from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderDevices }   from './pages/devices.js';
import { renderRequests }  from './pages/requests.js';
import { renderUsers }     from './pages/users.js';
import { renderScoring }   from './pages/scoring.js';
import { renderAudit }     from './pages/audit.js';

// ── Route definitions ────────────────────────────────────────────────────────
const ROUTES = {
  '/dashboard': { render: renderDashboard, label: 'Dashboard',    icon: '📊', roles: ['admin', 'donor'] },
  '/devices':   { render: renderDevices,   label: 'Dispositivos', icon: '💻', roles: ['admin', 'student', 'donor'] },
  '/requests':  { render: renderRequests,  label: 'Solicitudes',  icon: '📋', roles: ['admin', 'student'] },
  '/users':     { render: renderUsers,     label: 'Usuarios',     icon: '👥', roles: ['admin'] },
  '/scoring':   { render: renderScoring,   label: 'Scoring',      icon: '🧮', roles: ['admin', 'student', 'donor'] },
  '/audit':     { render: renderAudit,     label: 'Auditoría',    icon: '📜', roles: ['admin'] },
};

function defaultRoute(role) {
  return role === 'admin' || role === 'donor' ? '/dashboard' : '/requests';
}

function currentPath() {
  return window.location.hash.slice(1) || '';
}

// ── Shell (sidebar + content area) ───────────────────────────────────────────
function renderShell() {
  const app  = document.getElementById('app');
  const role = getRole();
  const name = getUserName();
  const init = name.charAt(0).toUpperCase();

  const links = Object.entries(ROUTES)
    .filter(([, r]) => r.roles.includes(role))
    .map(([path, r]) => `
      <a href="#${path}" class="sidebar-link" data-path="${path}">
        <span class="sidebar-icon">${r.icon}</span>
        <span class="sidebar-label">${r.label}</span>
      </a>`).join('');

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <img class="logo-img" src="/img/escudo-ud.png" alt="UD" />
            <span class="logo-text">SmartCampus UD</span>
          </div>
          <button class="sidebar-close" id="sidebar-close" aria-label="Cerrar menú">✕</button>
        </div>
        <nav class="sidebar-nav">${links}</nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="user-avatar">${init}</div>
            <div class="user-info">
              <span class="user-name">${name}</span>
              <span class="user-role badge badge-${role === 'admin' ? 'info' : role === 'donor' ? 'purple' : 'success'}">${role}</span>
            </div>
          </div>
          <button class="btn-logout" id="btn-logout">
            <span>🚪</span><span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div class="sidebar-overlay" id="sidebar-overlay"></div>

      <main class="main-content">
        <header class="topbar">
          <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Abrir menú">
            <span></span><span></span><span></span>
          </button>
          <div class="topbar-title" id="topbar-title"></div>
        </header>
        <div id="page-content" class="page-content"></div>
      </main>
    </div>`;

  // ── Sidebar interactions ─────────────────────────────────
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const close   = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };

  document.getElementById('mobile-menu-btn').onclick  = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
  document.getElementById('sidebar-close').onclick    = close;
  overlay.onclick = close;
  document.querySelectorAll('.sidebar-link').forEach(l => l.addEventListener('click', close));

  document.getElementById('btn-logout').onclick = () => {
    clearAuth();
    window.location.hash = '#/login';
  };
}

function setActiveLink(path) {
  document.querySelectorAll('.sidebar-link').forEach(l =>
    l.classList.toggle('active', l.dataset.path === path)
  );
  const title = document.getElementById('topbar-title');
  const route = ROUTES[path];
  if (title && route) title.textContent = route.label;
}

// ── Router ───────────────────────────────────────────────────────────────────
let cleanup = null;

function handleRoute() {
  const path = currentPath();

  /* Not authenticated → login */
  if (!isAuthenticated()) {
    if (path !== '/login') { window.location.hash = '#/login'; return; }
    if (cleanup) { cleanup(); cleanup = null; }
    return renderLogin(document.getElementById('app'));
  }

  /* Authenticated on login or root → redirect */
  if (path === '/login' || path === '') {
    window.location.hash = '#' + defaultRoute(getRole());
    return;
  }

  /* Ensure shell exists */
  if (!document.querySelector('.shell')) renderShell();

  /* Access check */
  const role  = getRole();
  const route = ROUTES[path];
  if (!route || !route.roles.includes(role)) {
    window.location.hash = '#' + defaultRoute(role);
    return;
  }

  setActiveLink(path);

  /* Render page with fade-in */
  const target = document.getElementById('page-content');
  if (cleanup) { cleanup(); cleanup = null; }
  target.classList.remove('fade-in');
  void target.offsetWidth;          // force reflow
  target.classList.add('fade-in');
  cleanup = route.render(target) || null;
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
window.addEventListener('hashchange',    handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute);
