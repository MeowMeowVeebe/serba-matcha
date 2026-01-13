import { prisma } from "./prisma";
import type { PasswordHash } from "./password";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  password: PasswordHash;
  createdAt: string;
};

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
  const u = await prisma.user.findUnique({ where: { email: lower } });
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    password: toPasswordHash(u),
    createdAt: u.createdAt.toISOString(),
  };
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    password: toPasswordHash(u),
    createdAt: u.createdAt.toISOString(),
  };
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
    });

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      password: toPasswordHash(u),
      createdAt: u.createdAt.toISOString(),
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
  password?: PasswordHash;
}): Promise<UserRecord> {
  const u = await prisma.user.update({
    where: { id: params.id },
    data: {
      name: params.name,
      ...(params.password ? fromPasswordHash(params.password) : {}),
    },
  });

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    password: toPasswordHash(u),
    createdAt: u.createdAt.toISOString(),
  };
}
