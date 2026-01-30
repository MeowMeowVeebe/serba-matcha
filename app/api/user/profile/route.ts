import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { findUserById, updateUserProfile } from "@/lib/server/userStore";
import { logAudit } from "@/lib/server/auditLog";
import { getClientIp } from "@/lib/server/rateLimit";
import { revokeAllRefreshTokensForUser } from "@/lib/server/refreshTokens";
import { clearAuthCookies } from "@/lib/server/authCookies";

export async function PATCH(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await findUserById(session.sub);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    phone?: string;
    avatar?: string;
    oldPassword?: string;
    newPassword?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Request tidak valid." }, { status: 400 });
  }

  const name = body.name?.trim();
  const phone = body.phone?.trim() || null;
  const avatar = body.avatar || null;

  // Jika user mau ganti password, wajib isi oldPassword
  if (body.newPassword) {
    const oldPassword = body.oldPassword ?? "";
    const newPassword = body.newPassword ?? "";

    if (!oldPassword) {
      return NextResponse.json(
        { message: "Masukkan password lama terlebih dahulu." },
        { status: 400 }
      );
    }

    if (!verifyPassword(oldPassword, user.password)) {
      return NextResponse.json({ message: "Password lama salah." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password baru minimal 8 karakter." },
        { status: 400 }
      );
    }

    const updated = await updateUserProfile({
      id: user.id,
      name: name && name.length > 1 ? name : undefined,
      password: hashPassword(newPassword),
    });

    // keamanan: revoke semua refresh token (logout semua device), supaya sesi lama invalid
    await revokeAllRefreshTokensForUser(user.id);
    await logAudit({ action: "user.profile.change_password", userId: user.id, ip: getClientIp(req) });

    const res = NextResponse.json({
      message: "Pengaturan berhasil disimpan. Silakan login ulang.",
      user: { id: updated.id, email: updated.email, name: updated.name },
    });
    clearAuthCookies(res);
    return res;
  }

  // Update profile fields
  const updated = await updateUserProfile({
    id: user.id,
    name: name && name.length > 1 ? name : undefined,
    phone: phone !== undefined ? phone : undefined,
    avatar: avatar !== undefined ? avatar : undefined,
  });

  await logAudit({ action: "user.profile.update", userId: user.id, ip: getClientIp(req) });

  return NextResponse.json({
    message: "Profil berhasil diperbarui.",
    user: { 
      id: updated.id, 
      email: updated.email, 
      name: updated.name,
      phone: updated.phone,
      avatar: updated.avatar,
    },
  });
}

// Alias PUT to PATCH
export async function PUT(req: Request) {
  return PATCH(req);
}

// DELETE - Hapus akun user
export async function DELETE(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await findUserById(session.sub);
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  try {
    // Import prisma for deletion
    const { prisma } = await import("@/lib/server/prisma");
    
    // Delete all related data first (cascade)
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await prisma.securityEvent.deleteMany({ where: { userId: user.id } });
    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    
    // Delete the user
    await prisma.user.delete({ where: { id: user.id } });

    // Log audit (system log since user is deleted)
    await logAudit({ 
      action: "user.account.deleted", 
      userId: user.id, 
      ip: getClientIp(req),
      meta: { email: user.email, deletedAt: new Date().toISOString() }
    });

    // Clear cookies
    const res = NextResponse.json({ 
      success: true,
      message: "Akun berhasil dihapus" 
    });
    clearAuthCookies(res);
    
    return res;
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ 
      error: "Gagal menghapus akun. Silakan coba lagi." 
    }, { status: 500 });
  }
}
