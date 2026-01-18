"use client";

type Props = {
  updatedAt: string;
  updatedBy: string;
};

export function ActionTrail({ updatedAt, updatedBy }: Props) {
  return (
    <div className="action-trail" aria-live="polite">
      <span className="action-trail__label">Last update</span>
      <span className="action-trail__value">{updatedAt}</span>
      <span className="action-trail__dot" aria-hidden>•</span>
      <span className="action-trail__by">{updatedBy}</span>
    </div>
  );
}
