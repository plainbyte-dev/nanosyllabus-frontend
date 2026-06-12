export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

export function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getStoredBackendToken(sessionToken?: string) {
  if (typeof window === "undefined") return sessionToken;
  return localStorage.getItem("backendAccessToken") ?? sessionToken;
}

export async function apiFetch<T>(
  path: string,
  token: string | undefined,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  const resolvedToken = getStoredBackendToken(token);

  if (resolvedToken) {
    headers.set("Authorization", `Bearer ${resolvedToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
