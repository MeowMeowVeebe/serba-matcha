"use client";

import { useState } from "react";

export function SmartSearch() {
  const [value, setValue] = useState("");
  return (
    <div className="smart-search">
      <input
        className="input"
        placeholder="Press / to search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
