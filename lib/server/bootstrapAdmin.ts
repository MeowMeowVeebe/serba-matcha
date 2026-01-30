import { hashPassword } from "./password";
import { prisma } from "./prisma";
import { createUser, findUserByEmail } from "./userStore";
import { assignRoleToUser } from "./rbac";
import { ensureDefaultAdminPermissions } from "./rbacBootstrap";

function getEnv(name: string) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

export async function bootstrapAdminIfNeeded() {
  // Hard one-time guard: if flag exists, never bootstrap again.
  const flag = await prisma.appConfig.findUnique({ where: { key: "bootstrap.admin.done" } });
  if (flag?.value === "true") return;

  // If any admin exists, consider bootstrap done.
  const hasAdmin =
    (await prisma.userRole.count({
      where: { role: { name: "admin" } },
    })) > 0;
  if (hasAdmin) {
    await prisma.appConfig.upsert({
      where: { key: "bootstrap.admin.done" },
      create: { key: "bootstrap.admin.done", value: "true" },
      update: { value: "true" },
    });
    return;
  }

  const email = getEnv("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = getEnv("BOOTSTRAP_ADMIN_PASSWORD");
  const name = getEnv("BOOTSTRAP_ADMIN_NAME") || "Admin";

  if (!email || !password) return;

  let user = await findUserByEmail(email);
  if (!user) {
    user = await createUser({
      email,
      name,
      password: hashPassword(password),
    });
  }

  await assignRoleToUser({ userId: user.id, roleName: "admin" });
  await ensureDefaultAdminPermissions();

  // Mark bootstrap as done.
  await prisma.appConfig.upsert({
    where: { key: "bootstrap.admin.done" },
    create: { key: "bootstrap.admin.done", value: "true" },
    update: { value: "true" },
  });
}
