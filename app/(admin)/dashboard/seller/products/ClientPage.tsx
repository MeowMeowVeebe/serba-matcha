"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import AccountShell from "@/components/AccountShell";
import { useAlert } from "@/context/AlertContext";

const isAdminUser = (user: any) => {
  if (!user) return false;
  const norm = (v: any) => (typeof v === "string" ? v.toLowerCase().trim() : "");
  const roleField = norm(user.role);
  if (roleField.includes("admin")) return true;

  const roles = Array.isArray(user.roles) ? user.roles : [];
  return roles.some((r) => {
    if (typeof r === "string") return norm(r).includes("admin");
    if (r && typeof r.name === "string") return norm(r.name).includes("admin");
    return false;
  });
};

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  image: string;
  updatedAt: string;
}

export default function SellerProductsPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  // Client-side guard: only admin role may access.
  useEffect(() => {
    const check = async () => {
      if (isLoading) return;
      if (!user) {
        router.replace("/login?next=/dashboard/seller/products");
        return;
      }
      // force refresh to get latest role from server, bypassing cache
      let effectiveUser = user;
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) effectiveUser = data.user;
        }
      } catch {
        // ignore network errors, fall back to cached user
      }
      const ok = isAdminUser(effectiveUser);
      setAllowed(ok);
      if (!ok) {
        router.replace("/dashboard");
      }
    };
    void check();
  }, [user, isLoading, router]);

  const isAllowed = allowed === null ? null : allowed;

  return (
    <AccountShell
      title="Seller Products"
      description="Kelola katalog produk yang tampil di menu"
      breadcrumbs={[{ label: "Seller" }, { label: "Products" }]}
    >
      {() => (isAllowed ? <SellerProducts /> : <div style={{ padding: 16 }}>Checking access...</div>)}
    </AccountShell>
  );
}

function SellerProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showAlert } = useAlert();
  const [form, setForm] = useState<Omit<Product, "id" | "updatedAt">>({
    name: "",
    price: 25000,
    stock: 10,
    category: "Matcha",
    description: "",
    image: "/matcha-tea.png",
  });

  useEffect(() => {
    fetch("/api/seller/products")
      .then((res) => res.json())
      .then((json) => setProducts(json.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...products].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [products]
  );

  const lowStock = products.filter((p) => p.stock <= 5).length;

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      });
      const json = await res.json();
      if (!json.product) return;
      if (editingId) {
        setProducts((prev) => prev.map((p) => (p.id === editingId ? json.product : p)));
        setEditingId(null);
      } else {
        setProducts((prev) => [json.product, ...prev]);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () =>
    setForm({ name: "", price: 25000, stock: 10, category: "Matcha", description: "", image: "/matcha-tea.png" });

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    const { id, updatedAt, ...rest } = p;
    setForm(rest);
  };

  const remove = async (id: string) => {
    const target = products.find((p) => p.id === id);
    try {
      const res = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error || "Gagal menghapus produk.");
      }
      // Hard refresh from server to be sure DB is in sync
      const refreshed = await fetch("/api/seller/products").then((r) => r.json()).catch(() => null);
      if (refreshed?.products) {
        setProducts(refreshed.products);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }

      if (editingId === id) {
        setEditingId(null);
        resetForm();
      }
      showAlert(`Produk "${target?.name ?? "berhasil"}" dihapus.`, { variant: "info" });
    } catch (e) {
      showAlert(
        e instanceof Error ? e.message : "Tidak bisa menghapus produk. Coba lagi.",
        { variant: "danger" }
      );
    }
  };

  const handleImageFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, image: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="seller-wrap">
      <section className="hero">
        <div>
          <p className="eyebrow">Produk</p>
          <h1>Atur katalogmu dengan cepat</h1>
          <p className="muted">Tambahkan foto asli, harga, dan stok agar tampil menarik di menu.</p>
        </div>
        <div className="hero-stats">
          <span className="pill">Total: {products.length}</span>
          <span className={`pill ${lowStock ? "pill-warn" : ""}`}>Low stock: {lowStock}</span>
        </div>
      </section>

      <div className="layout">
        <div className="card glass">
          <div className="card-head">
            <div>
              <p className="eyebrow">Tambah / Edit</p>
              <h3>{editingId ? "Edit produk" : "Tambah produk"}</h3>
            </div>
            {editingId && <span className="pill">Editing</span>}
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Nama Produk</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Matcha Latte" />
            </label>
            <label className="field">
              <span>Kategori</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {["Matcha", "Coffee", "Food", "Merch"].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Stok</span>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </label>
            <label className="field">
              <span>Harga (IDR)</span>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </label>
            <label className="field full">
              <span>Deskripsi</span>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>

            <div className="field full uploader">
              <div>
                <span>Foto Produk</span>
                <p className="muted">Unggah JPG/PNG atau tempel URL. File disimpan sebagai data URL.</p>
                <input type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0])} />
                <input
                  className="mt-2"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="preview">
                <img src={form.image} alt="Preview" />
              </div>
            </div>
          </div>

          <div className="actions">
            <button className="btn primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Menyimpan..." : editingId ? "Simpan" : "Tambah"}
            </button>
            {editingId && (
              <button className="btn ghost" onClick={() => { setEditingId(null); resetForm(); }} disabled={saving}>
                Batal
              </button>
            )}
          </div>
        </div>

        <div className="card tips">
          <h4>Quick Tips</h4>
          <ul>
            <li>Gunakan foto terang dan bersih.</li>
            <li>Deskripsi singkat + harga jelas.</li>
            <li>Restock saat stok ≤ 5 untuk hindari sold-out.</li>
          </ul>
        </div>
      </div>

      <div className="card list">
        <div className="card-head">
          <div>
            <p className="eyebrow">Products</p>
            <h3>{sorted.length} item tampil</h3>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="skeleton" />
          ) : sorted.length === 0 ? (
            <div className="empty">Belum ada produk. Tambahkan di atas.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Diubah</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-prod">
                        <img src={p.image} alt={p.name} />
                        <div>
                          <div className="cell-title">{p.name}</div>
                          <div className="cell-sub">{p.description.slice(0, 50) || "-"}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>{p.price.toLocaleString("id-ID")}</td>
                    <td className={p.stock <= 5 ? "bad" : ""}>{p.stock}</td>
                    <td>{new Date(p.updatedAt).toLocaleString("id-ID")}</td>
                    <td className="cell-actions">
                      <button className="btn ghost sm" onClick={() => startEdit(p)}>Edit</button>
                      <button className="btn danger sm" onClick={() => remove(p.id)}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style jsx>{`
        .seller-wrap { display: flex; flex-direction: column; gap: 16px; }
        .hero {
          padding: 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, #0c3b2e, #0e6b44);
          color: #f5fff7;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }
        .hero h1 { margin: 4px 0; font-size: 22px; font-weight: 900; }
        .muted { opacity: 0.75; font-size: 13px; }
        .hero-stats { display: flex; gap: 8px; flex-wrap: wrap; }
        .pill { padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); font-size: 12px; }
        .pill-warn { background: rgba(255,180,80,0.18); border-color: rgba(255,180,80,0.35); }

        .layout { display: grid; gap: 16px; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
        .card { background: #0f1914; border: 1px solid #1f2d24; border-radius: 14px; padding: 14px; color: #e8f3eb; }
        .glass { background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.05); }
        .tips { background: #10231a; border: 1px dashed #1f8a5a; }
        .tips ul { margin: 8px 0 0; padding-left: 18px; line-height: 1.5; color: #cfe8db; font-size: 13px; }

        .card-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin-bottom: 12px; }
        .eyebrow { margin: 0; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.7; }
        h3 { margin: 2px 0 0; }

        .form-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field input, .field textarea { background: #0b1611; border: 1px solid #1f2d24; border-radius: 10px; padding: 10px 12px; color: #e8f3eb; outline: none; }
        .field textarea { resize: vertical; }
        .field select { background: #0b1611; border: 1px solid #1f2d24; border-radius: 10px; padding: 10px 12px; color: #e8f3eb; outline: none; }
        .full { grid-column: 1 / -1; }

        .uploader { display: grid; gap: 10px; grid-template-columns: 1fr 150px; align-items: center; }
        .preview { height: 150px; width: 150px; border-radius: 12px; border: 1px solid #1f2d24; background: #0b1611; overflow: hidden; }
        .preview img { width: 100%; height: 100%; object-fit: cover; }

        .actions { margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap; }
        .btn { border-radius: 10px; border: 1px solid transparent; padding: 10px 14px; font-weight: 800; cursor: pointer; }
        .btn.primary { background: linear-gradient(135deg, #16a34a, #0ea568); color: white; }
        .btn.ghost { background: transparent; border-color: #284236; color: #e8f3eb; }
        .btn.danger { background: #b91c1c; color: white; }
        .btn.sm { padding: 6px 10px; font-size: 12px; }

        .list { margin-top: 4px; }
        .table-wrap { overflow-x: auto; }
        .table { width: 100%; min-width: 720px; border-collapse: collapse; }
        .table th, .table td { padding: 10px; border-bottom: 1px solid #1f2d24; text-align: left; }
        .table th { font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; opacity: 0.7; }
        .cell-prod { display: flex; gap: 10px; align-items: center; }
        .cell-prod img { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; }
        .cell-title { font-weight: 800; }
        .cell-sub { font-size: 12px; opacity: 0.65; }
        .cell-actions { display: flex; gap: 6px; }
        .bad { color: #f87171; font-weight: 800; }
        .skeleton { height: 200px; border-radius: 12px; background: linear-gradient(90deg, #0f1914 25%, #1a2a21 50%, #0f1914 75%); background-size: 200% 100%; animation: shimmer 1.2s ease-in-out infinite; }
        .empty { padding: 16px; border: 1px dashed #284236; border-radius: 12px; text-align: center; opacity: 0.8; }

        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .uploader { grid-template-columns: 1fr; } .hero { flex-direction: column; } }
      `}</style>
    </div>
  );
}
