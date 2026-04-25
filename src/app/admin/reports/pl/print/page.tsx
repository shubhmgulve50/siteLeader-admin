"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { Print as PrintIcon, WhatsApp as WhatsAppIcon } from "@mui/icons-material";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN, formatINRFull } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";

interface Tx {
  _id: string;
  type: "Income" | "Expense";
  amount: number;
  category: string;
  siteId?: { _id: string; name: string } | string;
  date: string;
}

interface Site {
  _id: string;
  name: string;
  clientName?: string;
}

export default function ProfitLossPrintPage() {
  const sp = useSearchParams();
  const siteId = sp.get("siteId") || "";
  const [site, setSite] = useState<Site | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(sp.get("from") || "");
  const [to, setTo] = useState(sp.get("to") || "");

  useEffect(() => {
    const load = async () => {
      if (!siteId) {
        setLoading(false);
        return;
      }
      try {
        const [sRes, tRes] = await Promise.all([
          api.get(apiEndpoints.sites.byId(siteId)),
          api.get(apiEndpoints.finance.base),
        ]);
        setSite(sRes.data.data);
        const all: Tx[] = tRes.data.data || [];
        setTxs(all.filter((t) => (typeof t.siteId === "object" && t.siteId ? t.siteId._id : t.siteId) === siteId));
      } catch {
        setTxs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [siteId]);

  const filtered = useMemo(() => {
    const f = from ? new Date(from).getTime() : -Infinity;
    const t = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return txs.filter((x) => {
      const ts = new Date(x.date).getTime();
      return ts >= f && ts <= t;
    });
  }, [txs, from, to]);

  const { income, expense, byCategory } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCat: Record<string, { income: number; expense: number }> = {};
    filtered.forEach((x) => {
      if (!byCat[x.category]) byCat[x.category] = { income: 0, expense: 0 };
      if (x.type === "Income") {
        income += x.amount;
        byCat[x.category].income += x.amount;
      } else {
        expense += x.amount;
        byCat[x.category].expense += x.amount;
      }
    });
    return { income, expense, byCategory: byCat };
  }, [filtered]);

  const netProfit = income - expense;
  const margin = income > 0 ? ((netProfit / income) * 100).toFixed(1) : "—";

  const categoryRows = Object.entries(byCategory).sort(([, a], [, b]) => b.expense + b.income - (a.expense + a.income));

  const handleWA = () => {
    const text = `*P&L — ${site?.name || "Site"}*\nPeriod: ${from || "All"} → ${to || "Today"}\nIncome: ${formatINRFull(income)}\nExpense: ${formatINRFull(expense)}\nNet: ${formatINRFull(netProfit)} (${margin}%)`;
    shareOnWhatsApp(text);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "100vh" }}>
      <Box
        className="no-print"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "grey.200",
          p: 1.5,
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => setTo(e.target.value)} />
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ textTransform: "none", fontWeight: 700 }}>
          Print / Save as PDF
        </Button>
        <Button variant="outlined" startIcon={<WhatsAppIcon sx={{ color: "#25D366" }} />} onClick={handleWA} sx={{ textTransform: "none", fontWeight: 700 }}>
          Share
        </Button>
      </Box>

      <Box
        className="sheet"
        sx={{
          maxWidth: "210mm",
          mx: "auto",
          my: 2,
          p: "15mm 12mm",
          bgcolor: "#fff",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          color: "#111",
          fontSize: 11,
          fontFamily: "'Inter', Arial, sans-serif",
        }}
      >
        <Box sx={{ textAlign: "center", borderBottom: "2px solid #111", pb: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>
            PROFIT &amp; LOSS STATEMENT
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mt: 0.5 }}>
            {site?.name || "Site"}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#555", mt: 0.5 }}>
            Period: <strong>{from ? formatDateIN(from) : "Inception"} → {to ? formatDateIN(to) : "Today"}</strong>
          </Typography>
        </Box>

        {/* Summary block */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, mb: 3 }}>
          <SummaryCard label="Income" value={formatINRFull(income)} color="#166534" />
          <SummaryCard label="Expense" value={formatINRFull(expense)} color="#b91c1c" />
          <SummaryCard label="Net Profit" value={formatINRFull(netProfit)} color={netProfit >= 0 ? "#1e40af" : "#b91c1c"} />
          <SummaryCard label="Margin" value={`${margin}%`} color={Number(margin) >= 0 ? "#16a34a" : "#b91c1c"} />
        </Box>

        {/* Category breakdown */}
        <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 1, color: "#333", textTransform: "uppercase" }}>
          Category Breakdown
        </Typography>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 11, mb: 3 }}>
          <Box component="thead" sx={{ bgcolor: "#111", color: "#fff" }}>
            <tr>
              <Box component="th" sx={{ p: 0.75, textAlign: "left" }}>Category</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "20%" }}>Income ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "20%" }}>Expense ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "20%" }}>Net ₹</Box>
            </tr>
          </Box>
          <Box component="tbody">
            {categoryRows.length === 0 ? (
              <tr>
                <Box component="td" colSpan={4} sx={{ p: 2, textAlign: "center", color: "#666" }}>
                  No data
                </Box>
              </tr>
            ) : (
              categoryRows.map(([cat, vals]) => {
                const net = vals.income - vals.expense;
                return (
                  <tr key={cat}>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>{cat}</Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", color: vals.income > 0 ? "#166534" : "#999" }}>
                      {vals.income ? vals.income.toLocaleString("en-IN") : "—"}
                    </Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", color: vals.expense > 0 ? "#b91c1c" : "#999" }}>
                      {vals.expense ? vals.expense.toLocaleString("en-IN") : "—"}
                    </Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", fontWeight: 800, color: net >= 0 ? "#111" : "#b91c1c" }}>
                      {net.toLocaleString("en-IN")}
                    </Box>
                  </tr>
                );
              })
            )}
          </Box>
          <Box component="tfoot" sx={{ bgcolor: "#f3f4f6", fontWeight: 900 }}>
            <tr>
              <Box component="td" sx={{ p: 1 }}>TOTAL</Box>
              <Box component="td" sx={{ p: 1, textAlign: "right", color: "#166534" }}>{income.toLocaleString("en-IN")}</Box>
              <Box component="td" sx={{ p: 1, textAlign: "right", color: "#b91c1c" }}>{expense.toLocaleString("en-IN")}</Box>
              <Box component="td" sx={{ p: 1, textAlign: "right", color: netProfit >= 0 ? "#166534" : "#b91c1c" }}>
                {netProfit.toLocaleString("en-IN")}
              </Box>
            </tr>
          </Box>
        </Box>

        {/* Signatures */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, mt: 5 }}>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Prepared By</Typography>
          </Box>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5, textAlign: "right" }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Approved By</Typography>
          </Box>
        </Box>
      </Box>

      <style jsx global>{`
        @media print {
          html, body { background: white !important; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </Box>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box sx={{ p: 1.5, border: "1px solid #ccc", borderRadius: 1, textAlign: "center" }}>
      <Typography sx={{ fontSize: 9, color: "#777", textTransform: "uppercase", fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 900, color }}>{value}</Typography>
    </Box>
  );
}
