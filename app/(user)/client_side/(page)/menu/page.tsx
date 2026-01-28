"use client";

import { useEffect, useMemo, useState } from "react";

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

const readCartSafe = (): CartLine[] => {
  try {
    const raw = JSON.parse(localStorage.getItem("cart-items") || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const categories: Array<{ value: Product["category"] | "All"; label: string }> = [
  { value: "All", label: "All" },
  { value: "Matcha", label: "Matcha Series" },
  { value: "Coffee", label: "Coffee Series" },
  { value: "Food", label: "Food" },
  { value: "Merch", label: "Merch" },
];

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]["value"]>("All");
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);

  useEffect(() => {
    setCart(readCartSafe());
    setCartHydrated(true);
    const load = async () => {
      try {
        const res = await fetch("/api/seller/products");
        const json = await res.json();
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
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    localStorage.setItem("cart-items", JSON.stringify(cart));
  }, [cart, cartHydrated]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = activeCategory === "All" || p.category === activeCategory;
      const matchPromo = !onlyPromo || Boolean(p.badge);
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchPromo && matchSearch;
    });
  }, [activeCategory, onlyPromo, search, products]);

  const handleBuy = (product: Product) => {
    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, productName: product.name, price: product.price }),
    }).then(() => alert("Added to your purchases!"));
  };

  const handleAddToCart = (product: Product) => {
    const current = readCartSafe();
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

    localStorage.setItem("cart-items", JSON.stringify(next));
    setCart(next);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage")); // keep other tabs in sync
      window.dispatchEvent(new Event("cart-updated")); // explicit cart signal for our cart page
    }
  };

  return (
    <main className="min-h-screen bg-green-50 pb-16 pt-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-green-700/70">Our Menu</p>
          <h1 className="text-4xl font-bold text-green-900">Shop your matcha mood</h1>
          <p className="mt-2 text-green-800/80">
            Curated drinks, bites, and merchâ€”kept in the familiar Serba Matcha green vibe.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-green-100 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  activeCategory === cat.value
                    ? "border-green-700 bg-green-700 text-white shadow"
                    : "border-green-200 text-green-800 hover:border-green-500 hover:text-green-900",
                ].join(" ")}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drinks or food"
              className="min-w-[220px] rounded-full border border-green-200 bg-white px-4 py-2 text-sm text-green-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-green-900">
              <input
                type="checkbox"
                checked={onlyPromo}
                onChange={(e) => setOnlyPromo(e.target.checked)}
                className="h-4 w-4 rounded border-green-300 text-green-700 focus:ring-green-500"
              />
              Promo only
            </label>
          </div>
        </div>

              {/* Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="matcha-card h-64 animate-pulse bg-white/60" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-green-100 transition hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-b from-green-50 to-white">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-contain p-6 transition duration-300 group-hover:scale-105"
                  />
                  {item.badge && (
                    <span className="absolute left-4 top-4 rounded-full bg-green-800 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-green-700/70">{item.category}</p>
                      <h3 className="truncate text-lg font-semibold text-green-900">{item.name}</h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-900">
                      Rp {item.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-sm text-green-800/80">{item.description}</p>

                  {/* Button pinned to bottom */}
                  <div className="mt-auto pt-2">
                    <button
                      className="w-full rounded-full bg-green-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 active:scale-[0.99] disabled:bg-gray-300 disabled:text-gray-600"
                      disabled={item.stock !== undefined && item.stock === 0}
                      onClick={() => handleAddToCart(item)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-green-200 bg-white p-10 text-center text-green-800">
                No items match your filters. Try a different category.
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
