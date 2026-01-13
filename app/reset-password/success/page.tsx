"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = window.setTimeout(() => {
      router.push("/login");
    }, 2500);
    return () => window.clearTimeout(t);
  }, [router]);

  return (
    <main className="auth-container">
      <section className="auth-card" aria-label="Reset Password Success">
        <aside className="auth-aside" aria-hidden>
          <div className="auth-brand">
            <div className="auth-logo">M</div>
            <div>
              <h1>Matchia</h1>
              <p>Password kamu sudah diperbarui.</p>
            </div>
          </div>
          <ul className="auth-benefits">
            <li>Silakan login dengan password baru</li>
            <li>Redirect otomatis ke login</li>
          </ul>
        </aside>

        <div className="auth-form">
          <header className="auth-header">
            <h2>Berhasil</h2>
            <p>Password berhasil direset. Kamu akan diarahkan ke halaman login.</p>
          </header>

          <div className="auth-fields">
            <Link href="/login" className="auth-primary-btn" style={{ textDecoration: "none", textAlign: "center" }}>
              Ke halaman Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
