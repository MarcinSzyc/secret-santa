"use client";

import { setEffectsOn, toggleTheme, useEffectsOn } from "./preferences";

export function ThemeToggle() {
  return (
    <button type="button" className="icon-btn pref-btn" onClick={toggleTheme} aria-label="Przełącz tryb jasny / ciemny" title="Tryb jasny / ciemny">
      {/* Both icons render; CSS shows the one matching the active theme, so there's no hydration flicker. */}
      <svg className="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg className="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}

export function EffectsToggle() {
  const on = useEffectsOn();
  return (
    <button
      type="button"
      className="icon-btn pref-btn"
      onClick={() => setEffectsOn(!on)}
      aria-pressed={on}
      aria-label="Śnieg i fajerwerki"
      title={on ? "Wyłącz śnieg i fajerwerki" : "Włącz śnieg i fajerwerki"}
      data-on={on}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20M4.9 7l14.2 10M4.9 17L19.1 7" />
        <path d="M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5" />
        {!on && <path d="M3 3l18 18" />}
      </svg>
    </button>
  );
}
