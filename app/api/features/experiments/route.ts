import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [experiments, components] = await Promise.all([
      prisma.featureExperiment.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.componentLib.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ success: true, data: { experiments, components } });
  } catch (error) {
    console.error("[Experiments API Error]", error);
    return NextResponse.json({ error: "Failed to fetch experiments" }, { status: 500 });
  }
}
