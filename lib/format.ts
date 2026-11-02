export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/** Polish plural: 1 prezent, 2–4 prezenty, 5+ prezentów (12–14 too). */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return `1 ${one}`;
  const lastTwo = n % 100;
  const last = n % 10;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}
