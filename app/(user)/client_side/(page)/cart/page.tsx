"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  image: string;
};

type CartLine = {
  productId: string;
  qty: number;
  snapshot?: { name: string; price: number; image: string; category: string };
};

const readCartSafe = (): CartLine[] => {
  try {
    const raw = JSON.parse(localStorage.getItem("cart-items") || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

export default function CartPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [shipping, setShipping] = useState<"pickup" | "express" | "standard">("standard");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cartHydrated, setCartHydrated] = useState(false);

  // Load products and cart
  useEffect(() => {
    const loadCart = () => {
      setCart(readCartSafe());
    };
    loadCart();
    setCartHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "cart-items") loadCart();
    };
    const onCartUpdated = () => loadCart();
    window.addEventListener("storage", onStorage);
    window.addEventListener("cart-updated", onCartUpdated);

    fetch("/api/seller/products")
      .then((res) => res.json())
      .then((json) => setProducts(json.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart-updated", onCartUpdated);
    };
  }, []);

  // Persist cart
  useEffect(() => {
    if (!cartHydrated) return;
    localStorage.setItem("cart-items", JSON.stringify(cart));
  }, [cart, cartHydrated]);

  const itemsDetailed = useMemo(() => {
    return cart
      .map((line) => {
        const p = products.find((x) => x.id === line.productId);
        if (p) return { ...p, qty: line.qty };
        if (line.snapshot) {
          return {
            id: line.productId,
            stock: 0,
            description: "",
            ...line.snapshot,
            qty: line.qty,
          };
        }
        return {
          id: line.productId,
          name: "Produk tidak tersedia",
          price: 0,
          stock: 0,
          category: "-",
          description: "",
          image: "/logo/serbamatcha.png",
          qty: line.qty,
        } as Product & { qty: number };
      });
  }, [cart, products]);

  const subtotal = useMemo(() => itemsDetailed.reduce((sum, i) => sum + i.price * i.qty, 0), [itemsDetailed]);
  const shippingCost = shipping === "pickup" ? 0 : shipping === "express" ? 15000 : 8000;
  const total = subtotal + shippingCost;

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => (line.productId === id ? { ...line, qty: Math.max(1, line.qty + delta) } : line))
        .filter((line) => line.qty > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((line) => line.productId !== id));
  };

  const handleCheckout = async () => {
    if (itemsDetailed.length === 0) return;
    setCheckingOut(true);
    try {
      await Promise.all(
        itemsDetailed.map((item) =>
          fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: item.id, productName: item.name, price: item.price }),
          })
        )
      );
      setCart([]);
      localStorage.setItem("cart-items", "[]");
      alert("Checkout berhasil! Terima kasih.");
    } catch (e) {
      alert("Checkout gagal. Coba lagi.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F1EC] pb-16 pt-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
        <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-black/5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-green-800/60">Your Cart</p>
              <h1 className="text-3xl font-bold text-green-900">Ready to checkout?</h1>
              <p className="text-green-800/70">Secure payment, quick pickup, and handcrafted drinks.</p>
            </div>
            <Link
              href="/client_side/menu"
              className="rounded-full bg-[#0C3B2E] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#127246] transition"
            >
              Continue shopping
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-4">
            {loading ? (
              <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5">Loading...</div>
            ) : itemsDetailed.map((item) => (
              <article
                key={item.id}
                className="flex gap-4 rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5 md:items-center"
              >
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-green-50">
                  <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">{item.name}</h3>
                      <p className="text-sm text-green-800/70">Kategori: {item.category}</p>
                      {item.stock <= 0 && <p className="text-xs text-red-600">Stok habis</p>}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 rounded-full border border-green-200 bg-green-50 px-3 py-2">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="h-7 w-7 rounded-full bg-white text-green-900 shadow hover:bg-green-100"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-semibold text-green-900">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="h-7 w-7 rounded-full bg-white text-green-900 shadow hover:bg-green-100"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.12em] text-green-800/60">Price</p>
                      <p className="text-lg font-semibold text-green-900">
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {!loading && itemsDetailed.length === 0 && (
              <div className="rounded-2xl border border-dashed border-green-200 bg-white p-8 text-center text-green-800">
                Cart is empty. <Link href="/client_side/menu" className="font-semibold text-green-900 underline">Browse menu</Link>
              </div>
            )}
          </section>

          <aside className="space-y-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5">
            <h2 className="text-xl font-semibold text-green-900">Order summary</h2>

            <div className="space-y-3 text-sm text-green-900/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? "Pickup (Free)" : `Rp ${shippingCost.toLocaleString("id-ID")}`}</span>
              </div>
              <div className="flex justify-between font-semibold text-green-900">
                <span>Total</span>
                <span>Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900/80">
              <p className="font-semibold text-green-900">Fulfillment</p>
              <div className="mt-2 grid gap-2">
                {(["pickup", "standard", "express"] as const).map((opt) => (
                  <label
                    key={opt}
                    className={[
                      "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition",
                      shipping === opt ? "border-[#0C3B2E] bg-white shadow-sm" : "border-green-100",
                    ].join(" ")}
                  >
                    <span className="capitalize">{opt}</span>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shipping === opt}
                      onChange={() => setShipping(opt)}
                      className="accent-[#0C3B2E]"
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut || itemsDetailed.length === 0}
              className="w-full rounded-full bg-[#0C3B2E] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#127246] disabled:opacity-60"
            >
              {checkingOut ? "Processing..." : "Proceed to Checkout"}
            </button>

            <p className="text-xs text-green-800/70">Secure payments powered by your favorite wallets.</p>
          </aside>
        </div>

        {!loading && products.length > 0 && (
          <section className="rounded-3xl bg-white p-5 shadow-lg ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-900">Recommended for you</h3>
              <Link href="/client_side/menu" className="text-sm font-semibold text-[#0C3B2E] hover:underline">
                See full menu
              </Link>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {products.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50/50 p-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                    <Image src={p.image} alt={p.name} fill className="object-contain p-2" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900">{p.name}</p>
                    <p className="text-xs text-green-800/70">Rp {p.price.toLocaleString("id-ID")}</p>
                  </div>
                  <button
                    className="text-sm font-semibold text-[#0C3B2E]"
                    onClick={() => setCart((prev) => {
                      const found = prev.find((line) => line.productId === p.id);
                      if (found) return prev.map((line) => line.productId === p.id ? { ...line, qty: line.qty + 1 } : line);
                      return [...prev, { productId: p.id, qty: 1 }];
                    })}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
