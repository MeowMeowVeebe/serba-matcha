"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  sampleTitle?: string;
  sampleItems?: string[];
  sampleActionLabel?: string;
  onSampleAction?: () => void;
};

export default function EmptyState({
  title,
  description,
  action,
  sampleTitle = "Contoh data",
  sampleItems,
  sampleActionLabel = "Try demo data",
  onSampleAction,
}: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state__title">{title}</div>
      {description ? <div className="empty-state__desc">{description}</div> : null}
      {sampleItems?.length ? (
        <div className="empty-state__sample">
          <div className="empty-state__sampleTitle">{sampleTitle}</div>
          <ul className="empty-state__sampleList">
            {sampleItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="empty-state__actions">
        {action}
        {onSampleAction ? (
          <button type="button" className="secondary-btn" onClick={onSampleAction}>
            {sampleActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
