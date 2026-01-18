"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  badge?: string;
  actions?: ReactNode;
};

export function AdaptiveHero({ title, subtitle, badge, actions }: Props) {
  return (
    <section className="adaptive-hero">
      <div className="adaptive-hero__content">
        {badge ? <span className="adaptive-hero__badge">{badge}</span> : null}
        <h2 className="adaptive-hero__title">{title}</h2>
        <p className="adaptive-hero__subtitle">{subtitle}</p>
      </div>
      {actions ? <div className="adaptive-hero__actions">{actions}</div> : null}
    </section>
  );
}
