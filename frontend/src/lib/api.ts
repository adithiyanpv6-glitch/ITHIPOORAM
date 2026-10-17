const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ithipooram_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ithipooram_token', token);
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ithipooram_token');
    localStorage.removeItem('ithipooram_user');
  }
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('ithipooram_user');
  return user ? JSON.parse(user) : null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}
