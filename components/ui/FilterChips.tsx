"use client";

import { useState } from "react";

export function FilterChips({ options }: { options: string[] }) {
  const [active, setActive] = useState(options[0]);
  return (
    <div className="filter-chips">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`filter-chips__item ${active === opt ? "active" : ""}`}
          onClick={() => setActive(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
