"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

const UPGRADE_SECRET = "matcha-secret-2026";

function RoleUpgradeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const roleupgrade = searchParams.get("roleupgrade");
    const email = searchParams.get("email");

    if (!roleupgrade || !email) {
      setStatus("error");
      setMessage("Missing required parameters: roleupgrade and email");
      return;
    }

    setStatus("loading");
    setMessage("Processing role upgrade...");

    fetch("/api/user/role-upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        role: roleupgrade,
        secret: UPGRADE_SECRET,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.message);

          // Redirect based on role
          const isSeller = roleupgrade.toLowerCase() === "seller" || roleupgrade.toLowerCase() === "penjual";
          setTimeout(() => {
            if (isSeller) {
              window.location.href = "/dashboard/seller/dashboard";
            } else {
              window.location.href = "/dashboard/home";
            }
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to upgrade role");
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage("Network error: " + (err.message || "Unknown error"));
      });
  }, [searchParams]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        textAlign: "center",
        padding: 40,
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
        maxWidth: 400,
        width: "90%",
      }}>
        {status === "loading" && (
          <>
            <div style={{
              width: 48,
              height: 48,
              border: "3px solid rgba(34,197,94,0.2)",
              borderTopColor: "#22c55e",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 20px",
            }} />
            <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.7)" }}>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(34,197,94,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="24" height="24" fill="none" stroke="#22c55e" strokeWidth="3" viewBox="0 0 24 24">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 600, color: "#22c55e" }}>Success!</h2>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{message}</p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Redirecting...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="24" height="24" fill="none" stroke="#ef4444" strokeWidth="3" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 600, color: "#ef4444" }}>Error</h2>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{message}</p>
            <a 
              href="/dashboard/login" 
              style={{
                display: "inline-block",
                padding: "10px 20px",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              Go to Login
            </a>
          </>
        )}

        {status === "idle" && (
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Initializing...</p>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}

export default function RolePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        color: "rgba(255,255,255,0.5)",
      }}>
        Loading...
      </div>
    }>
      <RoleUpgradeContent />
    </Suspense>
  );
}
