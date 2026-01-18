"use client";

import { useEffect, useState } from "react";

export type MiniMapSection = {
  id: string;
  label: string;
};

export function SectionMiniMap({ sections }: { sections: MiniMapSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { threshold: 0.4 },
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <aside className="mini-map" aria-label="Section map">
      <div className="mini-map__title">Page Map</div>
      <ul className="mini-map__list">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`mini-map__link ${active === section.id ? "active" : ""}`}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
