"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "@/lib/theme";

// Per-browser preferences kept in localStorage: theme and festive effects.

const EFFECTS_KEY = "effects";
const CHANGE = "prefs-change";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice just won't stick.
  }
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Effects default to on, except for people who asked their system for reduced motion. */
function effectsOn(): boolean {
  const saved = read(EFFECTS_KEY);
  if (saved) return saved === "on";
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useEffectsOn(): boolean {
  return useSyncExternalStore(subscribe, effectsOn, () => false);
}

export function setEffectsOn(on: boolean) {
  write(EFFECTS_KEY, on ? "on" : "off");
}

export function currentTheme(): "light" | "dark" {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  write(THEME_KEY, next);
}
