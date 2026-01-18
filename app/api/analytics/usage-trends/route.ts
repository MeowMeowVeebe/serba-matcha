import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [trends, dailyData] = await Promise.all([
      prisma.usageTrend.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.dailyUsage.findMany({
        orderBy: { date: "asc" },
        take: 7,
      }),
    ]);

    return NextResponse.json({ success: true, data: { trends, dailyData } });
  } catch (error) {
    console.error("[Usage Trends API Error]", error);
    return NextResponse.json({ error: "Failed to fetch usage trends" }, { status: 500 });
  }
}
