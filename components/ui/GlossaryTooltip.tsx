"use client";

export function GlossaryTooltip({ term, description }: { term: string; description: string }) {
  return (
    <span className="glossary">
      {term}
      <span className="glossary__tooltip">{description}</span>
    </span>
  );
}
