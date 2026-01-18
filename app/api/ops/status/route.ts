import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [services, queues] = await Promise.all([
      prisma.service.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.queueMetric.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    // Calculate overall uptime
    const uptimes = services.map((s) => parseFloat(s.uptime.replace("%", "")));
    const overallUptime = (uptimes.reduce((a, b) => a + b, 0) / uptimes.length).toFixed(1);
    const totalQueueItems = queues.reduce((sum, q) => sum + q.count, 0);
    const slaMetCount = services.filter((s) => s.status === "operational").length;
    const slaMet = Math.round((slaMetCount / services.length) * 100);

    return NextResponse.json({
      success: true,
      data: {
        services,
        queues,
        stats: { overallUptime: `${overallUptime}%`, slaMet: `${slaMet}%`, totalQueueItems },
      },
    });
  } catch (error) {
    console.error("[Status API Error]", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
