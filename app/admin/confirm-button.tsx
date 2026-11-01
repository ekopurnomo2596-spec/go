"use client";

import { useFormStatus } from "react-dom";

export function ConfirmButton({
  message,
  className,
  title,
  children,
}: {
  message?: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={(className ?? "") + (pending ? " is-loading" : "")}
      title={title}
      aria-label={title}
      aria-busy={pending}
      disabled={pending}
      onClick={(e) => {
        if (message && !window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
      {pending && <span className="spin" aria-hidden="true" />}
    </button>
  );
}

export const SubmitButton = ConfirmButton;
