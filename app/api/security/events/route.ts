import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await prisma.securityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const criticalCount = events.filter((e) => e.severity === "danger").length;
    const warningCount = events.filter((e) => e.severity === "warning").length;

    return NextResponse.json({
      success: true,
      data: {
        events: events.map((e) => ({
          id: e.id,
          time: e.createdAt.toISOString(),
          event: e.event,
          severity: e.severity,
        })),
        stats: { criticalCount, warningCount, totalCount: events.length },
      },
    });
  } catch (error) {
    console.error("[Security Events API Error]", error);
    return NextResponse.json({ error: "Failed to fetch security events" }, { status: 500 });
  }
}
