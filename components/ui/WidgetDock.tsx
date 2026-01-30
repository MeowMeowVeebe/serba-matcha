"use client";

export function WidgetDock({ items }: { items: string[] }) {
  return (
    <div className="widget-dock">
      {items.map((item) => (
        <button key={item} className="widget-dock__item" type="button">
          {item}
        </button>
      ))}
    </div>
  );
}
