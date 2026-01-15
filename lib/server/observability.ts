import { NextResponse } from "next/server";

/**
 * Minimal observability helper for Route Handlers.
 * Adds `Server-Timing` (and a friendly `X-Response-Time`) for quick profiling.
 */
export async function withServerTiming(
  label: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const start = performance.now();
  try {
    const res = await handler();
    const durMs = performance.now() - start;

    // `Server-Timing` supports multiple metrics; we add one.
    // https://w3c.github.io/server-timing/
    res.headers.set("Server-Timing", `${label};dur=${durMs.toFixed(1)}`);
    res.headers.set("X-Response-Time", `${durMs.toFixed(1)}ms`);
    return res;
  } catch {
    const durMs = performance.now() - start;
    const res = NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    res.headers.set("Server-Timing", `${label};dur=${durMs.toFixed(1)}`);
    res.headers.set("X-Response-Time", `${durMs.toFixed(1)}ms`);
    return res;
  }
}
