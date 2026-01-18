import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [experiments, flags] = await Promise.all([
      prisma.featureExperiment.findMany({
        where: {
          status: { in: ["running", "paused", "planning"] },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.featureFlag.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ success: true, data: { experiments, flags } });
  } catch (error) {
    console.error("[Control Room API Error]", error);
    return NextResponse.json({ error: "Failed to fetch control room data" }, { status: 500 });
  }
}
