"use client";

import { useState } from "react";

export function EmojiReactions() {
  const [selected, setSelected] = useState<string | null>(null);
  const emojis = ["👍", "🔥", "😮"];
  return (
    <div className="emoji-reactions">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={`emoji-reactions__btn ${selected === emoji ? "active" : ""}`}
          onClick={() => setSelected(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
