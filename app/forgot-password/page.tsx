"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAlert } from "@/context/AlertContext";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; form?: string }>({});
  const { showAlert } = useAlert();

  const canSubmit = useMemo(
    () => Boolean(email.trim()) && !isSubmitting,
    [email, isSubmitting]
  );

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email wajib diisi.";
    else if (!isValidEmail(email)) next.email = "Format email tidak valid.";
    setErrors(next);
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
        setErrors({ form: data?.message ?? "Gagal memproses permintaan." });
        return;
      }

      showAlert(data?.message ?? "Permintaan diproses.");

      // Dev helper: tampilkan link reset kalau server mengembalikannya.
      if (data?.resetUrl) {
        showAlert(`Dev reset link: ${data.resetUrl}`);
      }

      setEmail("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-container">
      <section className="auth-card" aria-label="Forgot Password">
        <aside className="auth-aside" aria-hidden>
          <div className="auth-brand">
            <div className="auth-logo">M</div>
            <div>
            </div>
          </div>
         
        </aside>

        <div className="auth-form">
          <header className="auth-header">
            <h2>Lupa Password</h2>
            <p>Masukkan email kamu. Kami kirim instruksi reset.</p>
          </header>

          <form onSubmit={handleSubmit} className="auth-fields">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nama@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <p className="auth-error">{errors.email}</p> : null}
            </div>

            {errors.form ? <div className="auth-form-error">{errors.form}</div> : null}

            <button type="submit" className="auth-primary-btn" disabled={!canSubmit}>
              {isSubmitting ? (
                <span className="auth-btn-row">
                  <span className="auth-spinner" aria-hidden />
                  Memproses...
                </span>
              ) : (
                "Kirim Instruksi"
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
