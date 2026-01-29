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

    if (!name.trim()) next.name = "Nama wajib diisi.";
    else if (name.trim().length < 2) next.name = "Nama minimal 2 karakter.";

    if (!email.trim()) next.email = "Email wajib diisi.";
    else if (!isValidEmail(email)) next.email = "Format email tidak valid.";

    if (!password) next.password = "Password wajib diisi.";
    else if (password.length < 8) next.password = "Password minimal 8 karakter.";
    else if (strength.score < 3) next.password = "Password terlalu lemah. Gunakan kombinasi huruf/angka/simbol.";

    if (!confirmPassword) next.confirmPassword = "Konfirmasi password wajib diisi.";
    else if (confirmPassword !== password) next.confirmPassword = "Konfirmasi password tidak sama.";

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
        const msg = res.message ?? "Registrasi gagal.";
        setErrors({ form: msg });
        showAlert(msg, { variant: "error" });
        return;
      }

      showAlert(res.message ?? "Registrasi berhasil.", { variant: "success" });
      router.push("/dashboard/login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      ariaLabel="Register"
      headerTitle="Buat Akun"
      headerDescription="Lengkapi data untuk mulai mengelola dashboard."
      asideTitle="Serba Matcha"
      asideDescription="Mulai dari insight ke aksi hanya dalam hitungan menit."
      asideBenefits={["Onboarding cepat", "Template playbook siap pakai", "Kontrol penuh akses tim"]}
    >
      <form onSubmit={handleRegister} className="auth-fields">
        <TextField
          ref={nameRef}
          id="name"
          label="Nama"
          type="text"
          autoComplete="name"
          placeholder="Nama lengkap"
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
          placeholder="Minimal 8 karakter"
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
          label="Konfirmasi Password"
          autoComplete="new-password"
          placeholder="Ulangi password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          showCapsLockHint
          aria-invalid={Boolean(errors.confirmPassword) || mismatch}
          error={errors.confirmPassword}
          hint={!errors.confirmPassword && mismatch ? "Konfirmasi password tidak sama." : undefined}
        />

        <FormError message={errors.form} />

        <PrimaryButton type="submit" disabled={!canSubmit} isLoading={isSubmitting}>
          Daftar
        </PrimaryButton>

        <div className="auth-divider">
          <span />
          <p>Sudah punya akun?</p>
          <span />
        </div>

        <Link href="/dashboard/login" className="auth-secondary-link">
          Masuk ke akun
        </Link>
      </form>
    </AuthShell>
  );
}

