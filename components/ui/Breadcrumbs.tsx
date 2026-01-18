"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: ReactNode;
};

export type BreadcrumbsProps = {
  items?: BreadcrumbItem[];
  separator?: ReactNode;
  maxItems?: number;
  showHome?: boolean;
};

export function Breadcrumbs({
  items,
  separator = "›",
  maxItems = 5,
  showHome = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbItems = items || generateBreadcrumbs(pathname, showHome);

  // Collapse middle items if too many
  const displayItems =
    breadcrumbItems.length > maxItems
      ? [
          ...breadcrumbItems.slice(0, 1),
          { label: "...", href: undefined },
          ...breadcrumbItems.slice(-(maxItems - 2)),
        ]
      : breadcrumbItems;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isCollapsed = item.label === "...";

          return (
            <li key={index} className="breadcrumbs-item">
              {isCollapsed ? (
                <span className="breadcrumbs-link breadcrumbs-link--collapsed">{item.label}</span>
              ) : isLast ? (
                <span className="breadcrumbs-link breadcrumbs-link--active" aria-current="page">
                  {item.icon && <span className="breadcrumbs-icon">{item.icon}</span>}
                  {item.label}
                </span>
              ) : item.href ? (
                <Link href={item.href} className="breadcrumbs-link">
                  {item.icon && <span className="breadcrumbs-icon">{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumbs-link">
                  {item.icon && <span className="breadcrumbs-icon">{item.icon}</span>}
                  {item.label}
                </span>
              )}

              {!isLast && <span className="breadcrumbs-separator">{separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string, showHome: boolean): BreadcrumbItem[] {
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  if (showHome) {
    breadcrumbs.push({ label: "🏠 Home", href: "/" });
  }

  paths.forEach((path, index) => {
    const href = "/" + paths.slice(0, index + 1).join("/");
    const label = path
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    breadcrumbs.push({ label, href });
  });

  return breadcrumbs;
}
