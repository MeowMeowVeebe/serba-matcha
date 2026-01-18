import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const alerts = await prisma.alertRule.findMany({
      orderBy: { createdAt: "desc" },
    });

    const activeCount = alerts.filter((a) => a.status === "active").length;
    const totalTriggered = alerts.reduce((sum, a) => sum + a.triggered, 0);
    const channels = [...new Set(alerts.map((a) => a.channel))].length;

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        stats: { activeCount, totalTriggered, channels },
      },
    });
  } catch (error) {
    console.error("[Alerts API Error]", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
