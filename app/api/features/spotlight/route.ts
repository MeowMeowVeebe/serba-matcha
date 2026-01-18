import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [features, testimonials] = await Promise.all([
      prisma.featureSpotlight.findMany({
        where: { isActive: true },
        orderBy: { adoption: "desc" },
      }),
      prisma.teamTestimonial.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ success: true, data: { features, testimonials } });
  } catch (error) {
    console.error("[Spotlight API Error]", error);
    return NextResponse.json({ error: "Failed to fetch spotlight data" }, { status: 500 });
  }
}
