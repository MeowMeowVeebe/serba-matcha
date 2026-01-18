import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notes = await prisma.releaseNote.findMany({
      orderBy: { date: "desc" },
    });

    const data = notes.map((n) => ({
      ...n,
      items: JSON.parse(n.items),
      date: n.date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Release Notes API Error]", error);
    return NextResponse.json({ error: "Failed to fetch release notes" }, { status: 500 });
  }
}
