const rawApiBase = process.env.NEXT_PUBLIC_API_BASE;
const API_BASE = (rawApiBase && rawApiBase.length > 0
  ? rawApiBase
  : "http://localhost:8080/api/v1"
).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setAccessToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // Ignore storage errors (private mode, disabled storage).
  }
}

function clearTokens() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Ignore storage errors (private mode, disabled storage).
  }
}

function handleSessionExpired(message: string): never {
  clearTokens();
  if (typeof window !== "undefined") {
    const pathname = window.location?.pathname ?? "";
    if (!pathname.startsWith("/sign-in")) {
      window.location.href = "/sign-in?reason=expired";
    }
  }
  throw new Error(message);
}

export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let data: unknown = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const payload = data as ApiErrorPayload;
    const message =
      payload.error ??
      payload.message ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export async function apiPostAuth<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  return apiRequestAuth<T>("POST", path, body);
}

export async function apiPutAuth<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  return apiRequestAuth<T>("PUT", path, body);
}

export async function apiGetAuth<T>(path: string): Promise<T> {
  return apiRequestAuth<T>("GET", path);
}

export async function apiDeleteAuth<T>(path: string): Promise<T> {
  return apiRequestAuth<T>("DELETE", path);
}

async function apiRequestAuth<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Please sign in to continue.");
  }

  const request = async (activeToken: string) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${activeToken}`,
    };
    if (body) {
      headers["Content-Type"] = "application/json";
    }
    return fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let response = await request(token);
  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    response = await request(refreshedToken);
  }

  let data: unknown = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const payload = data as ApiErrorPayload;
    const message =
      payload.error ??
      payload.message ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return handleSessionExpired("Session expired. Please sign in again.");
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  let data: unknown = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const payload = data as ApiErrorPayload;
    const message =
      payload.error ??
      payload.message ??
      `Request failed with status ${response.status}`;
    return handleSessionExpired(message);
  }

  const accessToken = (data as { access_token?: string }).access_token;
  if (!accessToken) {
    return handleSessionExpired("Session expired. Please sign in again.");
  }

  setAccessToken(accessToken);
  return accessToken;
}
