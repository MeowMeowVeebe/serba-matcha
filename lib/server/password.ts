import crypto from "node:crypto";

const PBKDF2_ITERATIONS = 120_000;
const KEYLEN = 32;
const DIGEST = "sha256";

export type PasswordHash = {
  algo: "pbkdf2";
  iterations: number;
  salt: string; // base64
  hash: string; // base64
};

export function hashPassword(password: string): PasswordHash {
  const salt = crypto.randomBytes(16);
  const derived = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEYLEN, DIGEST);

  return {
    algo: "pbkdf2",
    iterations: PBKDF2_ITERATIONS,
    salt: salt.toString("base64"),
    hash: derived.toString("base64"),
  };
}

export function verifyPassword(password: string, stored: PasswordHash): boolean {
  if (stored.algo !== "pbkdf2") return false;

  const salt = Buffer.from(stored.salt, "base64");
  const expected = Buffer.from(stored.hash, "base64");
  const actual = crypto.pbkdf2Sync(password, salt, stored.iterations, expected.length, DIGEST);

  return crypto.timingSafeEqual(expected, actual);
}
