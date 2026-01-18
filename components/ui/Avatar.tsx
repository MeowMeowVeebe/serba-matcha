"use client";

import type { ImgHTMLAttributes } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export type AvatarProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "size"> & {
  name?: string;
  size?: AvatarSize;
  src?: string;
  fallbackColor?: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 60%, 50%)`;
}

export function Avatar({ name = "", size = "md", src, fallbackColor, className = "", ...props }: AvatarProps) {
  const baseClass = "ds-avatar";
  const sizeClass = `ds-avatar--${size}`;
  const combinedClassName = [baseClass, sizeClass, className].filter(Boolean).join(" ");

  const bgColor = fallbackColor || stringToColor(name);
  const initials = getInitials(name);

  if (src) {
    return <img src={src} alt={name} className={combinedClassName} {...props} />;
  }

  return (
    <div className={combinedClassName} style={{ backgroundColor: bgColor }} {...props}>
      <span className="ds-avatar__text">{initials}</span>
    </div>
  );
}
