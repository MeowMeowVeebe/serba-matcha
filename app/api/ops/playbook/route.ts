import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const steps = await prisma.playbookStep.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        completions: {
          where: {
            userId: session.sub,
            date: { gte: today },
          },
        },
      },
    });

    const data = steps.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      done: s.completions.length > 0,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Playbook API Error]", error);
    return NextResponse.json({ error: "Failed to fetch playbook" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stepId, done } = await req.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (done) {
      await prisma.playbookCompletion.upsert({
        where: {
          stepId_userId_date: {
            stepId,
            userId: session.sub,
            date: today,
          },
        },
        create: {
          stepId,
          userId: session.sub,
          date: today,
        },
        update: {},
      });
    } else {
      await prisma.playbookCompletion.deleteMany({
        where: {
          stepId,
          userId: session.sub,
          date: { gte: today },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Playbook Toggle Error]", error);
    return NextResponse.json({ error: "Failed to update playbook" }, { status: 500 });
  }
}
