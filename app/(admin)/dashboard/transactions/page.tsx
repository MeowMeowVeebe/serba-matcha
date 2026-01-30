"use client";

import AccountShell from "@/components/AccountShell";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type CartItem = {
  productId?: string | null;
  name: string;
  price: number;
  qty: number;
  image?: string | null;
  category?: string | null;
};

type Tx = {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  price: number;
  grossAmount: number;
  shippingCost: number;
  status: string;
  items: CartItem[];
  createdAt: string;
};

export default function TransactionsPage() {
  return (
    <AccountShell
      title="Transaction History"
      description="Your purchase list"
      breadcrumbs={[{ label: "Transactions" }]}
    >
      {() => <TransactionsContent />}
    </AccountShell>
  );
}

function TransactionsContent() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);

  const fetchTransactions = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const json = await res.json();
      setTxs(json.transactions || []);
    } catch (e) {}
    finally { if (showLoading) setLoading(false); }
  };

  useEffect(() => { fetchTransactions(true); }, []);
  useEffect(() => {
    const interval = setInterval(() => fetchTransactions(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const formatRp = (n: number) => `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;

  const statusStyles: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    completed: { dot: "#10b981", bg: "rgba(16,185,129,0.1)", text: "#34d399", label: "Completed" },
    pending: { dot: "#f59e0b", bg: "rgba(245,158,11,0.1)", text: "#fbbf24", label: "Pending" },
    processing: { dot: "#3b82f6", bg: "rgba(59,130,246,0.1)", text: "#60a5fa", label: "Processing" },
    cancelled: { dot: "#ef4444", bg: "rgba(239,68,68,0.1)", text: "#f87171", label: "Cancelled" },
  };
  const getStatus = (s: string) => statusStyles[s] || statusStyles.pending;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 72, borderRadius: 12, background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" }} />
        ))}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
      </div>
    );
  }

  if (txs.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>Belum ada transaksi</p>
        <Link href="/menu" style={{ color: "#4ade80", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Mulai Belanja →</Link>
      </div>
    );
  }

  const closeModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setSelectedTx(null);
      setIsModalClosing(false);
    }, 300);
  };

  return (
    <>
      {/* Animation styles */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      {/* Transaction list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {txs.map((tx) => {
          const items = Array.isArray(tx.items) ? tx.items : [];
          const st = getStatus(tx.status);
          const count = items.reduce((s, i) => s + i.qty, 0);

          return (
            <button
              key={tx.id}
              onClick={() => setSelectedTx(tx)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: 16,
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = "rgba(74,222,128,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.9)" }}>{count} item</span>
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: st.bg, color: st.text }}>{st.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                    {formatDate(tx.createdAt)} • {formatTime(tx.createdAt)}
                  </p>
                </div>

                {/* Price */}
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.9)", margin: 0 }}>{formatRp(tx.grossAmount)}</p>
                </div>

                {/* Arrow */}
                <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {selectedTx && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            zIndex: 9999, 
            display: "flex", 
            alignItems: "flex-end", 
            justifyContent: "center",
            padding: "0 16px",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={closeModal}
            style={{ 
              position: "absolute", 
              inset: 0, 
              background: "rgba(0,0,0,0.7)", 
              backdropFilter: "blur(4px)",
              animation: isModalClosing ? "fadeOut 0.3s ease forwards" : "fadeIn 0.3s ease forwards",
            }}
          />
          
          {/* Modal Container */}
          <div 
            style={{ 
              position: "relative", 
              width: "100%", 
              maxWidth: 480, 
              maxHeight: "85vh", 
              background: "#0d1410", 
              borderRadius: "20px 20px 0 0", 
              overflow: "hidden", 
              boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
              animation: isModalClosing ? "slideDown 0.3s ease forwards" : "slideUp 0.3s ease forwards",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>Detail Pesanan</h3>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>#{selectedTx.orderId?.slice(-12) || selectedTx.id.slice(0, 12)}</p>
              </div>
              <button 
                onClick={closeModal} 
                style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "16px 20px", overflowY: "auto", maxHeight: "calc(85vh - 140px)" }}>
              {/* Status bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: getStatus(selectedTx.status).dot }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: getStatus(selectedTx.status).text }}>{getStatus(selectedTx.status).label}</span>
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{formatDate(selectedTx.createdAt)}, {formatTime(selectedTx.createdAt)}</span>
              </div>

              {/* Items */}
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Products</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(Array.isArray(selectedTx.items) ? selectedTx.items : []).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: "linear-gradient(135deg, #0c3b2e, #1a5c45)", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill style={{ objectFit: "contain", padding: 4 }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: 13, color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.qty}x @ {formatRp(item.price)}</p>
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{formatRp(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Subtotal</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{formatRp(selectedTx.grossAmount - selectedTx.shippingCost)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Ongkir</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{selectedTx.shippingCost > 0 ? formatRp(selectedTx.shippingCost) : "Gratis"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#4ade80" }}>{formatRp(selectedTx.grossAmount)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={closeModal}
                style={{ width: "100%", padding: 14, borderRadius: 12, background: "linear-gradient(135deg, #166534, #15803d)", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
