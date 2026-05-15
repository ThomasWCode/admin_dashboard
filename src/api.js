// Production API URL — hardcoded, not configurable at runtime
const API_URL = 'https://backend.ruffl.thomaswhite.me';

// CSRF token management
let _csrfToken = null;

async function _fetchCsrfToken() {
  const res = await fetch(`${API_URL}/api/csrf-token`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('ruffl_admin_token') || ''}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  _csrfToken = data.data.csrf_token;
  return _csrfToken;
}

async function _ensureCsrfToken() {
  if (!_csrfToken) {
    await _fetchCsrfToken();
  }
  return _csrfToken;
}

export function getApiUrl() {
  return API_URL;
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

// ── Auth ──

export async function login(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.data.token) {
    localStorage.setItem('ruffl_admin_token', data.data.token);
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
