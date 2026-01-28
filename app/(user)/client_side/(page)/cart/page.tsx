"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  variant: string;
};

const initialItems: CartItem[] = [
  { id: "m1", name: "Iced Matcha Latte", price: 38000, qty: 2, image: "/matcha-tea.png", variant: "Less sweet" },
  { id: "c1", name: "Dirty Matcha", price: 42000, qty: 1, image: "/leaf.png", variant: "Oat milk" },
  { id: "f1", name: "Matcha Basque Cheesecake", price: 48000, qty: 1, image: "/trust.png", variant: "Slice" },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [shipping, setShipping] = useState<"pickup" | "express" | "standard">("standard");

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );
  const shippingCost = shipping === "pickup" ? 0 : shipping === "express" ? 15000 : 8000;
  const total = subtotal + shippingCost;

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
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
              href="/client_side/shopping"
              className="rounded-full bg-[#0C3B2E] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#127246] transition"
            >
              Continue shopping
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-4">
            {items.map((item) => (
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
                      <p className="text-sm text-green-800/70">Variant: {item.variant}</p>
                    </div>
                    <button
                      onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
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
                        âˆ’
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

            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-green-200 bg-white p-8 text-center text-green-800">
                Cart is empty. <Link href="/client_side/shopping" className="font-semibold text-green-900 underline">Browse drinks</Link>
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

            <button className="w-full rounded-full bg-[#0C3B2E] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#127246]">
              Proceed to Checkout
            </button>

            <p className="text-xs text-green-800/70">Secure payments powered by your favorite wallets.</p>
          </aside>
        </div>

        <section className="rounded-3xl bg-white p-5 shadow-lg ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-green-900">Recommended for you</h3>
            <Link href="/client_side/menu" className="text-sm font-semibold text-[#0C3B2E] hover:underline">
              See full menu
            </Link>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {["Genmaicha Cold Brew", "Hojicha Latte", "Matcha Tumbler"].map((name, idx) => (
              <div key={name} className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50/50 p-3">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                  <Image src={idx === 2 ? "/logo/serbamatcha.png" : "/matcha-tea.png"} alt={name} fill className="object-contain p-2" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900">{name}</p>
                  <p className="text-xs text-green-800/70">Add for Rp {(30000 + idx * 5000).toLocaleString("id-ID")}</p>
                </div>
                <button className="text-sm font-semibold text-[#0C3B2E]">+</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
