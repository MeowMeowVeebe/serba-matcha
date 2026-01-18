"use client";

export function GuidedInsights({ items }: { items: Array<{ title: string; detail: string }> }) {
  return (
    <div className="guided-insights">
      {items.map((item) => (
        <div key={item.title} className="guided-insights__item">
          <div className="guided-insights__title">{item.title}</div>
          <div className="guided-insights__detail">{item.detail}</div>
        </div>
      ))}
    </div>
  );
}
