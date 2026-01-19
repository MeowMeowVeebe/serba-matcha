import { prisma } from "./prisma";
import type { PasswordHash } from "./password";
import { LruCache } from "@/lib/client/lru";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  password: PasswordHash;
  createdAt: string;
  roles: string[];
};

// In-memory cache for frequent user lookups (5 second TTL, max 100 entries)
const userCacheById = new LruCache<string, { user: UserRecord; expires: number }>(100);
const userCacheByEmail = new LruCache<string, { user: UserRecord; expires: number }>(100);
const CACHE_TTL_MS = 5000; // 5 seconds

function getCachedUser(cache: LruCache<string, { user: UserRecord; expires: number }>, key: string): UserRecord | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.user;
  }
  if (cached) {
    cache.delete(key);
  }
  return null;
}

function setCachedUser(user: UserRecord) {
  const entry = { user, expires: Date.now() + CACHE_TTL_MS };
  userCacheById.set(user.id, entry);
  userCacheByEmail.set(user.email.toLowerCase(), entry);
}

export function invalidateUserCache(idOrEmail: string) {
  userCacheById.delete(idOrEmail);
  userCacheByEmail.delete(idOrEmail.toLowerCase());
}

function toPasswordHash(u: {
  passwordAlgo: string;
  passwordIter: number;
  passwordSalt: string;
  passwordHash: string;
}): PasswordHash {
  return {
    algo: u.passwordAlgo === "pbkdf2" ? "pbkdf2" : "pbkdf2",
    iterations: u.passwordIter,
    salt: u.passwordSalt,
    hash: u.passwordHash,
  };
}

function fromPasswordHash(p: PasswordHash) {
  return {
    passwordAlgo: p.algo,
    passwordIter: p.iterations,
    passwordSalt: p.salt,
    passwordHash: p.hash,
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const lower = email.trim().toLowerCase();
  
  // Check cache first
  const cached = getCachedUser(userCacheByEmail, lower);
  if (cached) return cached;
  
  const u = await prisma.user.findUnique({ 
    where: { email: lower },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
  if (!u) return null;
  
  const user: UserRecord = {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    avatar: u.avatar,
    password: toPasswordHash(u),
    createdAt: u.createdAt.toISOString(),
    roles: u.roles.map((r) => r.role.name),
  };
  
  setCachedUser(user);
  return user;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  // Check cache first
  const cached = getCachedUser(userCacheById, id);
  if (cached) return cached;
  
  const u = await prisma.user.findUnique({ 
    where: { id },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
  if (!u) return null;
  
  const user: UserRecord = {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    avatar: u.avatar,
    password: toPasswordHash(u),
    createdAt: u.createdAt.toISOString(),
    roles: u.roles.map((r) => r.role.name),
  };
  
  setCachedUser(user);
  return user;
}

export async function createUser(params: {
  email: string;
  name: string;
  password: PasswordHash;
}): Promise<UserRecord> {
  const email = params.email.trim().toLowerCase();
  try {
    const u = await prisma.user.create({
      data: {
        email,
        name: params.name,
        ...fromPasswordHash(params.password),
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      avatar: u.avatar,
      password: toPasswordHash(u),
      createdAt: u.createdAt.toISOString(),
      roles: u.roles.map((r) => r.role.name),
    };
  } catch (e: unknown) {
    // Prisma unique constraint
    const maybeCode =
      typeof e === "object" && e !== null && "code" in e ? (e as { code?: unknown }).code : undefined;

    if (maybeCode === "P2002") {
      throw new Error("EMAIL_EXISTS");
    }

    throw e;
  }
}

export async function updateUserProfile(params: {
  id: string;
  name?: string;
  phone?: string | null;
  avatar?: string | null;
  password?: PasswordHash;
}): Promise<UserRecord> {
  // Invalidate cache before update
  invalidateUserCache(params.id);
  
  const u = await prisma.user.update({
    where: { id: params.id },
    data: {
      name: params.name,
      ...(params.phone !== undefined ? { phone: params.phone } : {}),
      ...(params.avatar !== undefined ? { avatar: params.avatar } : {}),
      ...(params.password ? fromPasswordHash(params.password) : {}),
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  const user: UserRecord = {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    avatar: u.avatar,
    password: toPasswordHash(u),
    createdAt: u.createdAt.toISOString(),
    roles: u.roles.map((r) => r.role.name),
  };
  
  // Update cache with new data
  setCachedUser(user);
  return user;
}
