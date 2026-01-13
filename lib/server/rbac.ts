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
