import * as SecureStore from "expo-secure-store";

// export const BASE_URL = 'http://84.247.136.139:3005/api/v1';
export const BASE_URL = "https://api.voltgoapp.com/api/v1";

const ACCESS_TOKEN_KEY = "voltgo_access_token";
const REFRESH_TOKEN_KEY = "voltgo_refresh_token";

// ── Token storage helpers ────────────────────────────────────────────────────
export const tokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setTokens: async (access: string, refresh: string) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh),
    ]);
  },
  clearTokens: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};

// ── API Error ────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Token refresh (POST /token/refresh) ─────────────────────────────────────
// Guard against concurrent refresh calls
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) throw new ApiError(401, "No refresh token available");

    const res = await fetch(`${BASE_URL}/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) throw new ApiError(res.status, "Token refresh failed");

    const newAccess: string = data?.data?.accessToken ?? data?.accessToken;
    const newRefresh: string =
      data?.data?.refreshToken ?? data?.refreshToken ?? refreshToken;

    if (!newAccess)
      throw new ApiError(401, "No access token in refresh response");

    await tokenStorage.setTokens(newAccess, newRefresh);
    return newAccess;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// ── Core request helper ──────────────────────────────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit & { auth?: boolean; _isRetry?: boolean } = {},
): Promise<T> {
  const { auth = false, _isRetry = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (auth) {
    const token = await tokenStorage.getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  // ── Request log ────────────────────────────────────────────────────────────
  const method = fetchOptions.method ?? "GET";
  const requestBody = fetchOptions.body
    ? JSON.parse(fetchOptions.body as string)
    : undefined;
  console.log(
    `\n🌐 API REQUEST ──────────────────────\n` +
      `  ${method} ${BASE_URL}${endpoint}\n` +
      `  Auth: ${auth}${_isRetry ? "  [RETRY]" : ""}\n` +
      (requestBody ? `  Body: ${JSON.stringify(requestBody, null, 2)}\n` : "") +
      `────────────────────────────────────`,
  );

  const t0 = Date.now();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  const ms = Date.now() - t0;

  // ── Response log ───────────────────────────────────────────────────────────
  const icon = res.ok ? "✅" : "❌";
  console.log(
    `\n${icon} API RESPONSE ──────────────────────\n` +
      `  ${method} ${endpoint}\n` +
      `  Status: ${res.status} (${ms}ms)\n` +
      `  Body: ${JSON.stringify(data, null, 2)}\n` +
      `────────────────────────────────────`,
  );

  // ── Auto-refresh on 401 ────────────────────────────────────────────────────
  if (res.status === 401 && auth && !_isRetry) {
    console.log("🔄 401 received — attempting token refresh...");
    try {
      await refreshAccessToken();
      return request<T>(endpoint, { ...options, _isRetry: true });
    } catch {
      await tokenStorage.clearTokens();
      throw new ApiError(401, "Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const message =
      data?.message ?? data?.error ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

// ── Exported HTTP verbs ──────────────────────────────────────────────────────
export const api = {
  get: <T>(endpoint: string, auth = true) =>
    request<T>(endpoint, { method: "GET", auth }),

  post: <T>(endpoint: string, body: unknown, auth = false) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      auth,
    }),

  put: <T>(endpoint: string, body: unknown, auth = true) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      auth,
    }),

  delete: <T>(endpoint: string, auth = true) =>
    request<T>(endpoint, { method: "DELETE", auth }),

  patch: <T>(endpoint: string, body: unknown, auth = true) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      auth,
    }),
};


