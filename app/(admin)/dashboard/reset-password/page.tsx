"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { useAlert } from "@/context/AlertContext";
import PasswordField from "@/components/form/PasswordField";
import FormError from "@/components/form/FormError";
import PrimaryButton from "@/components/form/PrimaryButton";
import AuthShell from "@/components/AuthShell";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string; form?: string }>({});

  const { showAlert } = useAlert();

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false;
    if (!token) return false;
    if (!newPassword || !confirmPassword) return false;
    return newPassword === confirmPassword;
  }, [isSubmitting, token, newPassword, confirmPassword]);

  const newPasswordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

  const validate = () => {
    const next: typeof errors = {};
    if (!token) next.form = "Token not found.";

    if (!newPassword) next.newPassword = "New password is required.";
    else if (newPassword.length < 8) next.newPassword = "Password must be at least 8 characters.";

    if (!confirmPassword) next.confirmPassword = "Password confirmation is required.";
    else if (confirmPassword !== newPassword) next.confirmPassword = "Password confirmation does not match.";

    setErrors(next);

    if (next.newPassword) newPasswordRef.current?.focus();
    else if (next.confirmPassword) confirmPasswordRef.current?.focus();

    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = (await res.json().catch(() => null)) as { message?: string } | null;

      if (!res.ok) {
        const msg = data?.message ?? "Failed to reset password.";
        setErrors({ form: msg });
        showAlert(msg, { variant: "error" });
        return;
      }

      showAlert(data?.message ?? "Password reset successfully.", { variant: "success" });
      router.push("/reset-password/success");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      ariaLabel="Reset Password"
      headerTitle="Reset Password"
      headerDescription="Create a new password to keep your account secure."
      asideTitle="Serba Matcha"
      asideDescription="Complete the reset to sign in again."
      asideBenefits={["One-time token", "Automatic expiration", "Active account protection"]}
    >
      <form onSubmit={handleSubmit} className="auth-fields">
        <PasswordField
          ref={newPasswordRef}
          id="newPassword"
          label="New Password"
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
          showCapsLockHint
        />

        <PasswordField
          ref={confirmPasswordRef}
          id="confirmPassword"
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="Repeat password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          showCapsLockHint
        />

        <FormError message={errors.form} />

        <PrimaryButton type="submit" disabled={!canSubmit} isLoading={isSubmitting}>
          Save Password
        </PrimaryButton>

        <div className="auth-divider">
          <span />
          <p>Back</p>
          <span />
        </div>

        <Link href="/dashboard/login" className="auth-secondary-link">
          Back to Sign In
        </Link>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}

