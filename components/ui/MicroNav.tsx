"use client";

export function MicroNav({ items }: { items: Array<{ label: string; href: string }> }) {
  return (
    <div className="micro-nav" role="navigation" aria-label="Section navigation">
      {items.map((item) => (
        <a key={item.href} className="micro-nav__item" href={item.href}>
          {item.label}
        </a>
      ))}
    </div>
  );
}
