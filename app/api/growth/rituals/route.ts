import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rituals = await prisma.teamRitual.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: rituals });
  } catch (error) {
    console.error("[Rituals API Error]", error);
    return NextResponse.json({ error: "Failed to fetch rituals" }, { status: 500 });
  }
}
