import { prisma } from "@/lib/server/prisma";
import { hashPassword } from "@/lib/server/password";
import { createUser, findUserByEmail } from "@/lib/server/userStore";
import { assignRoleToUser } from "@/lib/server/rbac";
import { ensureDefaultAdminPermissions } from "@/lib/server/rbacBootstrap";

function getEnv(name: string) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

async function seed() {
  // Ensure core permissions exist
  await ensureDefaultAdminPermissions();

  // Optional: seed admin user from env
  const email = getEnv("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = getEnv("BOOTSTRAP_ADMIN_PASSWORD");
  const name = getEnv("BOOTSTRAP_ADMIN_NAME") || "Admin";

  if (email && password) {
    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser({
        email,
        name,
        password: hashPassword(password),
      });
      console.log(`[seed] created admin user: ${email}`);
    } else {
      console.log(`[seed] admin user already exists: ${email}`);
    }

    await assignRoleToUser({ userId: user.id, roleName: "admin" });
  } else {
    console.log("[seed] BOOTSTRAP_ADMIN_EMAIL/PASSWORD not set; skipping admin user creation");
  }

  // Mark bootstrap flag as done if at least one admin exists
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
  }
}

seed()
  .catch((e) => {
    console.error("[seed] failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
