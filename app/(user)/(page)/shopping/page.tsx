"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/context/AlertContext";
import { useUser } from "@/lib/hooks/useUser";

type Product = {
  id: string;
  name: string;
  category: "Matcha" | "Coffee" | "Food" | "Merch";
  price: number;
  badge?: string;
  image: string;
  description: string;
};

const products: Product[] = [
  {
    id: "m1",
    name: "Iced Matcha Latte",
    category: "Matcha",
    price: 38000,
    badge: "Bestseller",
    image: "/matcha-tea.png",
    description: "Signature ceremonial matcha, oat milk, vanilla syrup.",
  },
  {
    id: "m2",
    name: "Dirty Matcha",
    category: "Matcha",
    price: 42000,
    badge: "Limited",
    image: "/leaf.png",
    description: "Matcha meets espresso for a double caffeine kick.",
  },
  {
    id: "c1",
    name: "Caramel Macchiato",
    category: "Coffee",
    price: 39000,
    image: "/quality.png",
    description: "Butterscotch caramel, velvety milk foam, bold espresso.",
  },
  {
    id: "f1",
    name: "Matcha Basque Cheesecake",
    category: "Food",
    price: 48000,
    image: "/trust.png",
    description: "Creamy burnt cheesecake with earthy matcha finish.",
  },
  {
    id: "f2",
    name: "Yuzu Croffle",
    category: "Food",
    price: 32000,
    badge: "New",
    image: "/matcha-tea.png",
    description: "Flaky croffle, bright yuzu glaze, toasted almond.",
  },
  {
    id: "g1",
    name: "Serba Matcha Tumbler",
    category: "Merch",
    price: 150000,
    image: "/logo/serbamatcha.png",
    description: "Double-wall steel tumbler, keeps drinks chill for 12h.",
  },
];

const cartKey = (userId?: string | null) => (userId ? `cart-items-${userId}` : "cart-items-guest");

const categories: Array<{ value: Product["category"] | "All"; label: string }> = [
  { value: "All", label: "All" },
  { value: "Matcha", label: "Matcha" },
  { value: "Coffee", label: "Coffee" },
  { value: "Food", label: "Food" },
  { value: "Merch", label: "Merch" },
];

export default function ShoppingPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user, isLoading: userLoading } = useUser();
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]["value"]>("All");
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = activeCategory === "All" || p.category === activeCategory;
      const matchPromo = !onlyPromo || Boolean(p.badge);
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchPromo && matchSearch;
    });
  }, [activeCategory, onlyPromo, search]);

  const readCartSafe = (key: string) => {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  };

  const ensureLoggedIn = async () => {
    if (user) return true;
    if (userLoading) return false;
    await showAlert("Silakan login dulu untuk menambahkan ke keranjang.", { variant: "warning" });
    const next = typeof window !== "undefined" ? window.location.pathname : "/shopping";
    router.push(`/login?next=${encodeURIComponent(next)}`);
    return false;
  };

  const addToCart = async (product: Product) => {
    if (!(await ensureLoggedIn())) return;
    const key = cartKey(user?.id);
    const current = readCartSafe(key);
    const foundIndex = current.findIndex((p: any) => p.productId === product.id);
    let next;
    if (foundIndex >= 0) {
      next = current.map((line: any, idx: number) =>
        idx === foundIndex ? { ...line, qty: line.qty + 1 } : line
      );
    } else {
      next = [
        ...current,
        { productId: product.id, qty: 1, snapshot: { name: product.name, price: product.price, image: product.image, category: product.category } },
      ];
    }
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
    showAlert("Added to cart.", { variant: "success" });
  };

  return (
    <main className="min-h-screen bg-[#F4F1EC] pb-16 pt-28">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
        <div className="rounded-3xl bg-gradient-to-r from-[#0C3B2E] to-[#127246] p-8 shadow-xl text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">Shop Serba Matcha</p>
              <h1 className="text-3xl font-bold md:text-4xl">Pick your matcha mood</h1>
              <p className="mt-2 max-w-2xl text-white/80">
                Fresh drinks, cozy bites, and eco merchâ€”curated for calm mornings and late-night focus.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/cart"
                className="rounded-full bg-white/15 px-4 py-3 text-sm font-semibold backdrop-blur hover:bg-white/25 transition"
              >
                Go to Cart
              </Link>
              <Link
                href="/menu"
                className="rounded-full bg-white text-[#0C3B2E] px-4 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition"
              >
                See Full Menu
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[3fr_2fr] md:items-center">
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={[
                    "rounded-full border border-white/25 px-4 py-2 text-sm font-semibold transition",
                    activeCategory === cat.value ? "bg-white text-[#0C3B2E]" : "bg-white/10 text-white",
                    "hover:bg-white hover:text-[#0C3B2E]",
                  ].join(" ")}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full min-w-[240px] md:w-auto md:flex-1">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search drinks or food"
                  className="w-full rounded-full bg-white/15 px-4 py-2 text-sm placeholder:text-white/60 outline-none ring-1 ring-white/25 focus:bg-white focus:text-[#0C3B2E] focus:ring-white"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={onlyPromo}
                  onChange={(e) => setOnlyPromo(e.target.checked)}
                  className="h-4 w-4 rounded border-white/40 bg-white/20 text-[#0C3B2E]"
                />
                Promo only
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-52 bg-gradient-to-b from-green-50 to-white">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain p-6 transition duration-300 group-hover:scale-105"
                />
                {item.badge && (
                  <span className="absolute left-4 top-4 rounded-full bg-[#0C3B2E] px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>

              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-green-700/70">{item.category}</p>
                    <h3 className="text-lg font-semibold text-green-900">{item.name}</h3>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-900">
                    Rp {item.price.toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="text-sm text-green-800/80">{item.description}</p>
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0C3B2E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#127246]"
                  onClick={() => addToCart(item)}
                >
                  Add to cart
                </button>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-green-200 bg-white p-10 text-center text-green-800">
              No items match your filters. Try a different category.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
