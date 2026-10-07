"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Password field with a show/hide eye and a Caps Lock warning (the usual reasons a correct
// password "does not work", especially on phones). Pass the normal input props; `className`
// styles the input itself.
export default function PasswordInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const capsCheck = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div>
      <div className="relative">
        <input
          {...props}
          type={show ? "text" : "password"}
          className={`${className} pr-11`}
          onKeyDown={(e) => {
            capsCheck(e);
            props.onKeyDown?.(e);
          }}
          onKeyUp={capsCheck}
          onBlur={(e) => {
            setCaps(false);
            props.onBlur?.(e);
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-200"
        >
          {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      {caps && (
        <p className="mt-1.5 text-xs text-amber-300" role="status">
          Caps Lock is on
        </p>
      )}
    </div>
  );
}
