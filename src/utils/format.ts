export function formatINR(n?: number | null): string {
  if (n == null || isNaN(n)) return "₹0";
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatINRFull(n?: number | null): string {
  if (n == null || isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatDateIN(
  d?: string | Date | null,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", opts);
}

export function daysBetween(target: string | Date): number {
  const t = typeof target === "string" ? new Date(target).getTime() : target.getTime();
  return Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
}

export function calcDateProgress(start: string | Date, end?: string | Date | null): number | null {
  if (!end) return null;
  const s = typeof start === "string" ? new Date(start).getTime() : start.getTime();
  const e = typeof end === "string" ? new Date(end).getTime() : end.getTime();
  if (e <= s) return null;
  return Math.min(100, Math.max(0, Math.round(((Date.now() - s) / (e - s)) * 100)));
}
