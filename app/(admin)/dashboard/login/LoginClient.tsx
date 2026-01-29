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
      const response = await fetch("/api/auth/dashboard/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/dashboard/home");
      } else {
        setErrors({ general: data.error || "Login failed" });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell ariaLabel="Login" headerTitle="Welcome Back" headerDescription="Sign in to your account">
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


