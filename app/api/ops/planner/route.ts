import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const actions = await prisma.actionItem.findMany({
      where: { completed: false },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    const highPriorityCount = actions.filter((a) => a.priority === "high" || a.priority === "critical").length;
    const owners = [...new Set(actions.map((a) => a.owner).filter(Boolean))].length;

    return NextResponse.json({
      success: true,
      data: {
        actions,
        stats: { highPriorityCount, totalActions: actions.length, teams: owners },
      },
    });
  } catch (error) {
    console.error("[Planner API Error]", error);
    return NextResponse.json({ error: "Failed to fetch planner data" }, { status: 500 });
  }
}
