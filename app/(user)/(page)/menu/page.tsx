"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/context/AlertContext";
import { useUser } from "@/lib/hooks/useUser";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  badge?: string;
  image: string;
  description: string;
  stock?: number;
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

export default function MenuPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [animationClass, setAnimationClass] = useState<'pending' | 'animate' | 'none'>('pending');
  const { showAlert } = useAlert();

  // Animation on mount - detect if it's a page refresh or navigation
  useEffect(() => {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const isReload = navEntries.length > 0 && navEntries[0].type === 'reload';
    setAnimationClass(isReload ? 'none' : 'animate');
  }, []);

  useEffect(() => {
    const key = cartKey(user?.id);
    setCart(readCartSafe(key));
    setCartHydrated(true);
    const load = async () => {
      try {
        const res = await fetch("/api/seller/products");
        if (!res.ok) {
          console.error("Failed to fetch products:", res.status);
          setProducts([]);
          return;
        }
        const text = await res.text();
        if (!text) {
          setProducts([]);
          return;
        }
        const json = JSON.parse(text);
        setProducts(
          (json.products || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            badge: p.stock <= 0 ? "Sold out" : undefined,
            image: p.image || "/matcha-tea.png",
            description: p.description || "",
            stock: p.stock,
          }))
        );
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!cartHydrated) return;
    const key = cartKey(user?.id);
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, cartHydrated, user?.id]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      return p.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, products]);

  const ensureLoggedIn = async () => {
    if (user) return true;
    if (userLoading) return false;
    showAlert("Silakan login dulu sebelum menambahkan ke keranjang.", { variant: "warning" });
    const next = typeof window !== "undefined" ? window.location.pathname : "/menu";
    router.push(`/dashboard/login?next=${encodeURIComponent(next)}`);
    return false;
  };

  const handleAddToCart = async (product: Product) => {
    if (!(await ensureLoggedIn())) return;
    const key = cartKey(user?.id);
    const current = readCartSafe(key);
    const foundIndex = current.findIndex((p) => p.productId === product.id);
    let next: CartLine[];

    if (foundIndex >= 0) {
      next = current.map((line, idx) =>
        idx === foundIndex ? { ...line, qty: line.qty + 1 } : line
      );
    } else {
      next = [
        ...current,
        {
          productId: product.id,
          qty: 1,
          snapshot: {
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
          },
        },
      ];
    }

    localStorage.setItem(key, JSON.stringify(next));
    setCart(next);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("cart-updated"));
    }

    showAlert("Added to cart!", { variant: "success" });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FAF8F5] to-[#F0EDE8]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0C3B2E] via-[#0F4D3A] to-[#127246] pt-24 pb-16 sm:pt-28 sm:pb-20">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-green-300/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-yellow-300/10 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-center md:text-left">
              {/* Animated title */}
              <h1 
                className={`text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight ${
                  animationClass === 'pending' ? 'opacity-0' : 
                  animationClass === 'animate' ? 'animate-fade-in-down' : ''
                }`}
              >
                Our Menu
              </h1>
              {/* Animated description */}
              <p 
                className={`mt-3 text-base sm:text-lg text-white/80 max-w-xl ${
                  animationClass === 'pending' ? 'opacity-0' : 
                  animationClass === 'animate' ? 'animate-fade-in-up animation-delay-200' : ''
                }`}
              >
                Discover our carefully curated selection of matcha drinks, coffee, delicious food, and exclusive merchandise.
              </p>
            </div>
          </div>

          {/* Search bar with modern animation */}
          <div 
            className={`mt-8 max-w-xl mx-auto md:mx-0 ${
              animationClass === 'pending' ? 'opacity-0' : 
              animationClass === 'animate' ? 'animate-fade-in-up animation-delay-400' : ''
            }`}
          >
            <div className={`relative group transition-all duration-500 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
              {/* Glow effect on focus */}
              <div className={`absolute -inset-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 rounded-2xl blur-lg transition-all duration-500 ${isSearchFocused ? 'opacity-40' : 'opacity-0 group-hover:opacity-20'}`} />
              
              {/* Search icon with animation */}
              <svg 
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10 transition-all duration-300 ${isSearchFocused ? 'text-white scale-110' : 'text-white/50 group-hover:text-white/70'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search menu items..."
                className={`relative w-full rounded-xl backdrop-blur-md pl-12 pr-4 py-3.5 text-white placeholder:text-white/50 outline-none transition-all duration-300
                  ${isSearchFocused 
                    ? 'bg-white/20 border-2 border-white/50 shadow-lg shadow-black/10' 
                    : 'bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30'
                  }
                `}
              />
              
              {/* Animated underline */}
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transition-all duration-500 ${isSearchFocused ? 'w-[90%] opacity-60' : 'w-0 opacity-0'}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white p-4 shadow-sm animate-pulse">
                  <div className="aspect-square rounded-xl bg-green-100" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-green-100" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-green-50" />
                  <div className="mt-4 h-10 rounded-full bg-green-100" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => (
                <article
                  key={item.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Image container */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Badge */}
                    {item.badge && (
                      <span className={`
                        absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm
                        ${item.badge === "Sold out" 
                          ? "bg-gray-800 text-white" 
                          : "bg-gradient-to-r from-green-600 to-green-500 text-white"
                        }
                      `}>
                        {item.badge}
                      </span>
                    )}

                    {/* Quick add button - appears on hover */}
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={item.stock === 0}
                      className={`
                        absolute bottom-3 right-3 flex items-center justify-center w-10 h-10 rounded-full shadow-lg
                        opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0
                        ${item.stock === 0 
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                          : "bg-green-600 text-white hover:bg-green-700 hover:scale-110"
                        }
                      `}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    {/* Category tag */}
                    <span className="self-start text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-2">
                      {item.category}
                    </span>

                    {/* Name */}
                    <h3 className="font-semibold text-green-900 text-lg leading-tight line-clamp-1 group-hover:text-green-700 transition-colors">
                      {item.name}
                    </h3>

                    {/* Description */}
                    <p className="mt-1 text-sm text-green-700/70 line-clamp-2 flex-1">
                      {item.description}
                    </p>

                    {/* Price and Add button */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-green-600/60">Price</span>
                        <span className="text-lg font-bold text-green-900">
                          Rp {item.price.toLocaleString("id-ID")}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={item.stock === 0}
                        className={`
                          flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all
                          ${item.stock === 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700 hover:shadow-md active:scale-95"
                          }
                        `}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-green-900 mb-2">Menu Sedang Dipersiapkan</h3>
                  <p className="text-green-700/70 text-center max-w-md leading-relaxed">
                    Kami sedang menyiapkan pilihan menu terbaik untuk Anda. Silakan kunjungi kembali dalam waktu dekat atau hubungi kami untuk informasi lebih lanjut.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-6 rounded-full bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Menu
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-green-800 to-green-700">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Want to know more about us?
          </h2>
          <p className="text-green-100/80 mb-6 max-w-xl mx-auto">
            Discover our journey and meet the passionate team behind every cup of matcha we serve.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/about_us"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-green-800 font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              About Our Story
            </Link>
            <Link
              href="/our_team"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-6 py-3 text-white font-semibold transition-all hover:bg-white/10"
            >
              Meet Our Team
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
