"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { register } from "@/lib/authClient";
import { useAlert } from "../../context/AlertContext";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const { showAlert } = useAlert();

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false;
    if (!name || !email || !password || !confirmPassword) return false;
    return password === confirmPassword;
  }, [name, email, password, confirmPassword, isSubmitting]);

  const validate = () => {
    const next: typeof errors = {};

    if (!name.trim()) next.name = "Nama wajib diisi.";
    else if (name.trim().length < 2) next.name = "Nama minimal 2 karakter.";

    if (!email.trim()) next.email = "Email wajib diisi.";
    else if (!isValidEmail(email)) next.email = "Format email tidak valid.";

    if (!password) next.password = "Password wajib diisi.";
    else if (password.length < 8) next.password = "Password minimal 8 karakter.";

    if (!confirmPassword) next.confirmPassword = "Konfirmasi password wajib diisi.";
    else if (confirmPassword !== password) next.confirmPassword = "Konfirmasi password tidak sama.";

    setErrors(next);
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
        setErrors({ form: res.message ?? "Registrasi gagal." });
        return;
      }

      showAlert(res.message ?? "Registrasi berhasil.");
      router.push("/login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-container">
      <section className="auth-card" aria-label="Register">
        <aside className="auth-aside" aria-hidden>
          <div className="auth-brand">
            <div className="auth-logo">M</div>
          </div>
        </aside>

        <div className="auth-form">
          <header className="auth-header">
            <h2>Register</h2>
            <p>Isi data berikut untuk membuat akun.</p>
          </header>

          <form onSubmit={handleRegister} className="auth-fields">
            <div className="form-group">
              <label htmlFor="name">Nama</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <p className="auth-error">{errors.name}</p> : null}
            </div>

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
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Konfirmasi Password</label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              {errors.confirmPassword ? (
                <p className="auth-error">{errors.confirmPassword}</p>
              ) : null}
            </div>

            {errors.form ? <div className="auth-form-error">{errors.form}</div> : null}

            <button type="submit" className="auth-primary-btn" disabled={!canSubmit}>
              {isSubmitting ? (
                <span className="auth-btn-row">
                  <span className="auth-spinner" aria-hidden />
                  Memproses...
                </span>
              ) : (
                "Daftar"
              )}
            </button>

            <div className="auth-divider">
              <span />
              <p>Sudah punya akun?</p>
              <span />
            </div>

            <Link href="/login" className="auth-secondary-link">
              Masuk ke akun
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}
