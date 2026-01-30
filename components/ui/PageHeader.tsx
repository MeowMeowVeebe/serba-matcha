"use client";

import type { ReactNode } from "react";

type Breadcrumb = { label: string; href?: string };

type Props = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
};

export default function PageHeader({ title, description, breadcrumbs, actions }: Props) {
  return (
    <div className="page-header">
      <div className="page-header__left">
        {breadcrumbs?.length ? (
          <nav className="page-header__breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((b, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={`${b.label}-${idx}`} className="page-header__crumb">
                  {b.href && !isLast ? (
                    <a href={b.href} className="page-header__crumbLink">
                      {b.label}
                    </a>
                  ) : (
                    <span className={isLast ? "page-header__crumbText page-header__crumbText--current" : "page-header__crumbText"}>
                      {b.label}
                    </span>
                  )}
                  {!isLast ? <span className="page-header__sep">/</span> : null}
                </span>
              );
            })}
          </nav>
        ) : null}

        <h1 className="page-header__title">{title}</h1>
        {description ? <p className="page-header__desc">{description}</p> : null}
      </div>

      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  );
}
