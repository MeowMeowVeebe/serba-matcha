"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PasswordStoryline } from "@/components/ui/PasswordStoryline";
import Link from "next/link";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const { login } = await import("@/lib/authClient");
      const res = await login(email, password);

      if (res.ok) {
        // Fetch user info to check role
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const userData = await meRes.json();
          const user = userData.user;
          
          // Check if user is seller-only (has seller role but not admin)
          const isSeller = user?.roles?.some((r: string) => r.toLowerCase() === "seller" || r.toLowerCase() === "penjual") ?? false;
          const isAdmin = user?.roles?.some((r: string) => r.toLowerCase() === "admin") ?? false;
          const isSellerOnly = isSeller && !isAdmin;
          
          // Redirect based on role
          if (isSellerOnly) {
            router.push("/dashboard/seller/dashboard");
          } else {
            router.push("/dashboard/home");
          }
        } else {
          // Fallback to home if can't fetch user data
          router.push("/dashboard/home");
        }
      } else {
        setErrors({ general: res.message || "Login failed" });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      ariaLabel="Login"
      headerTitle="Welcome Back"
      headerDescription="Sign in to your account"
      headerRightSlot={
        <Link href="/home" className="auth-icon-btn" aria-label="Back to Home" title="Back to Home">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path fill="currentColor" d="M15.5 19 8.5 12l7-7 1.4 1.4L11.3 12l5.6 5.6L15.5 19z" />
          </svg>
        </Link>
      }
    >
      <Card variant="elevated" padding="lg">
        <CardBody>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {errors.general && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "var(--color-danger)",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                {errors.general}
              </div>
            )}

            <Input
              type="email"
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              autoComplete="off"
            />

            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
              autoComplete="off"
            />
            <PasswordStoryline password={password} />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link href="/forgot-password" style={{ fontSize: "14px", color: "var(--color-primary)" }}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading} loadingText="Signing in...">
              Sign In
            </Button>

            <div style={{ textAlign: "center", fontSize: "14px", color: "var(--color-text-secondary)" }}>
              Don&apos;t have an account?{" "}
              <Link href="/register" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                Sign up
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </AuthShell>
  );
}


