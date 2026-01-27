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
    if (!token) next.form = "Token tidak ditemukan.";

    if (!newPassword) next.newPassword = "Password baru wajib diisi.";
    else if (newPassword.length < 8) next.newPassword = "Password minimal 8 karakter.";

    if (!confirmPassword) next.confirmPassword = "Konfirmasi password wajib diisi.";
    else if (confirmPassword !== newPassword) next.confirmPassword = "Konfirmasi password tidak sama.";

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
        const msg = data?.message ?? "Gagal reset password.";
        setErrors({ form: msg });
        showAlert(msg, { variant: "error" });
        return;
      }

      showAlert(data?.message ?? "Password berhasil direset.", { variant: "success" });
      router.push("/reset-password/success");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      ariaLabel="Reset Password"
      headerTitle="Reset Password"
      headerDescription="Buat password baru agar akun tetap aman."
      asideTitle="Serba Matcha"
      asideDescription="Selesaikan reset agar bisa login kembali."
      asideBenefits={["Token sekali pakai", "Otomatis kedaluwarsa", "Proteksi akun aktif"]}
    >
      <form onSubmit={handleSubmit} className="auth-fields">
        <PasswordField
          ref={newPasswordRef}
          id="newPassword"
          label="Password Baru"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
          showCapsLockHint
        />

        <PasswordField
          ref={confirmPasswordRef}
          id="confirmPassword"
          label="Konfirmasi Password"
          autoComplete="new-password"
          placeholder="Ulangi password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          showCapsLockHint
        />

        <FormError message={errors.form} />

        <PrimaryButton type="submit" disabled={!canSubmit} isLoading={isSubmitting}>
          Simpan Password
        </PrimaryButton>

        <div className="auth-divider">
          <span />
          <p>Kembali</p>
          <span />
        </div>

        <Link href="/login" className="auth-secondary-link">
          Ke halaman Login
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
