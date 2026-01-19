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

    // Get current date ranges
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousPeriod = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await prisma.user.count();
    const usersLast24h = await prisma.user.count({
      where: { createdAt: { gte: last24h } },
    });
    const usersPrevious24h = await prisma.user.count({
      where: {
        createdAt: {
          gte: previousPeriod,
          lt: last24h,
        },
      },
    });

    // Active sessions
    const activeSessions = await prisma.refreshToken.count({
      where: {
        expiresAt: { gt: now },
        revokedAt: null,
      },
    });

    // Failed login attempts (last 24h) - statusCode >= 400 indicates failure
    const failedLogins = await prisma.auditLog.count({
      where: {
        action: "auth:login",
        statusCode: { gte: 400 },
        createdAt: { gte: last24h },
      },
    });

    // Security events (last 7 days)
    const securityEvents = await prisma.auditLog.count({
      where: {
        action: { in: ["auth:login", "auth:logout", "auth:password_reset"] },
        statusCode: { gte: 400 },
        createdAt: { gte: last7days },
      },
    });

    // User growth (last 30 days)
    const userGrowth = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM User
      WHERE createdAt >= ${last30days}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    // Login activity by hour (last 7 days)
    const loginActivity = await prisma.$queryRaw<Array<{ hour: number; count: number }>>`
      SELECT 
        CAST(strftime('%H', timestamp) AS INTEGER) as hour,
        COUNT(*) as count
      FROM AuditLog
      WHERE action = 'auth:login'
        AND status = 'success'
        AND timestamp >= ${last7days}
      GROUP BY hour
      ORDER BY hour ASC
    `;

    // Top actions (last 30 days)
    const topActions = await prisma.auditLog.groupBy({
      by: ["action"],
      where: {
        createdAt: { gte: last30days },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    // Calculate growth percentage
    const userGrowthPercentage =
      usersPrevious24h > 0 ? ((usersLast24h - usersPrevious24h) / usersPrevious24h) * 100 : 0;

    return NextResponse.json({
      overview: {
        totalUsers: {
          value: totalUsers,
          change: usersLast24h,
          percentage: Math.round(userGrowthPercentage * 10) / 10,
        },
        activeSessions: {
          value: activeSessions,
        },
        failedLogins: {
          value: failedLogins,
        },
        securityEvents: {
          value: securityEvents,
        },
      },
      charts: {
        userGrowth: userGrowth.map((item) => ({
          date: item.date,
          count: Number(item.count),
        })),
        loginActivity: Array.from({ length: 24 }, (_, i) => {
          const found = loginActivity.find((item) => Number(item.hour) === i);
          return {
            hour: i,
            count: found ? Number(found.count) : 0,
          };
        }),
        topActions: topActions.map((item) => ({
          action: item.action,
          count: item._count.id,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
