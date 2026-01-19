"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, type ReactNode, type MouseEvent } from "react";

interface NavLinkProps {
  href: string;
  className?: string;
  activeClassName?: string;
  isActive?: boolean;
  children: ReactNode;
  prefetch?: boolean;
  onClick?: () => void;
}

// Memoized NavLink with smart prefetching
const NavLink = memo(function NavLink({
  href,
  className = "",
  activeClassName = "",
  isActive = false,
  children,
  prefetch = true,
  onClick,
}: NavLinkProps) {
  const router = useRouter();

  // Prefetch on hover for instant navigation
  const handleMouseEnter = useCallback(() => {
    if (prefetch) {
      router.prefetch(href);
    }
  }, [href, prefetch, router]);

  // Handle click with optional callback
  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (onClick) {
        onClick();
      }
    },
    [onClick]
  );

  const finalClassName = `${className} ${isActive ? activeClassName : ""}`.trim();

  return (
    <Link
      href={href}
      className={finalClassName}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      prefetch={false} // We handle prefetch manually on hover
    >
      {children}
    </Link>
  );
});

export default NavLink;
