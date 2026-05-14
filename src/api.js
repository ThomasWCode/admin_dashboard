function getApiUrl() {
  return localStorage.getItem('ruffl_api_url') || 'http://localhost:5000';
}

export function setApiUrl(url) {
  // Auto-prepend https:// if no protocol specified
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  localStorage.setItem('ruffl_api_url', url);
}

async function request(path, options = {}) {
  const token = localStorage.getItem('ruffl_admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
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
