"use client";

import { useFormStatus } from "react-dom";

/** Submit button that optionally asks for confirmation and shows a pending label while the action runs. */
export function ConfirmButton({
  confirm,
  pendingLabel,
  className,
  children,
}: {
  confirm?: string;
  pendingLabel: string;
  className: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
