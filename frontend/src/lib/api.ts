const API_BASE = '/api';

export type UserRole = 'OWNER' | 'MANAGER' | 'TRAINER';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

type ApiError = { message: string | string[]; statusCode: number };

function getAccessToken() {
  return localStorage.getItem('accessToken');
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.Authorization = `Bearer ${getAccessToken()}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({
      message: res.statusText,
      statusCode: res.status,
    }));
    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
    throw new Error(msg || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Public API calls (no auth token required)
async function publicApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
    throw new Error(msg || 'Request failed');
  }
  return res.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    publicApi<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    ),
  me: () => api<AuthUser>('/auth/me'),
  forgotPassword: (email: string) =>
    publicApi<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    publicApi<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  updateProfile: (data: Partial<AuthUser>) =>
    api<AuthUser>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ message: string }>('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
