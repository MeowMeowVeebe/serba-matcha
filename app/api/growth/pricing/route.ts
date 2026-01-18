import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const experiments = await prisma.pricingExperiment.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: experiments });
  } catch (error) {
    console.error("[Pricing API Error]", error);
    return NextResponse.json({ error: "Failed to fetch pricing data" }, { status: 500 });
  }
}
