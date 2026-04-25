export function shareOnWhatsApp(text: string, phone?: string): void {
  const encoded = encodeURIComponent(text);
  const base = phone
    ? `https://wa.me/${phone.replace(/\D/g, "")}`
    : "https://wa.me/";
  window.open(`${base}?text=${encoded}`, "_blank", "noopener");
}

/** Uses Web Share API on mobile browsers; falls back to WhatsApp link on desktop */
export async function shareNative(params: {
  title: string;
  text: string;
  url?: string;
}): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(params);
      return;
    } catch {
      // user cancelled or API failed — fall through to WhatsApp
    }
  }
  shareOnWhatsApp(params.url ? `${params.text}\n${params.url}` : params.text);
}

export function buildSiteSummary(site: {
  name: string;
  status?: string;
  phoneNumber?: string;
  address?: string;
  clientName?: string;
}, stats?: { totalIncome?: number; totalExpense?: number; balance?: number }): string {
  const lines = [
    `*${site.name}*`,
    `Status: ${site.status || "—"}`,
  ];
  if (site.clientName) lines.push(`Client: ${site.clientName}`);
  if (site.phoneNumber) lines.push(`Contact: ${site.phoneNumber}`);
  if (site.address) lines.push(`Address: ${site.address}`);
  if (stats) {
    if (stats.totalIncome != null) lines.push(`Income: ₹${stats.totalIncome.toLocaleString("en-IN")}`);
    if (stats.totalExpense != null) lines.push(`Expense: ₹${stats.totalExpense.toLocaleString("en-IN")}`);
    if (stats.balance != null) lines.push(`Balance: ₹${stats.balance.toLocaleString("en-IN")}`);
  }
  return lines.join("\n");
}
