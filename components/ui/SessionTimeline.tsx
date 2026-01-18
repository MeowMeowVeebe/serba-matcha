"use client";

export function SessionTimeline({ items }: { items: Array<{ label: string; time: string }> }) {
  return (
    <div className="session-timeline">
      {items.map((item) => (
        <div key={item.label} className="session-timeline__item">
          <div className="session-timeline__dot" />
          <div>
            <div className="session-timeline__label">{item.label}</div>
            <div className="session-timeline__time">{item.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
