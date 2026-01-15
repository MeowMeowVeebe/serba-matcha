import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { findUserById } from "@/lib/server/userStore";

import { withServerTiming } from "@/lib/server/observability";

export async function GET(req: Request) {
  return withServerTiming("auth.me", async () => {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await findUserById(session.sub);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  });
}
