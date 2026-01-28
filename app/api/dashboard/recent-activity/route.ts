import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";

export async function GET(request: Request) {
  try {
    const session = getSessionPayloadFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const isAdmin = user?.roles.some((ur) => ur.role.name === "admin");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get URL params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get recent audit logs
    const recentActivity = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      activities: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        statusCode: log.statusCode,
        createdAt: log.createdAt.toISOString(),
        userId: log.userId,
        ip: log.ip,
        meta: log.metaPreview,
      })),
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return NextResponse.json({ error: "Failed to fetch recent activity" }, { status: 500 });
  }
}
