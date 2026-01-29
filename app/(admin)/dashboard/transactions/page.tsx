"use client";

import AccountShell from "@/components/AccountShell";
import Image from "next/image";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
};

type Tx = {
  id: string;
  orderId?: string | null;
  productId: string | null;
  productName: string;
  price: number;
  grossAmount?: number | null;
  shippingCost?: number | null;
  status?: string | null;
  snapRedirectUrl?: string | null;
  createdAt: string;
  items?: Array<{
    productId?: string | null;
    name: string;
    price: number;
    qty: number;
    image?: string;
    category?: string;
  }> | null;
};

export default function TransactionsPage() {
  return (
    <AccountShell
      title="Transactions"
      description="Pembelian yang pernah kamu lakukan"
      breadcrumbs={[{ label: "Transactions" }]}
    >
      {() => <TransactionsContent />}
    </AccountShell>
  );
}

function TransactionsContent() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([fetch("/api/transactions"), fetch("/api/seller/products")])
      .then(async ([tRes, pRes]) => {
        const tJson = await tRes.json();
        const pJson = await pRes.json();
        setTxs(tJson.transactions || []);
        setProducts((pJson.products || []).map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, []);

  const productName = (id: string | null, fallback: string) => {
    if (!id) return fallback;
    const p = products.find((x) => x.id === id);
    return p?.name ?? fallback;
  };

  return (
    <div className="tx-page">
      <section className="tx-hero">
        <div>
          <p className="eyebrow">Riwayat</p>
          <h1>Transaksi Kamu</h1>
          <p className="muted">Semua pembelian dari menu dan produk penjual.</p>
        </div>
        <div className="pill">{txs.length} transaksi</div>
      </section>

      <div className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Daftar</p>
            <h3>Riwayat Transaksi</h3>
          </div>
        </div>

        {txs.length === 0 ? (
          <div className="empty">Belum ada transaksi. Mulai belanja di menu.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {txs.map((t) => {
              const total = t.grossAmount ?? t.price;
              const items = t.items ?? [];
              return (
                <div key={t.id} className="tx-card">
                  <div className="tx-card-head">
                    <div>
                      <p className="muted text-xs">Order</p>
                      <div className="font-semibold text-green-50">{productName(t.productId, t.productName)}</div>
                      <div className="muted text-[11px]">#{t.orderId ?? t.id.slice(0, 8)}</div>
                    </div>
                    <div className={`status ${t.status ?? "pending"}`}>{(t.status ?? "pending").replace(/_/g, " ")}</div>
                  </div>

                  <div className="tx-items">
                    {items.length === 0 && (
                      <div className="muted text-xs">Detail item belum tersedia.</div>
                    )}
                    {items.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="tx-item">
                        <div className="thumb">
                          <Image
                            src={item.image || "/logo/serbamatcha.png"}
                            alt={item.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="tx-item-meta">
                          <div className="tx-item-name">{item.name}</div>
                          <div className="muted text-xs">{item.qty} × Rp {item.price.toLocaleString("id-ID")}</div>
                        </div>
                        <div className="tx-item-total">
                          Rp {(item.price * item.qty).toLocaleString("id-ID")}
                        </div>
                      </div>
                    ))}
                    {items.length > 4 && (
                      <div className="muted text-xs">+{items.length - 4} item lain</div>
                    )}
                  </div>

                  <div className="tx-footer">
                    <div>
                      <p className="muted text-xs">Tanggal</p>
                      <p className="font-semibold text-green-50">{new Date(t.createdAt).toLocaleString("id-ID")}</p>
                    </div>
                    <div className="text-right">
                      <p className="muted text-xs">Total</p>
                      <p className="font-semibold text-green-50">
                        Rp {total.toLocaleString("id-ID")}
                      </p>
                      {t.shippingCost ? (
                        <p className="muted text-[11px]">Termasuk ongkir Rp {t.shippingCost.toLocaleString("id-ID")}</p>
                      ) : null}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .tx-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .tx-hero {
          background: linear-gradient(135deg, #0c3b2e, #0e6b44);
          color: #f5fff7;
          padding: 18px;
          border-radius: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        h1 {
          margin: 4px 0;
          font-size: 22px;
          font-weight: 900;
        }
        .muted {
          opacity: 0.75;
          font-size: 13px;
        }
        .eyebrow {
          margin: 0;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.7;
        }
        .pill {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.25);
          font-size: 12px;
        }
        .card {
          background: #0f1914;
          border: 1px solid #1f2d24;
          border-radius: 14px;
          padding: 14px;
          color: #e8f3eb;
        }
        .card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .tx-card {
          background: #0f1914;
          border: 1px solid #1f2d24;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.22);
        }
        .tx-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .tx-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid #1f2d24;
          border-radius: 12px;
          padding: 10px;
        }
        .tx-item {
          display: grid;
          grid-template-columns: 48px 1fr auto;
          align-items: center;
          gap: 8px;
        }
        .thumb {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 10px;
          overflow: hidden;
          background: #10241b;
          border: 1px solid #1f2d24;
        }
        .tx-item-meta {
          min-width: 0;
        }
        .tx-item-name {
          font-weight: 700;
          color: #e8f3eb;
          font-size: 14px;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .tx-item-total {
          font-weight: 700;
          color: #c7f2d6;
          font-size: 13px;
          white-space: nowrap;
        }
        .tx-footer {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }
        .status {
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 12px;
          text-transform: capitalize;
          border: 1px solid #2a3b30;
          background: rgba(12, 59, 46, 0.2);
        }
        .status.settled,
        .status.success {
          border-color: #1b8f5a;
          background: rgba(27, 143, 90, 0.2);
          color: #aef3cd;
        }
        .status.pending {
          border-color: #4b5c50;
          background: rgba(75, 92, 80, 0.35);
          color: #d1e0d6;
        }
        .status.failed,
        .status.cancelled {
          border-color: #d85b66;
          background: rgba(216, 91, 102, 0.2);
          color: #f7c7cc;
        }
        .link {
          color: #aef3cd;
          font-weight: 600;
        }
        .empty {
          padding: 16px;
          border: 1px dashed #284236;
          border-radius: 12px;
          text-align: center;
          opacity: 0.8;
        }
        @media (max-width: 900px) {
          .tx-hero {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
