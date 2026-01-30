import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const headerCookie = req.headers.get("cookie") || null;
  const store = cookies();
  const all = (store as any).getAll?.() || [];

  return NextResponse.json({
    headerCookie,
    cookies: all.map((c: any) => ({ name: c.name, value: c.value })),
  });
}
