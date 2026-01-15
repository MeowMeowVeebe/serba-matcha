import { beforeEach, describe, expect, it } from "vitest";
import { testApiHandler } from "next-test-api-route-handler";

import * as loginRoute from "../app/api/auth/login/route";
import * as registerRoute from "../app/api/auth/register/route";

import * as adminUsersRoute from "../app/api/admin/users/route";
import * as rolesRoute from "../app/api/admin/rbac/roles/route";
import * as permissionsRoute from "../app/api/admin/rbac/permissions/route";
import * as rolePermsRoute from "../app/api/admin/rbac/role-permissions/route";
import * as userRolesRoute from "../app/api/admin/rbac/user-roles/route";

import { prisma } from "@/lib/server/prisma";
import { makeAdmin } from "./helpers";

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

describe("RBAC E2E", () => {
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

  it("admin can create role, grant users.read, assign to user, and user can access admin/users", async () => {
    // Create admin user directly in DB for speed
    const admin = await prisma.user.create({
      data: {
        email: "admin_e2e@test.local",
        name: "Admin E2E",
        passwordAlgo: "pbkdf2",
        passwordIter: 120_000,
        passwordSalt: "dGVzdA==",
        passwordHash: "dGVzdA==",
      },
    });
    // overwrite password to a real hash via password helper not needed; we'll login by registering instead.
    // Better: register admin through API then elevate to admin.

    // Register admin via API to ensure password works
    await prisma.user.delete({ where: { id: admin.id } });

    await testApiHandler({
      appHandler: registerRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: "admin_e2e@test.local",
            password: "Password123!",
            name: "Admin E2E",
          }),
        });
        expect(res.status).toBe(201);
      },
    });

    const adminUser = await prisma.user.findUnique({ where: { email: "admin_e2e@test.local" } });
    expect(adminUser).toBeTruthy();
    await makeAdmin(adminUser!.id);

    let adminCookie = "";
    await testApiHandler({
      appHandler: loginRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "admin_e2e@test.local", password: "Password123!" }),
        });
        expect(res.status).toBe(200);
        adminCookie = cookieHeaderFromSetCookies(extractSetCookie(res));
        expect(adminCookie).toContain("matchia_access=");
      },
    });

    // Create role 'support'
    let supportRoleId = "";
    await testApiHandler({
      appHandler: rolesRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { cookie: adminCookie, "content-type": "application/json" },
          body: JSON.stringify({ name: "support" }),
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        supportRoleId = body.role.id;
      },
    });

    // Fetch permissions and pick ADMIN_USERS_READ
    let usersReadPermId = "";
    await testApiHandler({
      appHandler: permissionsRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET", headers: { cookie: adminCookie } });
        expect(res.status).toBe(200);
        const body = await res.json();
        const perm = (body.permissions as Array<{ id: string; name: string }>).find((p) =>
          p.name.includes("admin.users.read"),
        );
        expect(perm).toBeTruthy();
        usersReadPermId = perm!.id;
      },
    });

    // Set role permissions
    await testApiHandler({
      appHandler: rolePermsRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { cookie: adminCookie, "content-type": "application/json" },
          body: JSON.stringify({ roleId: supportRoleId, permissionIds: [usersReadPermId] }),
        });
        expect(res.status).toBe(200);
      },
    });

    // Create a normal user
    await testApiHandler({
      appHandler: registerRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "support@test.local", password: "Password123!", name: "Support" }),
        });
        expect(res.status).toBe(201);
      },
    });

    const supportUser = await prisma.user.findUnique({ where: { email: "support@test.local" } });
    expect(supportUser).toBeTruthy();

    // Assign role to that user (via admin endpoint)
    await testApiHandler({
      appHandler: userRolesRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { cookie: adminCookie, "content-type": "application/json" },
          body: JSON.stringify({ userId: supportUser!.id, roleIds: [supportRoleId] }),
        });
        expect(res.status).toBe(200);
      },
    });

    // Login as support user
    let supportCookie = "";
    await testApiHandler({
      appHandler: loginRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "support@test.local", password: "Password123!" }),
        });
        expect(res.status).toBe(200);
        supportCookie = cookieHeaderFromSetCookies(extractSetCookie(res));
      },
    });

    // support user should be able to read /admin/users
    await testApiHandler({
      appHandler: adminUsersRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET", headers: { cookie: supportCookie } });
        expect(res.status).toBe(200);
      },
    });
  });
});
