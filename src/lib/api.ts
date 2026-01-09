const rawApiBase = process.env.NEXT_PUBLIC_API_BASE;
const API_BASE = (rawApiBase && rawApiBase.length > 0
  ? rawApiBase
  : "http://localhost:8080/api/v1"
).replace(/\/$/, "");

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem("access_token");
  } catch {
    return null;
  }
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

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
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
