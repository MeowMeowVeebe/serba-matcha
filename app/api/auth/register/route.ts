import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/server/password";
import { createUser } from "@/lib/server/userStore";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "@/lib/server/authConfig";
import { setAccessCookie, setRefreshCookie } from "@/lib/server/authCookies";
import { signToken } from "@/lib/server/token";
import { createRefreshToken, cleanupRefreshTokens } from "@/lib/server/refreshTokens";
import { getClientIp } from "@/lib/server/rateLimit";
import { logAudit } from "@/lib/server/auditLog";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };

    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const name = (body.name ?? "").trim() || email.split("@")[0] || "User";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password harus diisi." },
        { status: 400 }
      );
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json({ message: "Format email tidak valid." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    const user = await createUser({
      email,
      name,
      password: hashPassword(password),
    });

    await logAudit({ action: "auth.register", userId: user.id, ip: getClientIp(req) });

    await cleanupRefreshTokens();

    const now = Math.floor(Date.now() / 1000);
    const accessToken = signToken({
      sub: user.id,
      email: user.email,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS,
    });

    const refresh = await createRefreshToken(user.id);

    const res = NextResponse.json(
      {
        message: "Registrasi berhasil.",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );

    setAccessCookie(res, accessToken, ACCESS_TOKEN_TTL_SECONDS);
    setRefreshCookie(res, refresh.token, REFRESH_TOKEN_TTL_SECONDS);
    return res;
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_EXISTS") {
      return NextResponse.json(
        { message: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    return NextResponse.json({ message: "Request tidak valid." }, { status: 400 });
  }
}
