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
  createdAt: string;
};

export default function SellerDashboardPage() {
  return (
    <AccountShell
      title="Seller Dashboard"
      description="Ringkasan penjualan dan performa produk"
      breadcrumbs={[{ label: "Seller" }, { label: "Dashboard" }]}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link className="matcha-btn matcha-btn--secondary" href="/dashboard/seller/products">
            Kelola Produk
          </Link>
          <Link className="matcha-btn matcha-btn--primary" href="/dashboard/transactions">
            Lihat Transaksi
          </Link>
        </div>
      }
    >
      {() => <SellerDashboard />}
    </AccountShell>
  );
}

function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, tRes] = await Promise.all([fetch("/api/seller/products"), fetch("/api/transactions")]);
        const pJson = await pRes.json();
        const tJson = await tRes.json();
        setProducts(pJson.products || []);
        setTxs(tJson.transactions || []);
      } catch (err) {
        console.warn("Failed to load seller data", err);
        setProducts([]);
        setTxs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const revenue = useMemo(() => txs.reduce((sum, t) => sum + (t.price || 0), 0), [txs]);
  const totalOrders = txs.length;

  const topProduct = useMemo(() => {
    const counts: Record<string, number> = {};
    txs.forEach((t) => (counts[t.productName] = (counts[t.productName] || 0) + 1));
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : "-";
  }, [txs]);

  const lowStock = useMemo(() => products.filter((p) => p.stock <= 5).length, [products]);

  return (
  <div className="sd-page">
    {/* WELCOME BAR */}
    <section className="sd-welcome">
      <div>
        <h2 className="sd-welcome__title">Selamat datang, Seller! ??</h2>
        <p className="sd-welcome__desc">Berikut ringkasan performa tokomu hari ini.</p>
      </div>

      <div className="sd-welcome__right">
        <button
          className="sd-btn sd-btn--ghost"
          onClick={() => window.location.reload()}
          type="button"
        >
          ? Refresh
        </button>
      </div>
    </section>

    {/* STATS ROW (like screenshot) */}
    <section className="sd-stats">
      <div className="sd-stat">
        <div className="sd-stat__icon">??</div>
        <div className="sd-stat__meta">
          <div className="sd-stat__label">Orders Hari Ini</div>
          <div className="sd-stat__value">{totalOrders}</div>
          <div className="sd-stat__sub">Total order masuk</div>
        </div>
      </div>

      <div className="sd-stat">
        <div className="sd-stat__icon">??</div>
        <div className="sd-stat__meta">
          <div className="sd-stat__label">Revenue</div>
          <div className="sd-stat__value">{formatCurrency(revenue)}</div>
          <div className="sd-stat__sub">Akumulasi transaksi</div>
        </div>
      </div>

      <div className="sd-stat">
        <div className="sd-stat__icon">??</div>
        <div className="sd-stat__meta">
          <div className="sd-stat__label">Low Stock</div>
          <div className="sd-stat__value">{lowStock}</div>
          <div className="sd-stat__sub">Stok = 5 butuh restock</div>
        </div>
      </div>
    </section>

    {/* MAIN GRID: Chart + Quick Actions (like screenshot) */}
    <section className="sd-grid sd-grid--top">
      {/* REVENUE OVERVIEW */}
      <div className="sd-card">
        <div className="sd-card__head">
          <div className="sd-card__title">?? Revenue Overview</div>
          <div className="sd-tabs">
            <button className="sd-tab sd-tab--active" type="button">7 Hari</button>
            <button className="sd-tab" type="button">30 Hari</button>
            <button className="sd-tab" type="button">1 Tahun</button>
          </div>
        </div>

        <div className="sd-card__body">
          {/* Placeholder chart area (biar mirip layout screenshot) */}
          <div className="sd-chart">
            {loading ? (
              <div className="sd-skeleton sd-skeleton--chart" />
            ) : revenue === 0 ? (
              <div className="sd-empty">
                <div className="sd-empty__icon">??</div>
                <div className="sd-empty__title">Belum ada revenue</div>
                <div className="sd-empty__text">Chart akan muncul setelah ada transaksi.</div>
              </div>
            ) : (
              <div className="sd-empty">
                <div className="sd-empty__icon">?</div>
                <div className="sd-empty__title">Data siap ditampilkan</div>
                <div className="sd-empty__text">
                  (Kalau kamu pakai Chart.js/Recharts, taruh chart di sini.)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="sd-card">
        <div className="sd-card__head">
          <div className="sd-card__title">? Quick Actions</div>
        </div>

        <div className="sd-card__body">
          <div className="sd-actions">
            <Link className="sd-action" href="/dashboard/seller/products">
              <div className="sd-action__icon">??</div>
              <div className="sd-action__label">Kelola Produk</div>
            </Link>

            <Link className="sd-action" href="/dashboard/transactions">
              <div className="sd-action__icon">??</div>
              <div className="sd-action__label">Transaksi</div>
            </Link>

            <Link className="sd-action" href="/dashboard/seller/products">
              <div className="sd-action__icon">?</div>
              <div className="sd-action__label">Tambah Produk</div>
            </Link>

            <a className="sd-action" href="#" onClick={(e)=>e.preventDefault()}>
              <div className="sd-action__icon">?</div>
              <div className="sd-action__label">Promo</div>
            </a>
          </div>

          <div className="sd-actions__cta">
            <Link className="sd-btn sd-btn--primary" href="/dashboard/seller/products">
              + Tambah Produk
            </Link>
            <Link className="sd-btn sd-btn--secondary" href="/dashboard/transactions">
              Lihat Semua
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* BOTTOM GRID: Recent Orders + Menu Populer */}
    <section className="sd-grid sd-grid--bottom">
      {/* RECENT ORDERS */}
      <div className="sd-card">
        <div className="sd-card__head">
          <div className="sd-card__title">?? Recent Orders</div>
          <Link className="sd-link" href="/dashboard/transactions">View All</Link>
        </div>

        <div className="sd-card__body">
          {loading ? (
            <div className="sd-skeleton sd-skeleton--list" />
          ) : txs.length === 0 ? (
            <div className="sd-empty sd-empty--big">
              <div className="sd-empty__icon">??</div>
              <div className="sd-empty__title">Belum Ada Order</div>
              <div className="sd-empty__text">Order baru akan muncul di sini.</div>
            </div>
          ) : (
            <div className="sd-list">
              {txs.slice(0, 6).map((t) => (
                <div key={t.id} className="sd-row">
                  <div className="sd-row__left">
                    <div className="sd-row__title">{t.productName}</div>
                    <div className="sd-row__meta">
                      {new Date(t.createdAt).toLocaleString("id-ID")} - #{t.id.slice(0, 8)}
                    </div>
                  </div>
                  <div className="sd-row__right">{formatCurrency(t.price)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MENU POPULER */}
      <div className="sd-card">
        <div className="sd-card__head">
          <div className="sd-card__title">? Menu Populer</div>
        </div>

        <div className="sd-card__body">
          {loading ? (
            <div className="sd-skeleton sd-skeleton--list" />
          ) : topProduct === "-" ? (
            <div className="sd-empty sd-empty--big">
              <div className="sd-empty__icon">?</div>
              <div className="sd-empty__title">Belum Ada Data</div>
              <div className="sd-empty__text">Data menu populer muncul setelah ada order.</div>
            </div>
          ) : (
            <div className="sd-popular">
              <div className="sd-popular__name">{topProduct}</div>
              <div className="sd-popular__hint">Produk paling sering diorder ??</div>
              <div className="sd-popular__pill">Top Item</div>
            </div>
          )}
        </div>
      </div>
    </section>

    {/* STYLES */}
    <style jsx>{`
      .sd-page {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* overall dark look like screenshot */
      :global(.seller-page),
      .sd-page {
        color: rgba(255,255,255,0.92);
      }

      .sd-welcome {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 16px 18px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(34,197,94,0.85), rgba(6,64,43,0.85));
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow: 0 12px 30px rgba(0,0,0,0.35);
      }
      .sd-welcome__title {
        margin: 0;
        font-weight: 900;
        letter-spacing: -0.02em;
        font-size: 18px;
      }
      .sd-welcome__desc {
        margin: 4px 0 0;
        opacity: 0.85;
        font-size: 12px;
      }

      .sd-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 12px;
        font-weight: 900;
        font-size: 12px;
        border: 1px solid transparent;
        transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
        text-decoration: none;
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
      }
      .sd-btn:hover { transform: translateY(-1px); }
      .sd-btn--primary {
        background: rgba(34,197,94,0.90);
        color: #062d1d;
        border-color: rgba(255,255,255,0.08);
      }
      .sd-btn--secondary {
        background: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.92);
        border-color: rgba(255,255,255,0.14);
      }
      .sd-btn--ghost {
        background: rgba(255,255,255,0.10);
        color: rgba(255,255,255,0.95);
        border-color: rgba(255,255,255,0.14);
      }

      .sd-stats {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .sd-stat {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 14px;
        border-radius: 14px;
        background: rgba(17,24,39,0.75);
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 14px 30px rgba(0,0,0,0.25);
      }
      .sd-stat__icon {
        height: 40px;
        width: 40px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: rgba(34,197,94,0.12);
        border: 1px solid rgba(34,197,94,0.18);
      }
      .sd-stat__label {
        opacity: 0.72;
        font-size: 12px;
        font-weight: 800;
      }
      .sd-stat__value {
        font-size: 18px;
        font-weight: 950;
        letter-spacing: -0.02em;
        margin-top: 2px;
      }
      .sd-stat__sub {
        opacity: 0.62;
        font-size: 11px;
        margin-top: 2px;
      }

      .sd-grid {
        display: grid;
        gap: 14px;
      }
      .sd-grid--top {
        grid-template-columns: 1.65fr 1fr;
      }
      .sd-grid--bottom {
        grid-template-columns: 1.65fr 1fr;
      }

      .sd-card {
        border-radius: 14px;
        background: rgba(17,24,39,0.75);
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 16px 35px rgba(0,0,0,0.28);
        overflow: hidden;
      }
      .sd-card__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .sd-card__title {
        font-weight: 950;
        letter-spacing: -0.02em;
        font-size: 13px;
      }
      .sd-card__body {
        padding: 14px;
      }

      .sd-tabs {
        display: inline-flex;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 12px;
        overflow: hidden;
      }
      .sd-tab {
        padding: 7px 10px;
        font-size: 11px;
        font-weight: 900;
        color: rgba(255,255,255,0.78);
        background: transparent;
        border: 0;
        cursor: pointer;
      }
      .sd-tab--active {
        background: rgba(34,197,94,0.90);
        color: #062d1d;
      }

      .sd-chart {
        height: 260px;
        border-radius: 14px;
        background: rgba(0,0,0,0.15);
        border: 1px solid rgba(255,255,255,0.06);
        display: grid;
        place-items: center;
      }

      .sd-actions {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .sd-action {
        padding: 12px;
        border-radius: 14px;
        text-decoration: none;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.08);
        display: grid;
        justify-items: center;
        gap: 8px;
        transition: transform 120ms ease, background 120ms ease;
        color: rgba(255,255,255,0.9);
      }
      .sd-action:hover {
        transform: translateY(-2px);
        background: rgba(255,255,255,0.08);
      }
      .sd-action__icon {
        height: 34px;
        width: 34px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: rgba(34,197,94,0.12);
        border: 1px solid rgba(34,197,94,0.18);
      }
      .sd-action__label {
        font-size: 11px;
        font-weight: 900;
        opacity: 0.9;
        text-align: center;
      }
      .sd-actions__cta {
        margin-top: 12px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .sd-link {
        font-size: 12px;
        font-weight: 900;
        opacity: 0.75;
        text-decoration: none;
        color: rgba(255,255,255,0.85);
      }
      .sd-link:hover { opacity: 1; }

      .sd-list { display: grid; gap: 10px; }
      .sd-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px;
        border-radius: 14px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.08);
      }
      .sd-row__title {
        font-weight: 950;
        font-size: 12px;
        letter-spacing: -0.01em;
      }
      .sd-row__meta {
        font-size: 11px;
        opacity: 0.68;
        margin-top: 2px;
      }
      .sd-row__right {
        font-weight: 950;
        font-size: 12px;
        white-space: nowrap;
      }

      .sd-popular {
        height: 220px;
        border-radius: 14px;
        background: rgba(0,0,0,0.15);
        border: 1px solid rgba(255,255,255,0.06);
        display: grid;
        place-items: center;
        text-align: center;
        gap: 8px;
      }
      .sd-popular__name {
        font-weight: 950;
        font-size: 14px;
      }
      .sd-popular__hint {
        opacity: 0.75;
        font-size: 12px;
      }
      .sd-popular__pill {
        margin-top: 6px;
        display: inline-flex;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(34,197,94,0.12);
        border: 1px solid rgba(34,197,94,0.18);
        font-size: 11px;
        font-weight: 950;
      }

      .sd-empty {
        display: grid;
        place-items: center;
        gap: 6px;
        text-align: center;
        padding: 14px;
      }
      .sd-empty--big { height: 240px; }
      .sd-empty__icon { font-size: 26px; }
      .sd-empty__title { font-weight: 950; font-size: 13px; }
      .sd-empty__text { opacity: 0.7; font-size: 12px; max-width: 42ch; }

      .sd-skeleton {
        width: 100%;
        border-radius: 14px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.08);
        position: relative;
        overflow: hidden;
      }
      .sd-skeleton::after {
        content: "";
        position: absolute;
        inset: 0;
        transform: translateX(-60%);
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255,255,255,0.10),
          transparent
        );
        animation: shimmer 1.2s infinite;
      }
      .sd-skeleton--chart { height: 260px; }
      .sd-skeleton--list { height: 260px; }

      @keyframes shimmer {
        0% { transform: translateX(-60y%); }
        100% { transform: translateX(60%); }
      }

      @media (max-width: 1024px) {
        .sd-stats { grid-template-columns: 1fr; }
        .sd-grid--top, .sd-grid--bottom { grid-template-columns: 1fr; }
        .sd-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
    `}</style>
  </div>
);
}


function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

