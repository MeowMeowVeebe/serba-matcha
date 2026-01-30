"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import AccountShell from "@/components/AccountShell";
import { useAlert } from "@/context/AlertContext";

const isSeller = (user: any) => {
  if (!user) return false;
  const norm = (v: any) => (typeof v === "string" ? v.toLowerCase().trim() : "");
  const roleField = norm(user.role);
  if (roleField.includes("penjual") || roleField.includes("seller")) return true;

  const roles = Array.isArray(user.roles) ? user.roles : [];
  return roles.some((r: any) => {
    const name = typeof r === "string" ? norm(r) : norm(r?.name);
    return name.includes("penjual") || name.includes("seller");
  });
};

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  image: string;
  updatedAt: string;
  sold?: number;
}

const CATEGORIES = [
  { value: "Cold Matcha", label: "Cold Matcha", icon: "🧊", defaultPrice: 10000 },
  { value: "Hot Matcha", label: "Hot Matcha", icon: "☕", defaultPrice: 15000 },
];

export default function SellerProductsPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      if (isLoading) return;
      if (!user) {
        router.replace("/dashboard/login?next=/dashboard/seller/products");
        return;
      }
      let effectiveUser = user;
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) effectiveUser = data.user;
        }
      } catch {
        // ignore
      }
      const ok = isSeller(effectiveUser);
      setAllowed(ok);
      if (!ok) {
        router.replace("/dashboard/home");
      }
    };
    void check();
  }, [user, isLoading, router]);

  return (
    <AccountShell
      title="Manage Products"
      description="Manage product catalog"
      breadcrumbs={[{ label: "Seller" }, { label: "Products" }]}
    >
      {() => (allowed ? (
        <Suspense fallback={<LoadingState />}>
          <SellerProducts />
        </Suspense>
      ) : <LoadingState />)}
    </AccountShell>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(34,197,94,0.2)", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Memeriksa akses...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function SellerProducts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { showAlert } = useAlert();
  
  const [form, setForm] = useState<Omit<Product, "id" | "updatedAt">>({
    name: "",
    price: 10000,
    stock: 0,
    category: "Cold Matcha",
    description: "",
    image: "",
  });
  const [fileName, setFileName] = useState<string>("");
  const [priceDisplay, setPriceDisplay] = useState<string>("10.000");
  const [imageLoading, setImageLoading] = useState(false);
const [validationErrors, setValidationErrors] = useState<{ name?: boolean; price?: boolean; stock?: boolean; image?: boolean; description?: boolean }>({});

  // Format number with thousand separator
  const formatNumber = (num: number) => num.toLocaleString("id-ID");
  const parseNumber = (str: string) => parseInt(str.replace(/\./g, ""), 10) || 0;

  // Check if ?add=true is in URL to auto-open form
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setShowForm(true);
      // Clean up URL
      router.replace("/dashboard/seller/products", { scroll: false });
    }
  }, [searchParams, router]);

  // Fetch products function
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/seller/products", { cache: "no-store" });
      const json = await res.json();
      setProducts(json.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and real-time polling every 10 seconds
  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return products
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [products, searchQuery]);

  const stats = useMemo(() => ({
    total: products.length,
    sold: products.reduce((acc, p) => acc + (p.sold || 0), 0),
  }), [products]);

  const handleSubmit = async () => {
    // Validate all fields
    const errors: { name?: boolean; price?: boolean; stock?: boolean; image?: boolean; description?: boolean } = {};
    if (!form.name.trim()) errors.name = true;
    if (form.price <= 0) errors.price = true;
    if (form.stock <= 0) errors.stock = true;
    if (!form.description.trim()) errors.description = true;
    if (!form.image) errors.image = true;
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      const errorMessages = [];
      if (errors.name) errorMessages.push("Product name");
      if (errors.price) errorMessages.push("Price");
      if (errors.stock) errorMessages.push("Stock");
      if (errors.description) errorMessages.push("Description");
      if (errors.image) errorMessages.push("Product photo");
      showAlert(`Please fill in: ${errorMessages.join(", ")}`, { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      });
      
      // Handle response
      if (!res.ok) {
        if (res.status === 413 || res.status === 500) {
          throw new Error("Image too large. Please use a smaller image.");
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || `Server error (${res.status})`);
      }
      
      const json = await res.json();
      if (!json.product) {
        throw new Error(json.error || "Failed to save product");
      }
      if (editingId) {
        setProducts((prev) => prev.map((p) => (p.id === editingId ? json.product : p)));
        showAlert("Product updated successfully!", { variant: "success" });
      } else {
        setProducts((prev) => [json.product, ...prev]);
        showAlert("Product added successfully!", { variant: "success" });
      }
      resetForm();
      setShowForm(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save product";
      showAlert(message, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", price: 10000, stock: 0, category: "Cold Matcha", description: "", image: "" });
    setPriceDisplay("10.000");
    setFileName("");
    setValidationErrors({});
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    const { id, updatedAt, ...rest } = p;
    setForm(rest);
    setPriceDisplay(formatNumber(p.price));
    setFileName(p.image ? p.image.split('/').pop() || 'image' : '');
    setShowForm(true);
  };

  const remove = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!confirm(`Delete product "${target?.name}"?`)) return;
    
    try {
      const res = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error || "Failed to delete product.");
      }
      const refreshed = await fetch("/api/seller/products").then((r) => r.json()).catch(() => null);
      if (refreshed?.products) {
        setProducts(refreshed.products);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
      if (editingId === id) resetForm();
      showAlert(`Product "${target?.name}" deleted successfully`, { variant: "success" });
    } catch (e) {
      showAlert(e instanceof Error ? e.message : "Unable to delete product", { variant: "error" });
    }
  };

  // Compress image before upload
  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // Scale down if larger than maxWidth
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with compression
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageFile = (file?: File) => {
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showAlert('Please select a valid image file.', { variant: 'error' });
      return;
    }
    
    setFileName(file.name);
    setImageLoading(true);
    
    // Compress image on client-side before upload
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        showAlert('Failed to read image file.', { variant: 'error' });
        setFileName('');
        setImageLoading(false);
        return;
      }
      
      // Compress using canvas
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
      setForm((prev) => ({ ...prev, image: compressed }));
          setValidationErrors((prev) => ({ ...prev, image: false }));
        } else {
          setForm((prev) => ({ ...prev, image: dataUrl }));
          setValidationErrors((prev) => ({ ...prev, image: false }));
        }
        setImageLoading(false);
      };
      img.onerror = () => {
        showAlert('Failed to process image.', { variant: 'error' });
        setFileName('');
        setImageLoading(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      showAlert('Failed to read image file.', { variant: 'error' });
      setFileName('');
      setImageLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {[
          { label: "Total Products", value: stats.total, color: "#3b82f6" },
          { label: "Sold", value: stats.sold, color: stats.sold > 0 ? "#22c55e" : "#6b7280" },
        ].map((stat, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</p>
            <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Hide number input spinners */}
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Add Product Button - only show when products exist */}
      {products.length > 0 && (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", borderRadius: 10, background: "linear-gradient(135deg, #166534, #15803d)", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Product
        </button>
      )}

      {/* Form Modal/Section */}
      {showForm && (
        <div style={{ background: "rgba(17,24,39,0.95)", backdropFilter: "blur(8px)", borderRadius: 16, border: "1px solid rgba(55,65,81,0.5)", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(156,163,175,1)" }}>Fill in complete product information</p>
            </div>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              style={{ padding: 8, background: "transparent", border: "none", borderRadius: 8, cursor: "pointer" }}
            >
              <svg width="20" height="20" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            {/* Form Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#d1d5db", marginBottom: 6 }}>Product Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Auto capitalize first letter
                    if (value.length === 1) {
                      value = value.charAt(0).toUpperCase();
                    } else if (value.length > 0 && form.name.length === 0) {
                      value = value.charAt(0).toUpperCase() + value.slice(1);
                    }
                    setForm({ ...form, name: value });
                    if (value.trim()) setValidationErrors((prev) => ({ ...prev, name: false }));
                  }}
                  placeholder="Contoh: Iced Matcha Latte"
                  style={{ width: "100%", background: "#1f2937", border: validationErrors.name ? "2px solid #ef4444" : "1px solid #374151", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#d1d5db", marginBottom: 6 }}>Category</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, category: cat.value, price: cat.defaultPrice });
                        setPriceDisplay(formatNumber(cat.defaultPrice));
                      }}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: form.category === cat.value ? "2px solid #16a34a" : "1px solid #374151",
                        background: form.category === cat.value ? "rgba(22,163,74,0.15)" : "#1f2937",
                        color: form.category === cat.value ? "#4ade80" : "#d1d5db",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock & Price */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#d1d5db", marginBottom: 6 }}>Stock *</label>
                  <div style={{ display: "flex", alignItems: "center", background: "#1f2937", border: validationErrors.stock ? "2px solid #ef4444" : "1px solid #374151", borderRadius: 10, overflow: "hidden" }}>
                    <button
                      type="button"
                      onClick={() => {
                        const newStock = Math.max(0, form.stock - 1);
                        setForm({ ...form, stock: newStock });
                        if (newStock > 0) setValidationErrors((prev) => ({ ...prev, stock: false }));
                      }}
                      style={{ width: 44, height: 48, background: "transparent", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >−</button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.stock}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        const newStock = raw === "" ? 0 : parseInt(raw, 10);
                        setForm({ ...form, stock: newStock });
                        if (newStock > 0) setValidationErrors((prev) => ({ ...prev, stock: false }));
                      }}
                      style={{ flex: 1, background: "transparent", border: "none", borderLeft: "1px solid #374151", borderRight: "1px solid #374151", padding: "12px 8px", color: "#fff", fontSize: 14, textAlign: "center", outline: "none", boxSizing: "border-box" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newStock = form.stock + 1;
                        setForm({ ...form, stock: newStock });
                        setValidationErrors((prev) => ({ ...prev, stock: false }));
                      }}
                      style={{ width: 44, height: 48, background: "transparent", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >+</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#d1d5db", marginBottom: 6 }}>Price *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: 14, fontWeight: 500 }}>Rp</span>
                    <input
                      type="text"
                      value={priceDisplay}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        const num = parseInt(raw, 10) || 0;
                        setForm({ ...form, price: num });
                        setPriceDisplay(num > 0 ? formatNumber(num) : "");
                        if (num > 0) setValidationErrors((prev) => ({ ...prev, price: false }));
                      }}
                      placeholder="0"
                      style={{ width: "100%", background: "#1f2937", border: validationErrors.price ? "2px solid #ef4444" : "1px solid #374151", borderRadius: 10, padding: "12px 16px 12px 42px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#d1d5db", marginBottom: 6 }}>Description *</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Auto capitalize first letter
                    if (value.length === 1) {
                      value = value.charAt(0).toUpperCase();
                    } else if (value.length > 0 && form.description.length === 0) {
                      value = value.charAt(0).toUpperCase() + value.slice(1);
                    }
                    setForm({ ...form, description: value });
                    if (value.trim()) setValidationErrors((prev) => ({ ...prev, description: false }));
                  }}
                  placeholder="Short product description..."
                  style={{ width: "100%", background: "#1f2937", border: validationErrors.description ? "2px solid #ef4444" : "1px solid #374151", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#d1d5db", marginBottom: 6 }}>Product Photo</label>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  {/* Preview */}
                  <div style={{ 
                    width: 120, 
                    height: 120, 
                    background: "linear-gradient(135deg, #1f2937, #111827)", 
                    borderRadius: 12, 
                    border: validationErrors.image ? "2px solid #ef4444" : form.image ? "2px solid #16a34a" : "2px dashed #374151", 
                    overflow: "hidden", 
                    flexShrink: 0, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    position: "relative"
                  }}>
                    {form.image ? (
                      <img src={form.image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <svg width="32" height="32" fill="none" stroke="#4b5563" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span style={{ fontSize: 11, color: "#6b7280" }}>No image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Controls */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Upload Button */}
                    <label style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      gap: 8, 
                      padding: "12px 20px", 
                      borderRadius: 10, 
                      background: imageLoading ? "#374151" : "linear-gradient(135deg, #374151, #1f2937)", 
                      border: "1px solid #4b5563", 
                      color: "#d1d5db", 
                      fontSize: 14, 
                      fontWeight: 500, 
                      cursor: imageLoading ? "wait" : "pointer",
                      transition: "all 0.2s ease",
                      alignSelf: "flex-start",
                      opacity: imageLoading ? 0.7 : 1
                    }}>
                      {imageLoading ? (
                        <>
                          <div style={{ width: 18, height: 18, border: "2px solid #6b7280", borderTopColor: "#d1d5db", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Choose File
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          handleImageFile(e.target.files?.[0]);
                          // Reset input so same file can be selected again
                          e.target.value = '';
                        }}
                        style={{ display: "none" }}
                        disabled={imageLoading}
                      />
                    </label>
                    
                    {/* File Name Display */}
                    {fileName && !imageLoading && (
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 8, 
                        padding: "10px 14px", 
                        background: form.image ? "rgba(22,163,74,0.1)" : "rgba(234,179,8,0.1)", 
                        border: form.image ? "1px solid rgba(22,163,74,0.3)" : "1px solid rgba(234,179,8,0.3)", 
                        borderRadius: 8 
                      }}>
                        {form.image ? (
                          <svg width="16" height="16" fill="none" stroke="#4ade80" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div style={{ width: 16, height: 16, border: "2px solid #eab308", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        )}
                        <span style={{ fontSize: 13, color: form.image ? "#4ade80" : "#eab308", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {fileName}
                        </span>
                      </div>
                    )}
                    
                    {/* Help Text */}
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                      Supported: JPG, PNG, GIF (max 10MB)
                    </p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", gap: 12, marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(55,65,81,0.5)" }}>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              disabled={saving}
              style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #4b5563", background: "transparent", color: "#d1d5db", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.5 : 1 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.5 : 1 }}
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ background: "rgba(17,24,39,0.8)", borderRadius: 12, border: "1px solid rgba(55,65,81,0.5)", padding: 16 }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 18, height: 18 }} fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            style={{ width: "100%", background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: "10px 16px 10px 40px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: "rgba(17,24,39,0.8)", borderRadius: 12, padding: 16 }}>
              <div style={{ aspectRatio: "1/1", background: "#1f2937", borderRadius: 8, marginBottom: 12 }} />
              <div style={{ height: 16, background: "#1f2937", borderRadius: 4, width: "75%", marginBottom: 8 }} />
              <div style={{ height: 12, background: "#1f2937", borderRadius: 4, width: "50%" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "rgba(17,24,39,0.8)", borderRadius: 12, border: "1px solid rgba(55,65,81,0.5)", padding: 48, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "#1f2937", borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="32" height="32" fill="none" stroke="#4b5563" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: "#fff" }}>No products yet</h3>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#9ca3af" }}>
            {searchQuery ? "No products match search" : "Start by adding your first product"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#16a34a", color: "#fff", padding: "10px 20px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Product
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {filtered.map((product) => (
            <div
              key={product.id}
              style={{ background: "rgba(17,24,39,0.8)", borderRadius: 12, border: "1px solid rgba(55,65,81,0.5)", overflow: "hidden" }}
            >
              {/* Product Image */}
              <div style={{ position: "relative", aspectRatio: "1/1", background: "linear-gradient(135deg, #1f2937, #111827)", overflow: "hidden" }}>
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: 16 }}
                />
                
                {/* Stock Badge */}
                <div style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: product.stock === 0 ? "rgba(239,68,68,0.9)" : product.stock <= 5 ? "rgba(234,179,8,0.9)" : "rgba(34,197,94,0.9)",
                  color: product.stock <= 5 && product.stock !== 0 ? "#000" : "#fff"
                }}>
                  {product.stock === 0 ? "Out of Stock" : `Stock: ${product.stock}`}
                </div>

                {/* Category Badge */}
                <div style={{ position: "absolute", top: 8, right: 8, padding: "4px 8px", borderRadius: 6, background: "rgba(17,24,39,0.8)", fontSize: 11, color: "#d1d5db" }}>
                  {CATEGORIES.find(c => c.value === product.category)?.icon} {product.category}
                </div>

                {/* Quick Actions */}
                <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 8 }}>
                  <button
                    onClick={() => startEdit(product)}
                    style={{ padding: 8, background: "#3b82f6", border: "none", borderRadius: 8, cursor: "pointer" }}
                    title="Edit"
                  >
                    <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => remove(product.id)}
                    style={{ padding: 8, background: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer" }}
                    title="Delete"
                  >
                    <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div style={{ padding: 16 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</h3>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#9ca3af", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, minHeight: 40 }}>
                  {product.description || "No description"}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#4ade80" }}>
                    Rp {product.price.toLocaleString("id-ID")}
                  </span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    {new Date(product.updatedAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
