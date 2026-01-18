"use client";

import { forwardRef, useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  showCapsLockHint?: boolean;
  containerClassName?: string;
  inputRowClassName?: string;
};

const PasswordField = forwardRef<HTMLInputElement, Props>(function PasswordField(
  {
    label,
    error,
    hint,
    showCapsLockHint = false,
    containerClassName = "form-group",
    inputRowClassName = "auth-input-row",
    id,
    ...props
  },
  ref,
) {
  const [show, setShow] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const inputId = id ?? props.name;

  const capsHandlers = useMemo(() => {
    if (!showCapsLockHint) return {};
    const handler = (e: React.KeyboardEvent<HTMLInputElement>) => setIsCapsLockOn(e.getModifierState("CapsLock"));
    return { onKeyUp: handler, onKeyDown: handler };
  }, [showCapsLockHint]);

  return (
    <div className={containerClassName}>
      <label htmlFor={inputId}>{label}</label>
      <div className={inputRowClassName}>
        <input
          ref={ref}
          id={inputId}
          type={show ? "text" : "password"}
          {...props}
          {...capsHandlers}
          aria-invalid={Boolean(error) || props["aria-invalid"] === true}
        />
        <button
          type="button"
          className="auth-ghost-btn"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {hint ? <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>{hint}</div> : null}
      {showCapsLockHint && isCapsLockOn ? (
        <p className="auth-error" style={{ color: "#f08c00" }}>
          Caps Lock is ON.
        </p>
      ) : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
});

export default PasswordField;
