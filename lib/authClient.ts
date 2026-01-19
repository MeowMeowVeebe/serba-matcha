export type AuthUser = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  roles: string[];
};

export type AuthResponse = {
  ok: boolean;
  message?: string;
  user?: AuthUser;
};

type JsonObject = Record<string, unknown>;

type JsonValue = null | boolean | number | string | JsonObject | JsonValue[];

// Fast JSON parsing with streaming support
async function parseJsonSafe(res: Response): Promise<JsonValue> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function getObject(data: JsonValue): JsonObject | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as JsonObject;
}

function getMessage(data: JsonValue): string | undefined {
  const obj = getObject(data);
  const msg = obj?.message;
  return typeof msg === "string" ? msg : undefined;
}

function getUser(data: JsonValue): AuthUser | undefined {
  const obj = getObject(data);
  const user = obj?.user;
  if (!user || typeof user !== "object" || Array.isArray(user)) return undefined;

  const u = user as JsonObject;
  const id = u.id;
  const email = u.email;
  const name = u.name;
  const phone = u.phone;
  const avatar = u.avatar;
  const roles = u.roles;

  if (typeof id !== "string" || typeof email !== "string" || typeof name !== "string") {
    return undefined;
  }

  const rolesArray: string[] = Array.isArray(roles) 
    ? roles.filter((r): r is string => typeof r === "string")
    : [];

  return { 
    id, 
    email, 
    name, 
    phone: typeof phone === "string" ? phone : null,
    avatar: typeof avatar === "string" ? avatar : null,
    roles: rolesArray 
  };
}

// Optimized fetch with keepalive and compression hints
async function postJson<T extends JsonObject>(url: string, body: T): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate, br",
    },
    body: JSON.stringify(body),
    keepalive: true, // Keep connection alive for faster subsequent requests
  });
}

// Request deduplication for concurrent requests
const pendingRequests = new Map<string, Promise<Response>>();

function deduplicatedFetch(url: string, init?: RequestInit): Promise<Response> {
  const key = `${init?.method || "GET"}:${url}`;
  
  // Only deduplicate GET requests
  if (init?.method && init.method !== "GET") {
    return fetch(url, init);
  }
  
  const pending = pendingRequests.get(key);
  if (pending) return pending;
  
  const request = fetch(url, init).finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, request);
  return request;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await postJson("/api/auth/refresh", {});
      return res.ok;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function fetchWithAutoRefresh(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await deduplicatedFetch(input.toString(), init);
  if (res.status !== 401) return res;

  const ok = await refreshSession();
  if (!ok) return res;

  return fetch(input, init);
}

// Enhanced cache with longer TTL and instant access
let userCache: { user: AuthUser; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 60 seconds cache (increased from 30s)

// Preload user data on module load if in browser
if (typeof window !== "undefined") {
  // Prefetch user data after a short delay
  setTimeout(() => {
    me().catch(() => {});
  }, 100);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  // Clear any stale cache before login
  userCache = null;
  
  const res = await postJson("/api/auth/login", { email, password });
  const data = await parseJsonSafe(res);
  const message = getMessage(data);
  const user = getUser(data);

  if (!res.ok) return { ok: false, message: message ?? "Login gagal." };
  
  // Immediately cache user data from login response
  if (user) {
    userCache = { user, timestamp: Date.now() };
  }
  
  return { ok: true, message: message ?? "Login berhasil.", user };
}

export async function register(params: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  const res = await postJson("/api/auth/register", params);
  const data = await parseJsonSafe(res);
  const message = getMessage(data);
  const user = getUser(data);

  if (!res.ok) return { ok: false, message: message ?? "Registrasi gagal." };
  
  // Immediately cache user data from register response
  if (user) {
    userCache = { user, timestamp: Date.now() };
  }
  
  return { ok: true, message: message ?? "Registrasi berhasil.", user };
}

export async function me(forceRefresh = false): Promise<{ ok: true; user: AuthUser } | { ok: false }> {
  // Return cached data immediately if valid
  if (!forceRefresh && userCache && Date.now() - userCache.timestamp < CACHE_TTL) {
    return { ok: true, user: userCache.user };
  }

  const res = await fetchWithAutoRefresh("/api/auth/me", { 
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate, br",
    },
  });
  
  if (!res.ok) {
    userCache = null;
    return { ok: false };
  }

  const data = await parseJsonSafe(res);
  const user = getUser(data);
  if (!user) {
    userCache = null;
    return { ok: false };
  }

  userCache = { user, timestamp: Date.now() };
  return { ok: true, user };
}

// Get cached user synchronously (for immediate UI rendering)
export function getCachedUser(): AuthUser | null {
  if (userCache && Date.now() - userCache.timestamp < CACHE_TTL) {
    return userCache.user;
  }
  return null;
}

export function clearUserCache() {
  userCache = null;
}

export async function logout(): Promise<AuthResponse> {
  clearUserCache();
  const res = await postJson("/api/auth/logout", {});
  const data = await parseJsonSafe(res);
  const message = getMessage(data);

  if (!res.ok) return { ok: false, message: message ?? "Logout gagal." };
  return { ok: true, message: message ?? "Logout berhasil." };
}

export async function logoutAll(): Promise<AuthResponse> {
  clearUserCache();
  const res = await postJson("/api/auth/logout-all", {});
  const data = await parseJsonSafe(res);
  const message = getMessage(data);

  if (!res.ok) return { ok: false, message: message ?? "Gagal logout semua device." };
  return { ok: true, message: message ?? "Logout semua device berhasil." };
}

export async function updateProfile(params: {
  name?: string;
  oldPassword?: string;
  newPassword?: string;
}): Promise<{ ok: true; user: AuthUser; message: string } | { ok: false; message: string }> {
  const res = await fetchWithAutoRefresh("/api/user/profile", {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await parseJsonSafe(res);
  const message = getMessage(data) ?? (res.ok ? "Berhasil." : "Gagal.");
  const user = getUser(data);

  if (!res.ok || !user) return { ok: false, message };
  
  // Update cache with new user data
  userCache = { user, timestamp: Date.now() };
  
  return { ok: true, user, message };
}
