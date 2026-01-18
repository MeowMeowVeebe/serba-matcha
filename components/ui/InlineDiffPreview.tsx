"use client";

export function InlineDiffPreview({ before, after }: { before: string; after: string }) {
  return (
    <div className="inline-diff">
      <span className="inline-diff__before">{before}</span>
      <span className="inline-diff__arrow">→</span>
      <span className="inline-diff__after">{after}</span>
    </div>
  );
}
