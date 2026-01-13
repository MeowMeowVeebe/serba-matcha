export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthResponse = {
  ok: boolean;
  message?: string;
};

type JsonObject = Record<string, unknown>;

type JsonValue = null | boolean | number | string | JsonObject | JsonValue[];

async function parseJsonSafe(res: Response): Promise<JsonValue> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as JsonValue;
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

  if (typeof id !== "string" || typeof email !== "string" || typeof name !== "string") {
    return undefined;
  }

  return { id, email, name };
}

async function postJson<T extends JsonObject>(url: string, body: T): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  const ok = await refreshSession();
  if (!ok) return res;

  // retry once
  return fetch(input, init);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await postJson("/api/auth/login", { email, password });
  const data = await parseJsonSafe(res);
  const message = getMessage(data);

  if (!res.ok) return { ok: false, message: message ?? "Login gagal." };
  return { ok: true, message: message ?? "Login berhasil." };
}

export async function register(params: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  const res = await postJson("/api/auth/register", params);
  const data = await parseJsonSafe(res);
  const message = getMessage(data);

  if (!res.ok) return { ok: false, message: message ?? "Registrasi gagal." };
  return { ok: true, message: message ?? "Registrasi berhasil." };
}

export async function me(): Promise<{ ok: true; user: AuthUser } | { ok: false }> {
  const res = await fetchWithAutoRefresh("/api/auth/me", { method: "GET" });
  if (!res.ok) return { ok: false };

  const data = await parseJsonSafe(res);
  const user = getUser(data);
  if (!user) return { ok: false };

  return { ok: true, user };
}

export async function logout(): Promise<AuthResponse> {
  const res = await postJson("/api/auth/logout", {});
  const data = await parseJsonSafe(res);
  const message = getMessage(data);

  if (!res.ok) return { ok: false, message: message ?? "Logout gagal." };
  return { ok: true, message: message ?? "Logout berhasil." };
}

export async function logoutAll(): Promise<AuthResponse> {
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await parseJsonSafe(res);
  const message = getMessage(data) ?? (res.ok ? "Berhasil." : "Gagal.");
  const user = getUser(data);

  if (!res.ok || !user) return { ok: false, message };
  return { ok: true, user, message };
}
