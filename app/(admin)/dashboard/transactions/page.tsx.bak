"use client";

import AccountShell from "@/components/AccountShell";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
};

type Tx = {
  id: string;
  productId: string | null;
  productName: string;
  price: number;
  createdAt: string;
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

        <div className="table-wrap">
          {txs.length === 0 ? (
            <div className="empty">Belum ada transaksi. Mulai belanja di menu.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Harga</th>
                  <th>Tanggal</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id}>
                    <td>{productName(t.productId, t.productName)}</td>
                    <td>{t.price.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}</td>
                    <td>{new Date(t.createdAt).toLocaleString("id-ID")}</td>
                    <td className="muted text-xs">#{t.id.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
        .table-wrap {
          overflow-x: auto;
        }
        .table {
          width: 100%;
          min-width: 700px;
          border-collapse: collapse;
        }
        .table th,
        .table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #1f2d24;
        }
        .table th {
          font-size: 12px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          opacity: 0.7;
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
