"use client";

import { useFormStatus } from "react-dom";

function Box({ checked, label }: { checked: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <input
      type="checkbox"
      name="noKids"
      defaultChecked={checked}
      disabled={pending}
      aria-label={label}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    />
  );
}

/** "Bez dzieci" checkbox that saves as soon as it's toggled. */
export function KidsToggle({
  userId,
  name,
  checked,
  action,
}: {
  userId: string;
  name: string;
  checked: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="kids-toggle">
      <input type="hidden" name="userId" value={userId} />
      <label>
        <Box checked={checked} label={`${name}: bez dzieci`} />
        <span>Bez dzieci</span>
      </label>
    </form>
  );
}
