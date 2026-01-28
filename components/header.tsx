"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";

export default function Header() {
  const [showBg, setShowBg] = useState(false);

  const pathname = usePathname();
  const isHome = pathname === "/client_side/home" || pathname === "/home";
  const router = useRouter();
  const { user } = useUser();

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

        <Link
          href="/client_side"
          className="text-white hover:text-white/80"
        >

<div className="flex flex-row items-center gap-2"> 
           <Image src="/logo/logo-cat.png" alt="Serba Matcha Logo" width={60} height={60} />

          Serba Matcha
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex flex justify-between">
          {[
            { href: "/client_side/home", label: "Home" },
            { href: "/client_side/our_team", label: "Our Teams" },
            { href: "/client_side/about_us", label: "About" },
            { href: "/client_side/menu", label: "Menu" },
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
                onClick={() => router.push("/dashboard")}
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
                onClick={() => router.push("/login")}
                className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white backdrop-blur transition hover:bg-white/20 text-sm"
              >
                <img src="/Profile.png" alt="Login" className="h-8 w-8 rounded-full" />
                <span className="text-sm font-semibold">Login</span>
              </button>
            )}
          </div>

          <div className="hidden sm:block w-px h-6 bg-white" />

          <div>
            <Link href="/client_side/cart">
              <div className="flex flex-column items-center">
                <img src="/cart.png" alt="Cart" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" />
                <p className="text-xs sm:text-sm text-white"> Cart</p>
              </div>
            </Link>
          </div>
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
                  { href: "/client_side/home", label: "Home" },
                  { href: "/client_side/our_team", label: "Our Team" },
                  { href: "/client_side/about_us", label: "About" },
                  { href: "/client_side/menu", label: "Menu" },
                  { href: "/dashboard/transactions", label: "Transactions" },
                  { href: "/client_side/cart", label: "Cart" },
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
