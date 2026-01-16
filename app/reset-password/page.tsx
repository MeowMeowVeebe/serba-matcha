"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useAlert } from "@/context/AlertContext";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string; form?: string }>({});

  const { showAlert } = useAlert();

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false;
    if (!token) return false;
    if (!newPassword || !confirmPassword) return false;
    return newPassword === confirmPassword;
  }, [isSubmitting, token, newPassword, confirmPassword]);

  const validate = () => {
    const next: typeof errors = {};
    if (!token) next.form = "Token tidak ditemukan.";

    if (!newPassword) next.newPassword = "Password baru wajib diisi.";
    else if (newPassword.length < 8) next.newPassword = "Password minimal 8 karakter.";

    if (!confirmPassword) next.confirmPassword = "Konfirmasi password wajib diisi.";
    else if (confirmPassword !== newPassword) next.confirmPassword = "Konfirmasi password tidak sama.";

    setErrors(next);
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
        setErrors({ form: data?.message ?? "Gagal reset password." });
        return;
      }

      showAlert(data?.message ?? "Password berhasil direset.");
      router.push("/reset-password/success");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-container">
      <section className="auth-card" aria-label="Reset Password">
        <aside className="auth-aside" aria-hidden>
          <div className="auth-brand">
            <div className="auth-logo">M</div>
            <div>
              <h1>Matchia</h1>
              <p>Set password baru untuk akun kamu.</p>
            </div>
          </div>
          <ul className="auth-benefits">
            <li>Token sekali pakai</li>
            <li>Otomatis kedaluwarsa</li>
            <li>Siap integrasi email</li>
          </ul>
        </aside>

        <div className="auth-form">
          <header className="auth-header">
            <h2>Reset Password</h2>
            <p>Masukkan password baru untuk akun kamu.</p>
          </header>

          <form onSubmit={handleSubmit} className="auth-fields">
            <div className="form-group">
              <label htmlFor="newPassword">Password Baru</label>
              <div className="auth-input-row">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  aria-invalid={Boolean(errors.newPassword)}
                />
                <button
                  type="button"
                  className="auth-ghost-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.newPassword ? <p className="auth-error">{errors.newPassword}</p> : null}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Konfirmasi Password</label>
              <div className="auth-input-row">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={Boolean(errors.confirmPassword)}
                />
                <button
                  type="button"
                  className="auth-ghost-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword ? <p className="auth-error">{errors.confirmPassword}</p> : null}
            </div>

            {errors.form ? <div className="auth-form-error">{errors.form}</div> : null}

            <button type="submit" className="auth-primary-btn" disabled={!canSubmit}>
              {isSubmitting ? (
                <span className="auth-btn-row">
                  <span className="auth-spinner" aria-hidden />
                  Memproses...
                </span>
              ) : (
                "Simpan Password"
              )}
            </button>

            <div className="auth-divider">
              <span />
              <p>Kembali</p>
              <span />
            </div>

            <Link href="/login" className="auth-secondary-link">
              Ke halaman Login
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
