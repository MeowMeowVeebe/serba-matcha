import { beforeEach, describe, expect, it } from "vitest";
import { testApiHandler } from "next-test-api-route-handler";

import * as loginRoute from "../app/api/auth/login/route";
import * as meRoute from "../app/api/auth/me/route";
import * as refreshRoute from "../app/api/auth/refresh/route";
import * as adminUsersRoute from "../app/api/admin/users/route";

import { prisma } from "@/lib/server/prisma";
import { createUser, makeAdmin } from "./helpers";

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

describe("auth + RBAC integration", () => {
  beforeEach(async () => {
    // keep schema, clear data
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

  it("/api/auth/refresh without cookie returns 401", async () => {
    await testApiHandler({
      appHandler: refreshRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" });
        expect(res.status).toBe(401);
      },
    });
  });

  it("login then /me returns user", async () => {
    const u = await createUser({ email: "user@test.local", name: "User", password: "Password123!" });

    // login
    let cookie = "";
    await testApiHandler({
      appHandler: loginRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: u.email, password: "Password123!" }),
        });
        expect(res.status).toBe(200);
        cookie = cookieHeaderFromSetCookies(extractSetCookie(res));
        expect(cookie).toContain("matchia_access=");
      },
    });

    // me
    await testApiHandler({
      appHandler: meRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET", headers: { cookie } });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.user.email).toBe(u.email);
      },
    });
  });

  it("admin endpoint returns 401 without session", async () => {
    await testApiHandler({
      appHandler: adminUsersRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(401);
      },
    });
  });

  it("admin endpoint returns 200 for admin user", async () => {
    const admin = await createUser({ email: "admin@test.local", name: "Admin", password: "Password123!" });
    await makeAdmin(admin.id);

    // login
    let cookie = "";
    await testApiHandler({
      appHandler: loginRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: admin.email, password: "Password123!" }),
        });
        expect(res.status).toBe(200);
        cookie = cookieHeaderFromSetCookies(extractSetCookie(res));
      },
    });

    // admin/users
    await testApiHandler({
      appHandler: adminUsersRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET", headers: { cookie } });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body.users)).toBe(true);
      },
    });
  });

  it("admin endpoint returns 403 for non-admin user", async () => {
    const user = await createUser({ email: "user2@test.local", name: "User2", password: "Password123!" });

    let cookie = "";
    await testApiHandler({
      appHandler: loginRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: user.email, password: "Password123!" }),
        });
        expect(res.status).toBe(200);
        cookie = cookieHeaderFromSetCookies(extractSetCookie(res));
      },
    });

    await testApiHandler({
      appHandler: adminUsersRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET", headers: { cookie } });
        expect(res.status).toBe(403);
      },
    });
  });
});
