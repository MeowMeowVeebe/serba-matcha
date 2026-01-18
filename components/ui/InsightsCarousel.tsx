"use client";

import { useState } from "react";

export type InsightItem = {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function InsightsCarousel({ items }: { items: InsightItem[] }) {
  const [index, setIndex] = useState(0);
  const item = items[index];

  return (
    <div className="insights-carousel">
      <div className="insights-carousel__content">
        <div className="insights-carousel__title">{item.title}</div>
        <div className="insights-carousel__desc">{item.description}</div>
        {item.ctaHref ? (
          <a className="secondary-btn" href={item.ctaHref}>
            {item.ctaLabel ?? "Explore"}
          </a>
        ) : null}
      </div>
      <div className="insights-carousel__controls">
        <button
          type="button"
          className="secondary-btn"
          onClick={() => setIndex((prev) => (prev - 1 + items.length) % items.length)}
        >
          Prev
        </button>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => setIndex((prev) => (prev + 1) % items.length)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
