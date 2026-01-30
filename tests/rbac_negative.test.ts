import { beforeEach, describe, expect, it } from "vitest";
import { testApiHandler } from "next-test-api-route-handler";

import * as registerRoute from "../app/api/auth/register/route";
import * as loginRoute from "../app/api/auth/login/route";
import * as adminUsersRoute from "../app/api/admin/users/route";

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

describe("RBAC negative", () => {
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

  it("user without admin.users.read permission gets 403 on /api/admin/users", async () => {
    await testApiHandler({
      appHandler: registerRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "u@test.local", password: "Password123!", name: "U" }),
        });
        expect(res.status).toBe(201);
      },
    });

    let cookie = "";
    await testApiHandler({
      appHandler: loginRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "u@test.local", password: "Password123!" }),
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
