import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const metrics = await prisma.revenueMetric.findMany({
      orderBy: { date: "desc" },
      take: 10,
    });

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error("[Revenue API Error]", error);
    return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 });
  }
}
