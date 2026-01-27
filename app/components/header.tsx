"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";


const linkClass = (showBg: boolean) =>
  `font-medium transition-colors ${showBg
    ? "text-[#22b982] hover:text-[#49e4ab]"
    : "text-white hover:text-white/80"
  }`;



export default function Header() {
  const [showBg, setShowBg] = useState(false);

  const isHome = usePathname() === "/home";
  const pathname = usePathname();

  useEffect(() => {

    if (pathname !== "/home") {
      setShowBg(true);


      return;
    }
    const hero = document.getElementById("hero");

    const handleScroll = () => {
      if (!hero) return;
      const bottom = hero.getBoundingClientRect().bottom;

      setShowBg(bottom <= 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return (
    <motion.header

      className={`fixed top-0 z-[100] w-full py-3 font-['Montserrat-Semibold'] card-header
    ${isHome ? "flex justify-center" : "flex sticky justify-center"}
  `}
      animate={{
        backgroundColor: showBg ? "#06402B" : "rgba(148,219,148,0)",

        backdropFilter: showBg ? "blur(12px)" : "blur(0px)",
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >

      <div className=" flex w-3/4  items-center justify-between px-6 py-5 text-xl">

        <motion.header className="absolute hidden h-full w-3/4 border-b-3 border-white top-3 pointer-events-none md:flex"
          animate={{
            opacity: showBg ? 0 : 1,
          }}
        >



        </motion.header>

        {/* Logo */}
        <Link href="/" className={`text-2xl font-medium transition-colors ${showBg ? "text-[#22b982] hover:text-green-900" : "text-white hover:text-white/80"
          }`}>
          Serba Matcha
        </Link>

        {/* Navigation */}
        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex flex justify-between">
          <Link
            href="/home"
            className="relative group font-medium text-white"
          >
            Home
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


          <Link href="/our_team" className='relative group  font medium text-white'>
            Our Teams

            <span
              className="
      absolute left-0 -bottom-1
      h-[2px] bg-white
      w-0
      transition-all duration-300
      group-hover:w-full
    "
            />          </Link>
          <Link href="/about_us" className='relative group  font medium text-white'>
            About
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

          <Link href="/menu" className='relative group  font medium text-white'>
            Menu

            <span
              className="
      absolute left-0 -bottom-1
      h-[2px] bg-white
      w-0
      transition-all duration-300
      group-hover:w-full
    "
            />          </Link>


        </nav>

        <nav className="flex flex-row items-center gap-3">





          <div className="flex flex-row items-center">
            <img
              src="/Profile.png"
              alt="User Avatar"
              className="w-10 h-10 rounded-full"
            />
            <p className="text-white font-medium ml-2">Login</p>
          </div>


          <div className="w-px h-6 bg-white"></div>

          <div>
            <Link href="/cart">
              <div className="flex flex-column items-center">
                <img
                  src="/cart.png"
                  alt="Cart"
                  className="w-9 h-9 rounded-full"
                />
                <p> Cart</p>
              </div>
            </Link>

          </div>


        </nav>


        {/* Mobile dropdown (shown on small screens) */}
        <div className="md:hidden">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm ${showBg
                ? "border-green-700/30 text-green-900 bg-white/40"
                : "border-white/40 text-white bg-black/10"
                }`}
              aria-label="Open menu"
            >
              ☰
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={1}
                align="end"
                className={`min-w-[180px] z-100 rounded-xl p-2 shadow-lg backdrop-blur border ${showBg
                  ? "bg-white border-green-200 text-green-900"
                  : "bg-black/40 border-white/20 text-white"
                  }`}
              >
                <DropdownMenu.Item className="rounded-lg px-3 py-2 text-sm outline-none hover:bg-white/10">
                  <Link href="/home">Home</Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item className="rounded-lg px-3 py-2 text-sm outline-none hover:bg-white/10">
                  <Link href="/our_team">Our Team</Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item className="rounded-lg px-3 py-2 text-sm outline-none hover:bg-white/10">
                  <Link href="/services">About</Link>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

      </div>
    </motion.header>
  );
}
