import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
    });

    const activeCount = incidents.filter((i) => i.status !== "resolved").length;
    const resolvedCount = incidents.filter((i) => i.status === "resolved").length;
    const highSeverityCount = incidents.filter((i) => i.severity === "high" || i.severity === "critical").length;

    return NextResponse.json({
      success: true,
      data: {
        incidents,
        stats: { activeCount, resolvedCount, highSeverityCount },
      },
    });
  } catch (error) {
    console.error("[Incidents API Error]", error);
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}
