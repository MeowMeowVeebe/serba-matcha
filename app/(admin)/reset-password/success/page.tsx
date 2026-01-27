"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";

export default function ResetPasswordSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = window.setTimeout(() => {
      router.push("/login");
    }, 2500);
    return () => window.clearTimeout(t);
  }, [router]);

  return (
    <AuthShell
      ariaLabel="Reset Password Success"
      headerTitle="Reset Berhasil"
      headerDescription="Password berhasil diperbarui. Kamu akan diarahkan ke login."
      asideTitle="Serba Matcha"
      asideDescription="Akun kamu sudah aman dengan password baru."
      asideBenefits={["Login ulang untuk melanjutkan", "Redirect otomatis ke login"]}
    >
      <div className="auth-fields">
        <Link href="/login" className="auth-primary-btn" style={{ textDecoration: "none", textAlign: "center" }}>
          Ke halaman Login
        </Link>
      </div>
    </AuthShell>
  );
}
