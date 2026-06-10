const API_URL = 'https://smart-healthcare-tracker.onrender.com/api';

// 存储token
let authToken: string | null = localStorage.getItem('token');

export function setToken(token: string) {
  authToken = token;
  localStorage.setItem('token', token);
}

export function clearToken() {
  authToken = null;
  localStorage.removeItem('token');
}

export function getToken() {
  return authToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// 认证API
export const authAPI = {
  register: (userData: any) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  login: (email: string, password: string) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  getMe: () => request('/auth/me'),
  updateMe: (userData: any) => request('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
};

// 健康数据API
export const healthAPI = {
  getRecords: (limit?: number) => request(`/health/records${limit ? `?limit=${limit}` : ''}`),
  getRecord: (date: string) => request(`/health/records/${date}`),
  saveRecord: (record: any) => request('/health/records', {
    method: 'POST',
    body: JSON.stringify(record),
  }),
  deleteRecord: (date: string) => request(`/health/records/${date}`, {
    method: 'DELETE',
  }),
};

// 目标API
export const goalsAPI = {
  getAll: () => request('/goals'),
  create: (goal: any) => request('/goals', {
    method: 'POST',
    body: JSON.stringify(goal),
  }),
  update: (id: number, updates: any) => request(`/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  delete: (id: number) => request(`/goals/${id}`, {
    method: 'DELETE',
  }),
};

// 告警API
export const alertsAPI = {
  getAll: () => request('/alerts'),
  create: (alert: any) => request('/alerts', {
    method: 'POST',
    body: JSON.stringify(alert),
  }),
  markAsRead: (id: number) => request(`/alerts/${id}/read`, {
    method: 'PUT',
  }),
  delete: (id: number) => request(`/alerts/${id}`, {
    method: 'DELETE',
  }),
};
