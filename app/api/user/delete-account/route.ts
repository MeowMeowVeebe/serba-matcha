import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";
import { logAudit } from "@/lib/server/auditLog";

/**
 * DELETE /api/user/delete-account
 * Permanently delete the current user's account and all related data
 */
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = currentUser.id;

    // Log audit before deletion
    await logAudit({
      userId,
      action: "user:delete-account",
      resource: "user",
      resourceId: userId.toString(),
      status: "pending",
      metadata: {
        email: currentUser.email,
        name: currentUser.name,
      },
    });

    // Delete user and all related data (cascade delete)
    // Prisma will handle cascade deletion based on schema relations
    await prisma.user.delete({
      where: { id: userId },
    });

    // Return success
    return NextResponse.json({
      success: true,
      message: "Your account has been permanently deleted.",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to delete account. Please try again later." 
      },
      { status: 500 }
    );
  }
}
