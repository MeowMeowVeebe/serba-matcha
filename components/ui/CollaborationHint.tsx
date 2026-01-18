"use client";

export function CollaborationHint({ count }: { count: number }) {
  return (
    <div className="collaboration-hint">
      <span className="collaboration-hint__dot" aria-hidden />
      <span>{count} teammates viewed this page today</span>
    </div>
  );
}
