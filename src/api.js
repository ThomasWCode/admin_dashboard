// Production API URL — hardcoded, not configurable at runtime
const API_URL = 'https://backend.ruffl.thomaswhite.me';

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

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    cache: 'no-store',
  });

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
