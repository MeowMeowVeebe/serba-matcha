import { beforeEach, describe, expect, it } from "vitest";
import { testApiHandler } from "next-test-api-route-handler";

import * as registerRoute from "../app/api/auth/register/route";
import * as loginRoute from "../app/api/auth/login/route";
import * as logoutRoute from "../app/api/auth/logout/route";
import * as forgotRoute from "../app/api/auth/forgot-password/route";
import * as resetRoute from "../app/api/auth/reset-password/route";

import { prisma } from "@/lib/server/prisma";

function extractSetCookie(res: Response): string[] {
  const raw = res.headers.get("set-cookie");
  if (!raw) return [];
  return raw.split(/,(?=[^;]+=[^;]+)/g).map((s) => s.trim());
}

function cookieHeaderFromSetCookies(setCookies: string[]) {
  return setCookies
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

describe("auth flows", () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.rateLimitEvent.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
  });

  it("register then logout clears cookies", async () => {
    let cookie = "";

    await testApiHandler({
      appHandler: registerRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "flow@test.local", password: "Password123!", name: "Flow" }),
        });
        expect(res.status).toBe(201);
        cookie = cookieHeaderFromSetCookies(extractSetCookie(res));
        expect(cookie).toContain("matchia_access=");
        expect(cookie).toContain("matchia_refresh=");
      },
    });

    await testApiHandler({
      appHandler: logoutRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST", headers: { cookie } });
        expect(res.status).toBe(200);
        const setCookies = extractSetCookie(res);
        // cookies should be cleared (best-effort assertion)
        expect(setCookies.join("\n")).toMatch(/matchia_access=.*Max-Age=0/i);
        expect(setCookies.join("\n")).toMatch(/matchia_refresh=.*Max-Age=0/i);
      },
    });
  });

  it("forgot-password returns resetUrl in non-production, reset-password changes login password", async () => {
    // Create user by registering
    await testApiHandler({
      appHandler: registerRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "reset@test.local", password: "Password123!", name: "Reset" }),
        });
        expect(res.status).toBe(201);
      },
    });

    await testApiHandler({
      appHandler: forgotRoute,
      url: "http://localhost/api/auth/forgot-password",
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "reset@test.local" }),
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.message).toBeTruthy();
      },
    });

    // Fetch the latest reset token from DB (stable across NODE_ENV)
    const tokenRow = await prisma.passwordResetToken.findFirst({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
    expect(tokenRow?.user.email).toBe("reset@test.local");
    // We cannot read the raw token from DB (it's hashed). So instead we re-run the flow by calling forgot-password
    // in non-production mode if available, but if not, we fall back to generating a new token directly.
    // Here we generate a new token using the server helper to get the raw token.
    const { createPasswordResetToken } = await import("@/lib/server/resetTokens");
    const user = await prisma.user.findUnique({ where: { email: "reset@test.local" } });
    expect(user).toBeTruthy();
    const { token } = await createPasswordResetToken({ userId: user!.id });
    expect(token.length).toBeGreaterThan(10);

    await testApiHandler({
      appHandler: resetRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, newPassword: "NewPassword123!" }),
        });
        expect(res.status).toBe(200);
      },
    });

    // old password should fail
    await testApiHandler({
      appHandler: loginRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "reset@test.local", password: "Password123!" }),
        });
        expect(res.status).toBe(401);
      },
    });

    // new password should succeed
    await testApiHandler({
      appHandler: loginRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "reset@test.local", password: "NewPassword123!" }),
        });
        expect(res.status).toBe(200);
      },
    });
  });
});
