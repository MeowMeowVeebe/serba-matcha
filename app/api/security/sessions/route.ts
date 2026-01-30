import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await prisma.userSession.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: 20,
    });

    const activeCount = sessions.filter((s) => s.isActive).length;

    // Format lastSeen
    const now = new Date();
    const data = sessions.map((s) => {
      const diff = now.getTime() - s.lastSeenAt.getTime();
      let lastSeen = "Just now";
      if (diff > 86400000 * 7) lastSeen = `${Math.floor(diff / 86400000)} days ago`;
      else if (diff > 86400000) lastSeen = `${Math.floor(diff / 86400000)} days ago`;
      else if (diff > 3600000) lastSeen = `${Math.floor(diff / 3600000)} hours ago`;
      else if (diff > 60000) lastSeen = `${Math.floor(diff / 60000)} minutes ago`;

      // Extract browser from userAgent
      const browserMatch = s.userAgent?.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)/i);
      const browser = browserMatch ? browserMatch[1] : "Unknown Browser";

      return {
        id: s.id,
        device: s.device,
        browser,
        location: s.location ?? "Unknown",
        ip: s.ip ?? "Unknown",
        lastSeen,
        status: s.isActive ? "active" : "recent",
        isCurrent: s.userId === session.sub,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions: data,
        stats: { activeCount, totalCount: sessions.length },
      },
    });
  } catch (error) {
    console.error("[Sessions API Error]", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
