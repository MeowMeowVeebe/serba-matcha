
import Image from "next/image";
import Link from "next/link";

const socials = [
  { name: "Instagram", href: "https://instagram.com/serbamatcha", icon: "/logo/instagram.png" },
  { name: "Facebook", href: "https://facebook.com/serbamatcha", icon: "/logo/facebook.png" },
  { name: "TikTok", href: "https://tiktok.com/@serbamatcha", icon: "/logo/tiktok.png" },
];

const quickLinks = [
  { label: "Menu", href: "/menu" },
  { label: "Our Team", href: "/our_team" },
  { label: "About", href: "/about_us" },
  { label: "Contact", href: "mailto:hello@serbamatcha.com" },
];

export default function Footer() {
  return (
    <footer className="mt-16 bg-[#1A1A1A] text-[#d7e6dd]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-12 sm:px-8 md:px-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Image src="/logo/serbamatcha.png" alt="Serba Matcha Logo" width={120} height={120} className="opacity-90" />
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#9bc8af]">Serba Matcha</p>
                <p className="text-lg font-semibold text-white">Sip slow. Stay sharp.</p>
              </div>
            </div>
            <p className="max-w-lg text-sm text-[#c6d7cd]">
              Fresh matcha, crafted coffee, and calming spaces. We blend Japanese tea rituals with modern café vibes.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#9bc8af]">Explore</p>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-1">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-[#d7e6dd] transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col align-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#9bc8af] text-center">Connect</p>
            <div className="flex items-center justify-center gap-4">
              {socials.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition group-hover:-translate-y-1 group-hover:bg-white/20">
                    <Image src={s.icon} alt={`${s.name} icon`} width={20} height={20} className="opacity-90" />
                  </div>
                </a>
              ))}
            </div>

          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-[#9cb3a4] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Serba Matcha. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="mailto:hello@serbamatcha.com" className="hover:text-white">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
