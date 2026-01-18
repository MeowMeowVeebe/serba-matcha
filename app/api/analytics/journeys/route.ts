import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const journeys = await prisma.customerJourney.findMany({
      where: { isActive: true },
    });

    // Parse steps JSON
    const data = journeys.map((j) => ({
      ...j,
      steps: JSON.parse(j.steps),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Journeys API Error]", error);
    return NextResponse.json({ error: "Failed to fetch journeys" }, { status: 500 });
  }
}
