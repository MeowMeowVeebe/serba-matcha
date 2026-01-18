import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: campaigns });
  } catch (error) {
    console.error("[Calendar API Error]", error);
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}
