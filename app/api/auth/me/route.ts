import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";
import { withServerTiming } from "@/lib/server/observability";

export async function GET(req: Request) {
  return withServerTiming("auth.me", async () => {
    const session = getSessionPayloadFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fresh DB fetch (bypass in-memory cache) to ensure latest role
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: (user as any).role ?? null,
        phone: user.phone,
        avatar: user.avatar,
        roles: user.roles.map((r) => r.role.name),
      },
    });
  });
}
