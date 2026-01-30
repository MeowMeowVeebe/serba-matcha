/**
 * Script to promote a user to admin role
 * Usage: npx tsx scripts/make-admin.ts <email>
 * Example: npx tsx scripts/make-admin.ts admin@example.com
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log("Usage: npx tsx scripts/make-admin.ts <email>");
    console.log("Example: npx tsx scripts/make-admin.ts admin@example.com");
    
    // List all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });
    
    console.log("\nAvailable users:");
    if (users.length === 0) {
      console.log("  No users found. Please register first at /dashboard/register");
    } else {
      users.forEach((u) => {
        console.log(`  - ${u.email} (${u.name}) - Role: ${u.role}`);
      });
    }
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email "${email}" not found.`);
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`User "${email}" is already an admin.`);
    process.exit(0);
  }

  await prisma.user.update({
    where: { email },
    data: { role: "admin" },
  });

  console.log(`✅ User "${email}" has been promoted to admin!`);
  console.log(`You can now access /dashboard/penjual or /dashboard/seller/products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
