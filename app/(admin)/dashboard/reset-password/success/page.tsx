"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";

export default function ResetPasswordSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = window.setTimeout(() => {
      router.push("/dashboard/login");
    }, 2500);
    return () => window.clearTimeout(t);
  }, [router]);

  return (
    <AuthShell
      ariaLabel="Reset Password Success"
      headerTitle="Reset Successful"
      headerDescription="Password updated successfully. You will be redirected to login."
      asideTitle="Serba Matcha"
      asideDescription="Your account is now secure with your new password."
      asideBenefits={["Sign in again to continue", "Automatic redirect to login"]}
    >
      <div className="auth-fields">
        <Link href="/dashboard/login" className="auth-primary-btn" style={{ textDecoration: "none", textAlign: "center" }}>
          Back to Sign In
        </Link>
      </div>
    </AuthShell>
  );
}

