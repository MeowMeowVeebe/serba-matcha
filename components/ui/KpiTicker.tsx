"use client";

export type KpiItem = {
  label: string;
  value: string;
};

export function KpiTicker({ items }: { items: KpiItem[] }) {
  return (
    <div className="kpi-ticker" role="status" aria-live="polite">
      <div className="kpi-ticker__track">
        {items.concat(items).map((item, index) => (
          <span key={`${item.label}-${index}`} className="kpi-ticker__item">
            <span className="kpi-ticker__label">{item.label}:</span>
            <span className="kpi-ticker__value">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
