import { prisma } from "./prisma";

export async function ensureRole(name: string) {
  const roleName = name.trim().toLowerCase();
  const existing = await prisma.role.findUnique({ where: { name: roleName } });
  if (existing) return existing;
  return prisma.role.create({ data: { name: roleName } });
}

export async function assignRoleToUser(params: { userId: string; roleName: string }) {
  const role = await ensureRole(params.roleName);
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: params.userId, roleId: role.id },
    },
    create: { userId: params.userId, roleId: role.id },
    update: {},
  });
}

export async function removeRoleFromUser(params: { userId: string; roleName: string }) {
  const roleName = params.roleName.trim().toLowerCase();
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return;
  await prisma.userRole.deleteMany({ where: { userId: params.userId, roleId: role.id } });
}

export async function userHasRole(params: { userId: string; roleName: string }) {
  const roleName = params.roleName.trim().toLowerCase();
  const count = await prisma.userRole.count({
    where: {
      userId: params.userId,
      role: { name: roleName },
    },
  });
  return count > 0;
}

export async function isAdmin(userId: string) {
  return userHasRole({ userId, roleName: "admin" });
}

export async function ensurePermission(name: string) {
  const permName = name.trim();
  const existing = await prisma.permission.findUnique({ where: { name: permName } });
  if (existing) return existing;
  return prisma.permission.create({ data: { name: permName } });
}

export async function grantPermissionToRole(params: { roleName: string; permissionName: string }) {
  const role = await ensureRole(params.roleName);
  const perm = await ensurePermission(params.permissionName);

  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
    create: { roleId: role.id, permissionId: perm.id },
    update: {},
  });
}

export async function revokePermissionFromRole(params: { roleName: string; permissionName: string }) {
  const roleName = params.roleName.trim().toLowerCase();
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return;

  const perm = await prisma.permission.findUnique({ where: { name: params.permissionName.trim() } });
  if (!perm) return;

  await prisma.rolePermission.deleteMany({ where: { roleId: role.id, permissionId: perm.id } });
}

export async function userHasPermission(params: { userId: string; permissionName: string }) {
  const permName = params.permissionName.trim();

  const count = await prisma.userRole.count({
    where: {
      userId: params.userId,
      role: {
        permissions: {
          some: {
            permission: { name: permName },
          },
        },
      },
    },
  });

  return count > 0;
}

export async function requirePermission(params: {
  userId: string;
  permissionName: string;
}) {
  const ok = await userHasPermission({
    userId: params.userId,
    permissionName: params.permissionName,
  });
  return ok;
}
