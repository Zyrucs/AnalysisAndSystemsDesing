// ── Toast notification system ────────────────────────────────────────────────
const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);

  // Trigger enter animation on next frame
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
