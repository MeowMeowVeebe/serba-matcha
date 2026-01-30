"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useAlert } from "@/context/AlertContext";
import { TextField } from "@/components/form/TextField";
import FormError from "@/components/form/FormError";
import PrimaryButton from "@/components/form/PrimaryButton";
import AuthShell from "@/components/AuthShell";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; form?: string }>({});
  const [step, setStep] = useState(1);
  const { showAlert } = useAlert();

  const canSubmit = useMemo(() => Boolean(email.trim()) && !isSubmitting, [email, isSubmitting]);

  const emailRef = useRef<HTMLInputElement | null>(null);

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Invalid email format.";
    setErrors(next);

    if (next.email) emailRef.current?.focus();

    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json().catch(() => null)) as
        | { message?: string; resetUrl?: string }
        | null;

      if (!res.ok) {
        const msg = data?.message ?? "Failed to process request.";
        setErrors({ form: msg });
        showAlert(msg, { variant: "error" });
        return;
      }

      showAlert(data?.message ?? "Request processed.", { variant: "success" });
      setStep(2);

      // Dev helper: display reset link if server returns it.
      if (data?.resetUrl) {
        showAlert(`Dev reset link: ${data.resetUrl}`, { variant: "info", durationMs: 7000 });
      }

      setEmail("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      ariaLabel="Forgot Password"
      headerTitle="Forgot Password"
      headerDescription="Enter your active email. We'll send you a reset link."
      asideTitle="Serba Matcha"
      asideDescription="Restore account access without obstacles."
      asideBenefits={["One-time reset link", "Automatic expiration", "Security maintained"]}
    >
      <form onSubmit={handleSubmit} className="auth-fields">
        <TextField
          ref={emailRef}
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <FormError message={errors.form} />

        <PrimaryButton type="submit" disabled={!canSubmit} isLoading={isSubmitting}>
          Send Instructions
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

