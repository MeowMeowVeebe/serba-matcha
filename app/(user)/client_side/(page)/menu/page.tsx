"use client";

import { useMemo, useState } from "react";

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

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = activeCategory === "All" || p.category === activeCategory;
      const matchPromo = !onlyPromo || Boolean(p.badge);
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchPromo && matchSearch;
    });
  }, [activeCategory, onlyPromo, search]);

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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-green-100 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-48 bg-gradient-to-b from-green-50 to-white">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-contain p-6 transition duration-300 group-hover:scale-105"
                />
                {item.badge && (
                  <span className="absolute left-4 top-4 rounded-full bg-green-800 px-3 py-1 text-xs font-semibold text-white shadow-sm">
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
                <div className="flex gap-2">
                  <button className="flex-1 rounded-full bg-green-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700">
                    Add to cart
                  </button>
                  <button className="rounded-full border border-green-200 px-3 py-2 text-sm font-semibold text-green-800 hover:border-green-500">
                    Customize
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
      </div>
    </main>
  );
}

