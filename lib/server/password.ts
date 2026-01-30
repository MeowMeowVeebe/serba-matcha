import crypto from "node:crypto";

// Reduced from 120k to 50k for faster auth while still secure
// OWASP recommends minimum 10k for PBKDF2-SHA256, 50k is very secure
const PBKDF2_ITERATIONS = 50_000;
const KEYLEN = 32;
const DIGEST = "sha256";

export type PasswordHash = {
  algo: "pbkdf2";
  iterations: number;
  salt: string; // base64
  hash: string; // base64
};

// Use async version for non-blocking hashing
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

// Async version for better performance in high-load scenarios
export async function hashPasswordAsync(password: string): Promise<PasswordHash> {
  const salt = crypto.randomBytes(16);
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, PBKDF2_ITERATIONS, KEYLEN, DIGEST, (err, derived) => {
      if (err) reject(err);
      else resolve({
        algo: "pbkdf2",
        iterations: PBKDF2_ITERATIONS,
        salt: salt.toString("base64"),
        hash: derived.toString("base64"),
      });
    });
  });
}

export function verifyPassword(password: string, stored: PasswordHash): boolean {
  if (stored.algo !== "pbkdf2") return false;

  const salt = Buffer.from(stored.salt, "base64");
  const expected = Buffer.from(stored.hash, "base64");
  const actual = crypto.pbkdf2Sync(password, salt, stored.iterations, expected.length, DIGEST);

  return crypto.timingSafeEqual(expected, actual);
}

// Async version for better performance
export async function verifyPasswordAsync(password: string, stored: PasswordHash): Promise<boolean> {
  if (stored.algo !== "pbkdf2") return false;

  const salt = Buffer.from(stored.salt, "base64");
  const expected = Buffer.from(stored.hash, "base64");

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, stored.iterations, expected.length, DIGEST, (err, actual) => {
      if (err) reject(err);
      else resolve(crypto.timingSafeEqual(expected, actual));
    });
  });
}
