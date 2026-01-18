"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const body = document.body;
    setIsDark(body.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const body = document.body;
    if (body.classList.contains("dark")) {
      body.classList.remove("dark");
      body.classList.add("light");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      body.classList.remove("light");
      body.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle dark mode">
      {isDark ? "☀️" : "🌙"}
    </Button>
  );
}
