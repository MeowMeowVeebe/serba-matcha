"use client";

import type { ReactNode } from "react";
import PageHeader from "@/components/ui/PageHeader";

type Props = {
  title: string;
  description?: string;
  rightSlot?: ReactNode;
};

export default function AuthHeader({ title, description, rightSlot }: Props) {
  return (
    <div className="auth-header">
      <div className="auth-header__text">
        <h1 className="auth-header__title">{title}</h1>
        {description ? <p className="auth-header__desc">{description}</p> : null}
      </div>
      {rightSlot ? <div className="auth-header__actions">{rightSlot}</div> : null}
    </div>
  );
}
