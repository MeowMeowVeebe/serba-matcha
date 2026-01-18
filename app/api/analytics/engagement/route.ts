import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [pulses, topCTAs] = await Promise.all([
      prisma.engagementPulse.findMany({
        orderBy: { time: "asc" },
      }),
      prisma.topCTA.findMany({
        orderBy: { clicks: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({ success: true, data: { pulses, topCTAs } });
  } catch (error) {
    console.error("[Engagement API Error]", error);
    return NextResponse.json({ error: "Failed to fetch engagement data" }, { status: 500 });
  }
}
