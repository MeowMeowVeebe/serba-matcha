import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [hotspots, deviceStats, summary] = await Promise.all([
      prisma.heatmapHotspot.findMany({
        orderBy: { clicks: "desc" },
      }),
      prisma.deviceStat.findMany({
        orderBy: { percentage: "desc" },
      }),
      prisma.heatmapSummary.findFirst({
        orderBy: { date: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        hotspots,
        deviceStats,
        summary: summary ?? { totalClicks: 0, avgSession: "0s", scrollDepth: 0 },
      },
    });
  } catch (error) {
    console.error("[Heatmap API Error]", error);
    return NextResponse.json({ error: "Failed to fetch heatmap data" }, { status: 500 });
  }
}
