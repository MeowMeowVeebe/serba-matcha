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

  const canSubmit = useMemo(() => Boolean(email && password) && !isSubmitting, [email, password, isSubmitting]);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard/home");
    }
  }, [isLoading, router, user]);

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email wajib diisi.";
    else if (!isValidEmail(email)) next.email = "Format email tidak valid.";

    if (!password) next.password = "Password wajib diisi.";
    else if (password.length < 6) next.password = "Password minimal 6 karakter.";

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
        const msg = res.message ?? "Login gagal.";
        setErrors({ form: msg });
        showAlert(msg, { variant: "error" });
        return;
      }

      showAlert(res.message ?? "Login berhasil.", { variant: "success" });
      router.push("/dashboard/home");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      ariaLabel="Login"
      headerTitle="Masuk"
      headerDescription="Selamat datang kembali. Masuk untuk melanjutkan."
      asideTitle="Serba Matcha"
      asideDescription="Kelola operasional, audit, dan insights dalam satu dashboard."
      asideBenefits={["Akses aman dengan RBAC", "Audit log real-time", "Insight siap eksekusi"]}
    >
      <form onSubmit={handleLogin} className="auth-fields">
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
            Lupa password?
          </Link>
        </div>

        <PrimaryButton type="submit" disabled={!canSubmit} isLoading={isSubmitting}>
          Masuk
        </PrimaryButton>

        <div className="auth-divider">
          <span />
          <p>Belum punya akun?</p>
          <span />
        </div>

        <Link href="/dashboard/register" className="auth-secondary-link">
          Buat akun baru
        </Link>
      </form>
    </AuthShell>
  );
}


