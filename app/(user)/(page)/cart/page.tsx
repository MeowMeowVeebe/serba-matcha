"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/components/ui/GlobalConfirmDialog";
import { useUser } from "@/lib/hooks/useUser";

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

const cartKey = (userId?: string | null) => (userId ? `cart-items-${userId}` : "cart-items-guest");

const readCartSafe = (key: string): CartLine[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const ShippingIcons = {
  pickup: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  standard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  express: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

export default function CartPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [shipping, setShipping] = useState<"pickup" | "express" | "standard">("standard");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { showAlert } = useAlert();
  const { alert } = useConfirm();

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      const nextPath = typeof window !== "undefined" ? window.location.pathname : "/cart";
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    
    // Check if user is seller - sellers cannot access cart page
    const isSeller = user.roles?.some((r) => r.toLowerCase() === "seller" || r.toLowerCase() === "penjual") ?? false;
    if (isSeller) {
      // Show 404 by redirecting to a non-existent route
      router.replace("/404");
      return;
    }
    
    setAuthChecked(true);
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!authChecked && !user) return;
    const key = cartKey(user?.id);
    const loadCart = () => setCart(readCartSafe(key));
    loadCart();
    setCartHydrated(true);

    const onStorage = (e: StorageEvent) => { if (e.key === key) loadCart(); };
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
  }, [authChecked, user]);

  useEffect(() => {
    if (!cartHydrated) return;
    const key = cartKey(user?.id);
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, cartHydrated, user?.id]);

  const itemsDetailed = useMemo(() => {
    return cart.map((line) => {
      const p = products.find((x) => x.id === line.productId);
      if (p) return { ...p, qty: line.qty };
      if (line.snapshot) {
        return { id: line.productId, stock: 0, description: "", ...line.snapshot, qty: line.qty };
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
      prev.map((line) => (line.productId === id ? { ...line, qty: Math.max(1, line.qty + delta) } : line)).filter((line) => line.qty > 0)
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((line) => line.productId !== id));

  const ensureLoggedIn = async () => {
    if (user) return true;
    if (userLoading) return false;
    await alert({
      title: "Perlu login",
      message: "Silakan login terlebih dahulu untuk checkout.",
      variant: "warning",
      confirmText: "Ke halaman login",
    });
    const next = typeof window !== "undefined" ? window.location.pathname : "/cart";
    router.push(`/login?next=${encodeURIComponent(next)}`);
    return false;
  };

  const handleCheckout = async () => {
    const validItems = itemsDetailed.filter((item) => item.price > 0 && item.qty > 0);
    if (validItems.length === 0) {
      await alert({
        title: "Tidak ada item valid",
        message: "Keranjang Anda kosong atau semua item tidak tersedia.",
        variant: "warning",
        confirmText: "OK",
      });
      return;
    }
    if (!(await ensureLoggedIn())) return;
    setCheckingOut(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: Include cookies for authentication
        body: JSON.stringify({
          items: validItems.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            image: item.image,
            category: item.category,
          })),
          shippingCost,
          shippingMethod: shipping,
          customer: { name: user?.name || "Guest" },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to process order.");

      const key = cartKey(user?.id);
      localStorage.removeItem(key);
      setCart([]);
      window.dispatchEvent(new Event("cart-updated"));

      await alert({
        title: "Pesanan Berhasil!",
        message: json.message || "Terima kasih! Pesanan Anda telah berhasil diproses.",
        variant: "success",
        confirmText: "Lihat Riwayat Pesanan",
      });
      router.push("/dashboard/home/transactions");
    } catch (e) {
      await alert({
        title: "Checkout gagal",
        message: e instanceof Error ? e.message : "Checkout gagal. Coba lagi.",
        variant: "danger",
        confirmText: "OK",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  if (!user && !userLoading) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FAF8F5] to-[#F0EDE8]">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0C3B2E] via-[#0F4D3A] to-[#127246] pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-green-300/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
                Your Cart
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-green-200 backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {itemsDetailed.length} items
                </span>
              </h1>
              <p className="mt-2 text-green-100/80 max-w-lg">
                Review your cart and place your order when you're ready.
              </p>
            </div>

            <Link
              href="/menu"
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-white/10 backdrop-blur-md px-5 py-3 border border-white/20 text-white transition-all hover:bg-white/20 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Cart Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Cart Items
                </h2>
                {itemsDetailed.length > 0 && (
                  <span className="text-sm text-green-700/70">{itemsDetailed.length} item(s)</span>
                )}
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl bg-white p-5 shadow-sm animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl bg-green-100" />
                        <div className="flex-1 space-y-3">
                          <div className="h-5 bg-green-100 rounded w-2/3" />
                          <div className="h-4 bg-green-50 rounded w-1/3" />
                          <div className="h-8 bg-green-100 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : itemsDetailed.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 shadow-sm ring-1 ring-black/5 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-green-900 mb-2">Keranjang Kosong</h3>
                  <p className="text-green-700/70 mb-6 max-w-sm mx-auto">
                    Belum ada item di keranjang. Yuk, jelajahi menu kami dan temukan matcha favoritmu!
                  </p>
                  <Link
                    href="/menu"
                    className="inline-flex items-center rounded-full bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700 transition-all hover:scale-105"
                  >
                    Jelajahi Menu
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {itemsDetailed.map((item) => (
                    <article
                      key={item.id}
                      className="group rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-all"
                    >
                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 overflow-hidden">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                          {item.stock <= 0 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-xs font-semibold text-white bg-red-500 px-2 py-1 rounded">Habis</span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-green-900 truncate">{item.name}</h3>
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {item.category}
                              </span>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {/* Price & Quantity */}
                          <div className="flex flex-wrap items-end justify-between gap-3 mt-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 bg-green-50 rounded-full p-1">
                              <button
                                onClick={() => updateQty(item.id, -1)}
                                className="w-8 h-8 rounded-full bg-white text-green-900 shadow-sm hover:bg-green-100 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-10 text-center font-semibold text-green-900">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item.id, 1)}
                                className="w-8 h-8 rounded-full bg-white text-green-900 shadow-sm hover:bg-green-100 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-xs text-green-600/70">Subtotal</p>
                              <p className="text-lg font-bold text-green-900">
                                Rp {(item.price * item.qty).toLocaleString("id-ID")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-24 h-fit space-y-4">
              {/* Summary Card */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <h2 className="text-lg font-semibold text-green-900 flex items-center gap-2 mb-5">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Order Summary
                </h2>

                {/* Shipping Options */}
                <div className="mb-5">
                  <p className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Delivery Method
                  </p>
                  <div className="grid gap-2">
                    {([
                      { id: "pickup", label: "Pickup", desc: "Ambil di toko", price: 0 },
                      { id: "standard", label: "Standard", desc: "3-5 hari kerja", price: 8000 },
                      { id: "express", label: "Express", desc: "1-2 hari kerja", price: 15000 },
                    ] as const).map((opt) => {
                      const IconComponent = ShippingIcons[opt.id];
                      return (
                        <label
                          key={opt.id}
                          className={`
                            flex items-center gap-3 cursor-pointer rounded-xl border-2 p-3 transition-all
                            ${shipping === opt.id
                              ? "border-green-600 bg-green-50 shadow-sm"
                              : "border-gray-100 hover:border-green-200 hover:bg-green-50/50"
                            }
                          `}
                        >
                          <div className={`p-2 rounded-lg ${shipping === opt.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                            <IconComponent />
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${shipping === opt.id ? "text-green-900" : "text-gray-700"}`}>
                              {opt.label}
                            </p>
                            <p className="text-xs text-gray-500">{opt.desc}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${shipping === opt.id ? "text-green-700" : "text-gray-600"}`}>
                              {opt.price === 0 ? "Free" : `Rp ${opt.price.toLocaleString("id-ID")}`}
                            </p>
                          </div>
                          <input
                            type="radio"
                            name="shipping"
                            checked={shipping === opt.id}
                            onChange={() => setShipping(opt.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shipping === opt.id ? "border-green-600 bg-green-600" : "border-gray-300"}`}>
                            {shipping === opt.id && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-800/70">Subtotal</span>
                    <span className="text-green-900">Rp {subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-800/70">Shipping</span>
                    <span className="text-green-900">
                      {shippingCost === 0 ? (
                        <span className="text-green-600 font-medium">Free</span>
                      ) : (
                        `Rp ${shippingCost.toLocaleString("id-ID")}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-100">
                    <span className="font-semibold text-green-900">Total</span>
                    <span className="text-xl font-bold text-green-900">Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || itemsDetailed.length === 0}
                  className="w-full mt-5 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white font-semibold shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checkingOut ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Checkout Now
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-green-700/60">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secure checkout
                </div>
              </div>

            </div>
          </div>

          {/* Recommendations */}
          {!loading && products.length > 0 && itemsDetailed.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-green-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  You might also like
                </h2>
                <Link href="/menu" className="text-sm font-semibold text-green-700 hover:text-green-800 flex items-center gap-1">
                  View all
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {products.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-square rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 overflow-hidden mb-3">
                      <Image src={p.image} alt={p.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform" />
                    </div>
                    <h3 className="font-semibold text-green-900 truncate">{p.name}</h3>
                    <p className="text-sm text-green-700/70 mt-0.5">Rp {p.price.toLocaleString("id-ID")}</p>
                    <button
                      onClick={async () => {
                        if (!(await ensureLoggedIn())) return;
                        setCart((prev) => {
                          const found = prev.find((line) => line.productId === p.id);
                          if (found) return prev.map((line) => (line.productId === p.id ? { ...line, qty: line.qty + 1 } : line));
                          return [...prev, { productId: p.id, qty: 1 }];
                        });
                        showAlert("Added to cart!", { variant: "success" });
                      }}
                      className="w-full mt-3 rounded-lg bg-green-50 text-green-700 font-semibold py-2 text-sm hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
