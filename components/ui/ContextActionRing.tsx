"use client";

export function ContextActionRing({ actions }: { actions: Array<{ label: string; href: string }> }) {
  return (
    <div className="action-ring">
      {actions.map((action) => (
        <a key={action.href} className="action-ring__item" href={action.href}>
          {action.label}
        </a>
      ))}
    </div>
  );
}
