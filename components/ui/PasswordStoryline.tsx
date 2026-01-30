"use client";

import { useMemo } from "react";
import { Progress } from "@/components/ui/Progress";

const hints = {
  weak: "Use 8+ characters and letter/number combinations.",
  fair: "Add symbols or uppercase/lowercase variations.",
  good: "Maintain combination and add length if needed.",
  strong: "Password is strong, keep it safe.",
};

export function PasswordStoryline({ password }: { password: string }) {
  const { score, label, hint, variant } = useMemo(() => {
    if (!password) {
      return { score: 5, label: "Start typing", hint: hints.weak, variant: "warning" as const };
    }

    let points = 0;
    if (password.length >= 8) points += 1;
    if (password.length >= 12) points += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points += 1;
    if (/\d/.test(password)) points += 1;
    if (/[^A-Za-z0-9]/.test(password)) points += 1;

    if (points <= 1) return { score: 20, label: "Weak", hint: hints.weak, variant: "danger" as const };
    if (points === 2) return { score: 40, label: "Fair", hint: hints.fair, variant: "warning" as const };
    if (points === 3) return { score: 65, label: "Good", hint: hints.good, variant: "default" as const };
    return { score: 90, label: "Strong", hint: hints.strong, variant: "success" as const };
  }, [password]);

  return (
    <div className="password-storyline">
      <div className="password-storyline__header">
        <span className="password-storyline__label">Strength: {label}</span>
        <span className="password-storyline__score">{score}%</span>
      </div>
      <Progress value={score} max={100} size="sm" variant={variant} />
      <p className="password-storyline__hint">{hint}</p>
    </div>
  );
}
