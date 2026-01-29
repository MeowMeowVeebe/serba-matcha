"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PasswordStoryline } from "@/components/ui/PasswordStoryline";
import Link from "next/link";

export default function RegisterClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/dashboard/login?registered=true");
      } else {
        setErrors({ general: data.error || "Registration failed" });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell ariaLabel="Register" headerTitle="Create Account" headerDescription="Sign up to get started">
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
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              error={errors.name}
              required
              autoComplete="off"
            />

            <Input
              type="email"
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              error={errors.email}
              required
              autoComplete="off"
            />

            <Input
              type="password"
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: "" });
              }}
              error={errors.password}
              helperText="Must be at least 8 characters"
              required
              autoComplete="off"
            />
            <PasswordStoryline password={password} />

            <Input
              type="password"
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
              }}
              error={errors.confirmPassword}
              required
              autoComplete="off"
            />

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading} loadingText="Creating account...">
              Create Account
            </Button>

            <div style={{ textAlign: "center", fontSize: "14px", color: "var(--color-text-secondary)" }}>
              Already have an account?{" "}
              <Link href="/dashboard/login" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                Sign in
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </AuthShell>
  );
}

