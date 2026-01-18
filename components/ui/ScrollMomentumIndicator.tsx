"use client";

import { useEffect, useState } from "react";

export function ScrollMomentumIndicator() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const value = total > 0 ? Math.round((window.scrollY / total) * 100) : 0;
      setProgress(value);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="scroll-indicator">
      <span style={{ width: `${progress}%` }} />
    </div>
  );
}
