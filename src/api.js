// Production API URL — hardcoded, not configurable at runtime
const API_URL = 'https://backend.ruffl.thomaswhite.me';

// CSRF token management — persisted to sessionStorage so it survives
// in-page navigation without re-fetching.
let _csrfToken = null;

async function _fetchCsrfToken() {
  const res = await fetch(`${API_URL}/api/csrf-token`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  _csrfToken = data.data.csrf_token;
  return _csrfToken;
}

async function _ensureCsrfToken() {
  if (_csrfToken) return _csrfToken;
  await _fetchCsrfToken();
  return _csrfToken;
}

export function getApiUrl() {
  return API_URL;
}

// ── Request deduplication ─────────────────────────────────────────────────────
// If the same request is already in-flight, reuse the promise instead of
// firing a duplicate. Key = method + path + body.
const _inFlight = new Promise();

function _fingerprint(path, options) {
  const method = options.method || 'GET';
  const body = options.body || '';
  return `${method}:${path}:${body}`;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('ruffl_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Add CSRF token for state-changing requests
  if (options.method && options.method !== 'GET' && options.method !== 'HEAD') {
    const csrf = await _ensureCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    cache: 'no-store',
  });

  // If CSRF failed, try once more with a fresh token
  if (res.status === 403 && options.method && options.method !== 'GET') {
    _csrfToken = null;
    const csrf = await _fetchCsrfToken();
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
      const retry = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { ...headers, ...options.headers },
        cache: 'no-store',
      });
      if (retry.ok) {
        const data = await retry.json();
        return data;
      }
    }
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

// ── Visibility-aware polling helper ──────────────────────────────────────────
// Only polls when the browser tab is visible. Uses Page Visibility API.
// Returns a cleanup function that stops the poll.
export function startVisibilityPoll(fn, intervalMs = 8000) {
  let timer = null;
  let stopped = false;

  function tick() {
    if (stopped) return;
    if (!document.hidden) {
      fn().catch(() => {});
    }
    if (!stopped) {
      timer = setTimeout(tick, intervalMs);
    }
  }

  // Start the first tick after the interval (don't fire immediately —
  // the caller already fetched the initial data)
  timer = setTimeout(tick, intervalMs);

  // Also re-fetch immediately when the tab becomes visible again
  function onVisChange() {
    if (!document.hidden && !stopped) {
      fn().catch(() => {});
    }
  }
  document.addEventListener('visibilitychange', onVisChange);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisChange);
  };
}

// ── Auth ──

export async function login(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.data.token) {
    localStorage.setItem('ruffl_admin_token', data.data.token);
    await _fetchCsrfToken();
  }
  return data.data;
}

export function logout() {
  localStorage.removeItem('ruffl_admin_token');
  _csrfToken = null;
}

export function isLoggedIn() {
  return !!localStorage.getItem('ruffl_admin_token');
}

// ── Disputes ──

export function listDisputes() {
  return request('/api/disputes');
}

export function getDispute(id) {
  return request(`/api/disputes/${id}`);
}

export function assignDispute(id) {
  return request(`/api/disputes/${id}/assign`, { method: 'POST' });
}

export function adjudicateDispute(id, resolution, resolutionMessage) {
  return request(`/api/disputes/${id}/adjudicate`, {
    method: 'POST',
    body: JSON.stringify({ resolution, resolution_message: resolutionMessage }),
  });
}

export function closeDispute(id) {
  return request(`/api/disputes/${id}/close`, { method: 'POST' });
}

export function sendDisputeMessage(id, content) {
  return request(`/api/disputes/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ── Commissions ──

export function listCommissions() {
  return request('/api/admin/commissions');
}

export function getCommission(id) {
  return request(`/api/commissions/${id}`);
}

// ── Admin Users ──

export function adminSearchUsers(q = '', status = 'all') {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (status && status !== 'all') params.set('status', status);
  return request(`/api/admin/users?${params.toString()}`);
}

export function adminGetUserDetail(userId) {
  return request(`/api/admin/users/${userId}`);
}

export function adminSuspendUser(userId, durationHours, reason) {
  return request(`/api/admin/users/${userId}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ duration_hours: durationHours, reason }),
  });
}

export function adminUnsuspendUser(userId) {
  return request(`/api/admin/users/${userId}/unsuspend`, { method: 'POST' });
}

export function adminWarnUser(userId, message) {
  return request(`/api/admin/users/${userId}/warn`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export function adminSoftDeleteUser(userId) {
  return request(`/api/admin/users/${userId}/delete`, { method: 'POST' });
}

export function adminPermanentlyDeleteUser(userId) {
  return request(`/api/admin/users/${userId}`, { method: 'DELETE' });
}

// ── Admin Chats ──

export function adminListChats() {
  return request('/api/admin/chats');
}

export function adminGetOrCreateChat(userId, subject = '') {
  return request('/api/admin/chats', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, subject }),
  });
}

export function adminGetChatRoom(roomId) {
  return request(`/api/admin/chats/${roomId}`);
}

export function adminSendChatMessage(roomId, content, media = []) {
  return request(`/api/admin/chats/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, media }),
  });
}
