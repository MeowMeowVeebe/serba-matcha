"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";

type CartLine = {
  productId: string;
  qty: number;
};

const cartKey = (userId?: string | null) => (userId ? `cart-items-${userId}` : "cart-items-guest");

const readCartSafe = (key: string): CartLine[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

export default function Header() {
  const [showBg, setShowBg] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);

  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "/home";
  const router = useRouter();
  const { user } = useUser();

  // Load cart and listen for updates
  useEffect(() => {
    const key = cartKey(user?.id);
    const loadCart = () => setCart(readCartSafe(key));
    loadCart();

    const onStorage = (e: StorageEvent) => { if (e.key === key || !e.key) loadCart(); };
    const onCartUpdated = () => loadCart();
    window.addEventListener("storage", onStorage);
    window.addEventListener("cart-updated", onCartUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart-updated", onCartUpdated);
    };
  }, [user?.id]);

  const cartItemCount = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);

  useEffect(() => {
    if (!isHome) {
      setShowBg(true);
      return;
    }
    const hero = document.getElementById("hero");
    const handleScroll = () => {
      if (!hero) return;
      setShowBg(hero.getBoundingClientRect().bottom <= 80);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  return (
    <motion.header
      className={`fixed top-0 z-[100] w-full py-3 font-['Montserrat-Semibold'] card-header ${
        isHome ? "flex justify-center" : "flex sticky justify-center"
      }`}
      animate={{
        backgroundColor: showBg ? "#06402B" : "rgba(148,219,148,0)",
        backdropFilter: showBg ? "blur(12px)" : "blur(0px)",
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex w-full max-w-6xl items-center justify-between px-4 sm:px-6 py-3 text-lg sm:text-xl">
        <motion.header
          className="absolute hidden h-full w-full max-w-6xl border-b-3 border-white top-3 pointer-events-none md:flex"
          animate={{ opacity: showBg ? 0 : 1 }}
        />

        <Link href="/home" className="text-white hover:text-white/80">

<div className="flex flex-row items-center gap-2"> 
           <Image src="/logo/logo-cat.png" alt="Serba Matcha Logo" width={60} height={60} loading="eager" style={{ width: 'auto', height: 'auto' }} />

          Serba Matcha
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex flex justify-between">
          {[
            { href: "/home", label: "Home" },
            { href: "/our_team", label: "Our Teams" },
            { href: "/about_us", label: "About" },
            { href: "/menu", label: "Menu" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="relative group font-medium text-white">
              {item.label}
              <span
                className="
                  absolute left-0 -bottom-1
                  h-[2px] bg-white
                  w-0
                  transition-all duration-300
                  group-hover:w-full
                "
              />
            </Link>
          ))}
        </nav>

        <nav className="flex flex-row items-center gap-2 sm:gap-3">
          <div className="flex flex-row items-center">
            {user ? (
              <button
                onClick={() => {
                  // Check if user is seller-only (not admin)
                  const isSeller = user.roles?.some((r) => r.toLowerCase() === "seller" || r.toLowerCase() === "penjual") ?? false;
                  const isAdmin = user.roles?.some((r) => r.toLowerCase() === "admin") ?? false;
                  const isSellerOnly = isSeller && !isAdmin;
                  
                  // Redirect based on role
                  if (isSellerOnly) {
                    router.push("/dashboard/seller/dashboard");
                  } else {
                    router.push("/dashboard/home");
                  }
                }}
                className="flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1.5 text-white backdrop-blur transition hover:bg-white/20"
                title="Go to Dashboard"
              >
                <div className="h-9 w-9 overflow-hidden rounded-full bg-white/20">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                      {user.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold max-w-[120px] truncate">{user.name}</span>
              </button>
            ) : (
              <button
                onClick={() => router.push("/dashboard/login")}
                className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white backdrop-blur transition hover:bg-white/20 text-sm"
              >
                <img src="/Profile.png" alt="Login" className="h-8 w-8 rounded-full" />
                <span className="text-sm font-semibold">Login</span>
              </button>
            )}
          </div>

          <div className="hidden sm:block w-px h-6 bg-white" />

          <Link href="/cart" className="relative group">
            <div className="flex flex-col items-center">
              <div className="relative">
                <img src="/cart.png" alt="Cart" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-400 text-xs font-bold text-green-900 shadow-sm">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-white group-hover:text-green-200 transition-colors">Cart</p>
            </div>
          </Link>
        </nav>

        <div className="md:hidden">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm ${
                showBg ? "border-green-700/30 text-green-900 bg-white/40" : "border-white/40 text-white bg-black/10"
              }`}
              aria-label="Open menu"
            >
              {"\u2630"}
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={1}
                align="end"
                className={`min-w-[180px] z-100 rounded-xl p-2 shadow-lg backdrop-blur border ${
                  showBg ? "bg-white border-green-200 text-green-900" : "bg-black/40 border-white/20 text-white"
                }`}
              >
                {[
                  { href: "/home", label: "Home" },
                  { href: "/our_team", label: "Our Team" },
                  { href: "/about_us", label: "About" },
                  { href: "/menu", label: "Menu" },
                  { href: "/cart", label: "Cart" },
                ].map((item) => (
                  <DropdownMenu.Item
                    key={item.href}
                    className="rounded-lg px-3 py-2 text-sm outline-none hover:bg-white/10"
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </motion.header>
  );
}
