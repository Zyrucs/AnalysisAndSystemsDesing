// ── ECM Platform — API Client ────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';

/* ── Auth state helpers ──────────────────────────────────────────────────── */
export const getToken        = () => localStorage.getItem('ecm_token');
export const getRole         = () => localStorage.getItem('ecm_role');
export const getUserName     = () => localStorage.getItem('ecm_user_name') || 'Usuario';
export const getUserId       = () => localStorage.getItem('ecm_user_id');
export const isAuthenticated = () => !!getToken();

export function setAuth(token, role) {
  localStorage.setItem('ecm_token', token);
  localStorage.setItem('ecm_role', role);
}

export function clearAuth() {
  localStorage.removeItem('ecm_token');
  localStorage.removeItem('ecm_role');
  localStorage.removeItem('ecm_user_name');
  localStorage.removeItem('ecm_user_id');
}

/* ── Fetch wrapper ───────────────────────────────────────────────────────── */
async function request(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Auto-serialize plain objects to JSON
  if (
    opts.body &&
    typeof opts.body === 'object' &&
    !(opts.body instanceof FormData) &&
    !(opts.body instanceof URLSearchParams)
  ) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.hash = '#/login';
    throw new Error('Sesión expirada');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/* ── Public API ──────────────────────────────────────────────────────────── */
export const api = {
  /* Auth */
  login(email, password) {
    const body = new URLSearchParams({ username: email, password });
    return request('/auth/login', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  register: (data)  => request('/auth/register', { method: 'POST', body: data }),
  me:       ()      => request('/auth/me'),

  /* Devices */
  getDevices:       (p = {})   => request(`/devices/?${new URLSearchParams(p)}`),
  getDevice:        (id)       => request(`/devices/${id}`),
  createDevice:     (data)     => request('/devices/',  { method: 'POST',  body: data }),
  updateDevice:     (id, data) => request(`/devices/${id}`, { method: 'PATCH', body: data }),
  retireDevice:     (id)       => request(`/devices/${id}`, { method: 'DELETE' }),
  sendToRepair:     (id)       => request(`/devices/${id}/send-to-repair`,     { method: 'POST' }),
  returnFromRepair: (id)       => request(`/devices/${id}/return-from-repair`, { method: 'POST' }),

  /* Requests */
  getRequests:   (p = {})   => request(`/requests/?${new URLSearchParams(p)}`),
  getRequest:    (id)       => request(`/requests/${id}`),
  createRequest: (data)     => request('/requests/', { method: 'POST', body: data }),
  reviewRequest: (id, data) => request(`/requests/${id}/review`, { method: 'POST', body: data }),
  returnDevice:  (id, data) => request(`/requests/${id}/return`, { method: 'POST', body: data }),
  checkOverdue:  ()         => request('/requests/check-overdue', { method: 'POST' }),

  /* Dashboard */
  getStats:    ()       => request('/dashboard/stats'),
  getQueue:    ()       => request('/dashboard/queue'),
  getAuditLog: (p = {}) => request(`/dashboard/audit-log?${new URLSearchParams(p)}`),

  /* Scoring */
  previewScore: (data) => request('/scoring/preview', { method: 'POST', body: data }),

  /* Users */
  getUsers:   (p = {})   => request(`/users/?${new URLSearchParams(p)}`),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: data }),
};
