"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { login } from "@/lib/authClient";
import { useUser } from "@/lib/hooks/useUser";
import { useAlert } from "@/context/AlertContext";
import { TextField } from "@/components/form/TextField";
import PasswordField from "@/components/form/PasswordField";
import FormError from "@/components/form/FormError";
import PrimaryButton from "@/components/form/PrimaryButton";
import AuthShell from "@/components/AuthShell";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const { showAlert } = useAlert();
  const { user, isLoading } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const canSubmit = useMemo(() => Boolean(email && password) && !isSubmitting, [email, password, isSubmitting]);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  // Helper function to determine redirect path based on role
  const getRedirectPath = (userRole?: string | null, userRoles?: string[]) => {
    // Check if user is seller/penjual
    const isSeller = userRole === 'seller' || userRole === 'penjual' || 
        userRoles?.some(r => r.toLowerCase() === 'seller' || r.toLowerCase() === 'penjual');
    if (isSeller) {
      return '/dashboard/seller/dashboard';
    }
    // Default: customer/user goes to dashboard home
    return '/dashboard/home';
  };

  // If user is already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (!isLoading && user && !isRedirecting) {
      setIsRedirecting(true);
      const redirectPath = getRedirectPath(user.role, user.roles);
      window.location.href = redirectPath;
    }
  }, [isLoading, user, isRedirecting]);

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Invalid email format.";

    if (!password) next.password = "Password is required.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";

    setErrors(next);

    // focus first error field
    if (next.email) emailRef.current?.focus();
    else if (next.password) passwordRef.current?.focus();

    return Object.keys(next).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});
    try {
      const res = await login(email, password);
      if (!res.ok) {
        const msg = res.message ?? "Login failed.";
        setErrors({ form: msg });
        showAlert(msg, { variant: "error" });
        return;
      }

      showAlert(res.message ?? "Login successful.", { variant: "success" });
      
      // Redirect based on user role from login response
      const redirectPath = getRedirectPath(res.user?.role, res.user?.roles);
      
      // Hard redirect to avoid client-side routing issues
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 300);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      ariaLabel="Login"
      headerTitle="Sign In"
      headerDescription="Welcome back. Sign in to continue."
      headerRightSlot={
        <Link
          href="/home"
          className="auth-icon-btn"
          aria-label="Back to Home"
          title="Back to Home"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path fill="currentColor" d="M15.5 19 8.5 12l7-7 1.4 1.4L11.3 12l5.6 5.6L15.5 19z" />
          </svg>
        </Link>
      }
      asideTitle="Serba Matcha"
      asideDescription="Manage operations, audits, and insights in one dashboard."
      asideBenefits={["Secure access with RBAC", "Real-time audit logs", "Ready-to-execute insights"]}
    >
      <form onSubmit={handleLogin} className="auth-fields">
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

        <PasswordField
          ref={passwordRef}
          id="password"
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          showCapsLockHint
        />

        <FormError message={errors.form} />

        <div className="auth-row-between">
          <Link className="auth-text-link" href="/dashboard/forgot-password">
            Forgot password?
          </Link>
        </div>

        <PrimaryButton type="submit" disabled={!canSubmit} isLoading={isSubmitting}>
          Sign In
        </PrimaryButton>

        <div className="auth-divider">
          <span />
          <p>Don't have an account?</p>
          <span />
        </div>

        <Link href="/dashboard/register" className="auth-secondary-link">
          Create new account
        </Link>
      </form>
    </AuthShell>
  );
}


