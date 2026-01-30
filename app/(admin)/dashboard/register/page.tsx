"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import AuthShell from "@/components/AuthShell";
import FormError from "@/components/form/FormError";
import PasswordField from "@/components/form/PasswordField";
import PrimaryButton from "@/components/form/PrimaryButton";
import { TextField } from "@/components/form/TextField";
import { useAlert } from "@/context/AlertContext";
import { register } from "@/lib/authClient";

function passwordChecks(pw: string) {
  const v = pw ?? "";
  return {
    length: v.length >= 8,
    lower: /[a-z]/.test(v),
    upper: /[A-Z]/.test(v),
    number: /\d/.test(v),
    symbol: /[^A-Za-z0-9]/.test(v),
  };
}

function passwordScore(pw: string) {
  const c = passwordChecks(pw);
  const score = Object.values(c).filter(Boolean).length; // 0..5
  return { score, checks: c };
}
function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);
  const mismatch = useMemo(() => {
    if (!password || !confirmPassword) return false;
    return password !== confirmPassword;
  }, [password, confirmPassword]);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const { showAlert } = useAlert();

  const strength = useMemo(() => passwordScore(password), [password]);

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false;
    if (!name || !email || !password || !confirmPassword) return false;
    if (password !== confirmPassword) return false;
    // Require at least 3 checks to reduce weak passwords
    return strength.score >= 3;
  }, [name, email, password, confirmPassword, isSubmitting, strength.score]);

  const validate = () => {
    const next: typeof errors = {};

    if (!name.trim()) next.name = "Name is required.";
    else if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";

    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Invalid email format.";

    if (!password) next.password = "Password is required.";
    else if (password.length < 8) next.password = "Password must be at least 8 characters.";
    else if (strength.score < 3) next.password = "Password is too weak. Use a combination of letters/numbers/symbols.";

    if (!confirmPassword) next.confirmPassword = "Password confirmation is required.";
    else if (confirmPassword !== password) next.confirmPassword = "Password confirmation does not match.";

    setErrors(next);

    if (next.name) nameRef.current?.focus();
    else if (next.email) emailRef.current?.focus();
    else if (next.password) passwordRef.current?.focus();
    else if (next.confirmPassword) confirmPasswordRef.current?.focus();

    return Object.keys(next).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});
    try {
      const res = await register({ name, email, password });
      if (!res.ok) {
        const msg = res.message ?? "Registration failed.";
        setErrors({ form: msg });
        showAlert(msg, { variant: "error" });
        return;
      }

      showAlert(res.message ?? "Registration successful.", { variant: "success" });
      router.push("/dashboard/login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      ariaLabel="Register"
      headerTitle="Create Account"
      headerDescription="Complete the form to start managing your dashboard."
      headerRightSlot={
        <Link href="/dashboard/login" className="auth-icon-btn" aria-label="Back to Login" title="Back to Login">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path fill="currentColor" d="M15.5 19 8.5 12l7-7 1.4 1.4L11.3 12l5.6 5.6L15.5 19z" />
          </svg>
        </Link>
      }
      asideTitle="Serba Matcha"
      asideDescription="From insight to action in just minutes."
      asideBenefits={["Quick onboarding", "Ready-to-use playbook templates", "Full team access control"]}
    >
      <form onSubmit={handleRegister} className="auth-fields">
        <TextField
          ref={nameRef}
          id="name"
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <TextField
          ref={emailRef}
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nama@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <PasswordField
          ref={passwordRef}
          id="password"
          label="Password"
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          // keep aria-invalid driven by validate() for now
          error={errors.password}
          showCapsLockHint
          hint={
            <div style={{ marginTop: 2 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ flex: 1, height: 8, borderRadius: 999, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(strength.score / 5) * 100}%`,
                      height: "100%",
                      background:
                        strength.score <= 1
                          ? "#b00020"
                          : strength.score === 2
                            ? "#f08c00"
                            : strength.score === 3
                              ? "#2f9e44"
                              : "#1971c2",
                      transition: "width 160ms ease",
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  {strength.score <= 1 ? "Weak" : strength.score === 2 ? "Ok" : strength.score === 3 ? "Good" : "Strong"}
                </span>
              </div>

              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, opacity: 0.85 }}>
                <li style={{ color: strength.checks.length ? "#2f9e44" : "inherit" }}>Min 8 characters</li>
                <li style={{ color: strength.checks.lower ? "#2f9e44" : "inherit" }}>Contains lowercase</li>
                <li style={{ color: strength.checks.upper ? "#2f9e44" : "inherit" }}>Contains uppercase</li>
                <li style={{ color: strength.checks.number ? "#2f9e44" : "inherit" }}>Contains number</li>
                <li style={{ color: strength.checks.symbol ? "#2f9e44" : "inherit" }}>Contains symbol</li>
              </ul>
            </div>
          }
        />

        <PasswordField
          ref={confirmPasswordRef}
          id="confirmPassword"
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="Repeat password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          showCapsLockHint
          aria-invalid={Boolean(errors.confirmPassword) || mismatch}
          error={errors.confirmPassword}
          hint={!errors.confirmPassword && mismatch ? "Password confirmation does not match." : undefined}
        />

        <FormError message={errors.form} />

        <PrimaryButton type="submit" disabled={!canSubmit} isLoading={isSubmitting}>
          Register
        </PrimaryButton>

        <div className="auth-divider">
          <span />
          <p>Already have an account?</p>
          <span />
        </div>

        <Link href="/dashboard/login" className="auth-secondary-link">
          Sign in to account
        </Link>
      </form>
    </AuthShell>
  );
}

