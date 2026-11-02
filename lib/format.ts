export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

import type { EventInfo } from "./db";

export function zl(amount: number): string {
  return `do ${amount.toLocaleString("pl-PL")} zł`;
}

/** A budget that may be a number (100 → "do 100 zł") or free text ("100–150" → "100–150 zł"). */
export function money(value: number | string): string {
  if (typeof value === "number") return zl(value);
  const v = value.trim();
  if (/^\d+$/.test(v)) return zl(Number(v));
  return /zł/i.test(v) ? v : `${v} zł`;
}

/** Short budget lines for headers and e-mails. */
export function budgetLines(event: EventInfo): string[] {
  const lines: string[] = [];
  if (event.budget != null && event.budgetNoKids != null && event.budget !== event.budgetNoKids) {
    lines.push(`Prezent: ${zl(event.budget)} dla osoby z dziećmi, ${zl(event.budgetNoKids)} dla osoby bez dzieci`);
  } else if (event.budget != null || event.budgetNoKids != null) {
    lines.push(`Prezent: ${zl((event.budget ?? event.budgetNoKids)!)}`);
  }
  if (event.childBudget != null) lines.push(`Prezent dla dziecka: ${money(event.childBudget)}`);
  return lines;
}

/** Polish plural: 1 prezent, 2–4 prezenty, 5+ prezentów (12–14 too). */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return `1 ${one}`;
  const lastTwo = n % 100;
  const last = n % 10;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}
