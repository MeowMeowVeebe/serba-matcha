"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { login } from "@/lib/authClient";
import { useAlert } from "../../context/AlertContext";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const { showAlert } = useAlert();

  const canSubmit = useMemo(() => Boolean(email && password) && !isSubmitting, [email, password, isSubmitting]);

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email wajib diisi.";
    else if (!isValidEmail(email)) next.email = "Format email tidak valid.";

    if (!password) next.password = "Password wajib diisi.";
    else if (password.length < 6) next.password = "Password minimal 6 karakter.";

    setErrors(next);
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
        setErrors({ form: res.message ?? "Login gagal." });
        return;
      }

      showAlert(res.message ?? "Login berhasil.");
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-container">
      <section className="auth-card" aria-label="Login">
        <aside className="auth-aside" aria-hidden>
          <div className="auth-brand">
            <div className="auth-logo">M</div>
          </div>

         
        </aside>

        <div className="auth-form">
          <header className="auth-header">
            <h2>Login</h2>
            <p>Selamat datang kembali. Silakan masuk.</p>
          </header>

          <form onSubmit={handleLogin} className="auth-fields">
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

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="auth-input-row">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(errors.password)}
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
              {errors.password ? <p className="auth-error">{errors.password}</p> : null}
            </div>

            {errors.form ? <div className="auth-form-error">{errors.form}</div> : null}

            <div className="auth-row-between">
              <Link className="auth-text-link" href="/forgot-password">
                Lupa password?
              </Link>
            </div>

            <button type="submit" className="auth-primary-btn" disabled={!canSubmit}>
              {isSubmitting ? (
                <span className="auth-btn-row">
                  <span className="auth-spinner" aria-hidden />
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>

            <div className="auth-divider">
              <span />
              <p>Belum punya akun?</p>
              <span />
            </div>

            <Link href="/register" className="auth-secondary-link">
              Buat akun baru
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}
