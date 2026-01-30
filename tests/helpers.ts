import { prisma } from "@/lib/server/prisma";
import { hashPassword } from "@/lib/server/password";
import { ensureDefaultAdminPermissions } from "@/lib/server/rbacBootstrap";
import { assignRoleToUser, grantPermissionToRole } from "@/lib/server/rbac";
import { PERMISSIONS } from "@/lib/server/permissions";

export async function createUser(params: { email: string; name: string; password: string }) {
  const email = params.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email,
      name: params.name,
      ...(() => {
        const p = hashPassword(params.password);
        return { passwordAlgo: p.algo, passwordIter: p.iterations, passwordSalt: p.salt, passwordHash: p.hash };
      })(),
    },
  });
}

export async function makeAdmin(userId: string) {
  await assignRoleToUser({ userId, roleName: "admin" });
  await ensureDefaultAdminPermissions();
}

export async function makeNonAdminWithUserRead(userId: string) {
  // Create role 'support' with users.read only
  await grantPermissionToRole({ roleName: "support", permissionName: PERMISSIONS.ADMIN_USERS_READ });
  await assignRoleToUser({ userId, roleName: "support" });
}
