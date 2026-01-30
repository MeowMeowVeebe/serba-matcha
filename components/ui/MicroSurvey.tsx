"use client";

import { useState } from "react";

export function MicroSurvey({ question }: { question: string }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <div className="micro-survey">Thanks for the feedback!</div>;
  }

  return (
    <div className="micro-survey">
      <div className="micro-survey__question">{question}</div>
      <div className="micro-survey__actions">
        <button className="secondary-btn" type="button" onClick={() => setSubmitted(true)}>
          Yes
        </button>
        <button className="secondary-btn" type="button" onClick={() => setSubmitted(true)}>
          No
        </button>
      </div>
    </div>
  );
}
