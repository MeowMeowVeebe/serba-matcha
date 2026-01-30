import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { logAudit } from "@/lib/server/auditLog";
import { getClientIp } from "@/lib/server/rateLimit";

// Secret key untuk upgrade role - JANGAN SHARE INI
const UPGRADE_SECRET = "matcha-secret-2026";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, role, secret } = body;

    // Validate secret
    if (secret !== UPGRADE_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Validate role (only allow seller/penjual role)
    const allowedRoles = ["penjual", "seller"];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return NextResponse.json({ error: "Invalid role. Allowed: penjual, seller" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Normalize role name
    const normalizedRole = role.toLowerCase() === "seller" ? "penjual" : role.toLowerCase();

    // Check if role exists (case-insensitive search)
    let roleRecord = await prisma.role.findFirst({
      where: { name: normalizedRole },
    });
    
    // Try with different casing if not found
    if (!roleRecord) {
      roleRecord = await prisma.role.findFirst({
        where: {
          OR: [
            { name: normalizedRole.toLowerCase() },
            { name: normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1).toLowerCase() },
          ],
        },
      });
    }

    // Create role if not exists
    if (!roleRecord) {
      roleRecord = await prisma.role.create({
        data: { name: normalizedRole },
      });
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: roleRecord.id,
      },
    });

    if (existingUserRole) {
      return NextResponse.json({ 
        message: `User ${email} already has role: ${normalizedRole}`,
        success: true,
      });
    }

    // Add role to user
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: roleRecord.id,
      },
    });

    // Log audit
    await logAudit({
      action: "user.role.upgrade",
      userId: user.id,
      ip: getClientIp(req),
      meta: { newRole: normalizedRole, email: user.email },
    });

    return NextResponse.json({
      success: true,
      message: `Role "${normalizedRole}" berhasil ditambahkan ke ${email}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: [...user.roles.map(r => r.role.name), normalizedRole],
      },
    });
  } catch (error) {
    console.error("Role upgrade error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
