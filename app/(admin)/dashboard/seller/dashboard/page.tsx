"use client";

import { useEffect, useMemo, useState } from "react";
import AccountShell from "@/components/AccountShell";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  image: string;
  updatedAt: string;
};

type Tx = {
  id: string;
  productId: string | null;
  productName: string;
  price: number;
  grossAmount?: number;
  createdAt: string;
};

export default function SellerDashboardPage() {
  return (
    <AccountShell
      title="Seller Dashboard"
      description="Sales summary and product performance"
      breadcrumbs={[{ label: "Seller" }, { label: "Dashboard" }]}
    >
      {() => <SellerDashboard />}
    </AccountShell>
  );
}

function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data function
  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch("/api/seller/products", { cache: "no-store" }), 
        fetch("/api/transactions", { cache: "no-store" })
      ]);
      const pJson = await pRes.json();
      const tJson = await tRes.json();
      setProducts(pJson.products || []);
      setTxs(tJson.transactions || []);
    } catch (err) {
      setProducts([]);
      setTxs([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and real-time polling every 10 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const revenue = useMemo(() => txs.reduce((sum, t) => sum + (t.grossAmount || t.price || 0), 0), [txs]);
  const totalOrders = txs.length;
  const totalProducts = products.length;
  const lowStock = useMemo(() => products.filter((p) => p.stock <= 5).length, [products]);

  const topProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    txs.forEach((t) => (counts[t.productName] = (counts[t.productName] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [txs]);

  const formatRp = (n: number) => `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 100, borderRadius: 12, background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" }} />
        ))}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Orders", value: totalOrders, icon: "shopping-bag", color: "#3b82f6" },
          { label: "Revenue", value: formatRp(revenue), icon: "dollar", color: "#10b981" },
        ].map((stat, i) => (
          <div key={i} style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" fill="none" stroke={stat.color} strokeWidth="1.5" viewBox="0 0 24 24">
                  {stat.icon === "shopping-bag" && <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />}
                  {stat.icon === "dollar" && <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Quick Actions</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link href="/dashboard/seller/products?add=true" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, background: "linear-gradient(135deg, #166534, #15803d)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Product
          </Link>
          <Link href="/dashboard/seller/products" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            Manage Products
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Recent Orders */}
        <div style={{ padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Recent Orders</p>
          {txs.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 12px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No orders yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {txs.slice(0, 5).map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{t.productName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{formatDate(t.createdAt)} {formatTime(t.createdAt)}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#4ade80" }}>{formatRp(t.grossAmount || t.price)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div style={{ padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Top Products</p>
          {topProducts.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <svg width="48" height="48" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>No sales data yet</p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Start selling to see your top products here</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topProducts.map(([name, count], i) => {
                const maxCount = topProducts[0][1];
                const percentage = (count / maxCount) * 100;
                const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];
                const color = colors[i % colors.length];
                
                return (
                  <div key={name} style={{ position: "relative" }}>
                    {/* Background bar */}
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "100%",
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${color}20, ${color}05)`,
                      borderRadius: 10,
                      transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: `1px solid ${color}30`
                    }} />
                    
                    {/* Content */}
                    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, padding: 14, zIndex: 1 }}>
                      {/* Rank Badge */}
                      <div style={{
                        minWidth: 32,
                        height: 32,
                        borderRadius: 8,
                        background: i === 0 ? `linear-gradient(135deg, ${color}, ${color}dd)` : `${color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: i === 0 ? "#fff" : color,
                        boxShadow: i === 0 ? `0 4px 12px ${color}40` : "none"
                      }}>
                        {i === 0 ? "👑" : `#${i + 1}`}
                      </div>
                      
                      {/* Product Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ 
                          margin: 0, 
                          fontSize: 13, 
                          fontWeight: 600, 
                          color: "rgba(255,255,255,0.9)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {name}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                              borderRadius: 2,
                              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                            }} />
                          </div>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Sales Count */}
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: color, lineHeight: 1 }}>
                          {count}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {count === 1 ? "sale" : "sales"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 480px) {
          /* Make product names wrap on very small screens */
          div[style*="whiteSpace: nowrap"] {
            white-space: normal !important;
            line-height: 1.3 !important;
          }
        }
      `}</style>
    </div>
  );
}

