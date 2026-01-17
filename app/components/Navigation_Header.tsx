
import Link from "next/link";


import "@/app/globals.css";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-9">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Serba Matcha
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/page/home"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Home
          </Link>

          
          <Link
            href="/page/contact"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Contact
          </Link>
          <Link
            href="/services"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Services
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Contact
          </Link>
        </nav>

        {/* CTA / Button */}
        <div className="hidden md:block">
          <Link
            href="/contact"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
