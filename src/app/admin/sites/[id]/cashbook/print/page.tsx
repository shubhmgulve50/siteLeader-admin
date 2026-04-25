"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
  description?: string;
  paymentMode?: string;
  siteId?: { _id: string; name: string } | string;
  date: string;
}

interface Site {
  _id: string;
  name: string;
  address?: string;
  clientName?: string;
}

export default function CashBookPrintPage() {
  const { id } = useParams();
  const sp = useSearchParams();

  const defaultFrom = sp.get("from") || "";
  const defaultTo = sp.get("to") || "";
  const defaultOpening = Number(sp.get("opening") || 0);

  const [site, setSite] = useState<Site | null>(null);
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [opening, setOpening] = useState<number | string>(defaultOpening);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [siteRes, txRes] = await Promise.all([
          api.get(apiEndpoints.sites.byId(id as string)),
          api.get(apiEndpoints.finance.base),
        ]);
        setSite(siteRes.data.data);
        const all: Tx[] = txRes.data.data || [];
        const filtered = all.filter(
          (t) => (typeof t.siteId === "object" && t.siteId ? t.siteId._id : t.siteId) === id
        );
        setRows(filtered);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const filtered = useMemo(() => {
    const fromDate = from ? new Date(from).getTime() : -Infinity;
    const toDate = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return rows
      .filter((t) => {
        const ts = new Date(t.date).getTime();
        return ts >= fromDate && ts <= toDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [rows, from, to]);

  // Compute running balance
  let running = Number(opening) || 0;
  const ledger = filtered.map((t, idx) => {
    const credit = t.type === "Income" ? t.amount : 0;
    const debit = t.type === "Expense" ? t.amount : 0;
    running = running + credit - debit;
    return {
      ...t,
      voucher: `V${String(idx + 1).padStart(3, "0")}`,
      credit,
      debit,
      balance: running,
    };
  });

  const totals = ledger.reduce(
    (acc, l) => ({
      credit: acc.credit + l.credit,
      debit: acc.debit + l.debit,
    }),
    { credit: 0, debit: 0 }
  );

  const closing = (Number(opening) || 0) + totals.credit - totals.debit;

  const handleWA = () => {
    const text = `*Cash Book — ${site?.name || "Site"}*\nPeriod: ${from || "All"} → ${to || "Today"}\nOpening: ${formatINRFull(Number(opening) || 0)}\nReceipts: ${formatINRFull(totals.credit)}\nPayments: ${formatINRFull(totals.debit)}\nClosing: ${formatINRFull(closing)}`;
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
        <TextField
          size="small"
          type="date"
          label="From"
          InputLabelProps={{ shrink: true }}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <TextField
          size="small"
          type="date"
          label="To"
          InputLabelProps={{ shrink: true }}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <TextField
          size="small"
          type="number"
          label="Opening Balance ₹"
          inputProps={{ inputMode: "decimal" }}
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
        />
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
        {/* Header */}
        <Box sx={{ textAlign: "center", borderBottom: "2px solid #111", pb: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>
            CASH BOOK
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mt: 0.5 }}>
            {site?.name || "Site"}
          </Typography>
          {site?.address && (
            <Typography sx={{ fontSize: 10, color: "#555" }}>{site.address}</Typography>
          )}
          <Typography sx={{ fontSize: 11, color: "#555", mt: 0.75 }}>
            Period:{" "}
            <strong>
              {from ? formatDateIN(from) : "Since inception"} → {to ? formatDateIN(to) : "Today"}
            </strong>
          </Typography>
        </Box>

        {/* Opening balance row */}
        <Box sx={{ mb: 1.5, p: 1, bgcolor: "grey.100", borderRadius: 1, display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700 }}>Opening Balance</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{formatINRFull(Number(opening) || 0)}</Typography>
        </Box>

        {/* Ledger table */}
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mb: 2, fontSize: 10 }}>
          <Box component="thead" sx={{ bgcolor: "#111", color: "#fff" }}>
            <tr>
              <Box component="th" sx={{ p: 0.75, textAlign: "left", width: "9%" }}>Date</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "left", width: "7%" }}>Voucher</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "left" }}>Particulars</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "center", width: "7%" }}>Mode</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "13%" }}>Receipt (Cr) ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "13%" }}>Payment (Dr) ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "15%" }}>Balance ₹</Box>
            </tr>
          </Box>
          <Box component="tbody">
            {ledger.length === 0 ? (
              <tr>
                <Box component="td" colSpan={7} sx={{ p: 3, textAlign: "center", color: "#666" }}>
                  No transactions in this period.
                </Box>
              </tr>
            ) : (
              ledger.map((r) => (
                <tr key={r._id}>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb" }}>{formatDateIN(r.date)}</Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", fontFamily: "monospace" }}>{r.voucher}</Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{r.category}</Typography>
                    {r.description && (
                      <Typography sx={{ fontSize: 9, color: "#666" }}>{r.description}</Typography>
                    )}
                  </Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "center", fontSize: 9 }}>
                    {r.paymentMode || "—"}
                  </Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", color: "#166534", fontWeight: 700 }}>
                    {r.credit ? r.credit.toLocaleString("en-IN") : "—"}
                  </Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", color: "#b91c1c", fontWeight: 700 }}>
                    {r.debit ? r.debit.toLocaleString("en-IN") : "—"}
                  </Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", fontWeight: 900, color: r.balance >= 0 ? "#111" : "#b91c1c" }}>
                    {r.balance.toLocaleString("en-IN")}
                  </Box>
                </tr>
              ))
            )}
          </Box>
          {ledger.length > 0 && (
            <Box component="tfoot" sx={{ bgcolor: "#f3f4f6", fontWeight: 900 }}>
              <tr>
                <Box component="td" colSpan={4} sx={{ p: 1, textAlign: "right" }}>TOTALS</Box>
                <Box component="td" sx={{ p: 1, textAlign: "right", color: "#166534" }}>
                  {totals.credit.toLocaleString("en-IN")}
                </Box>
                <Box component="td" sx={{ p: 1, textAlign: "right", color: "#b91c1c" }}>
                  {totals.debit.toLocaleString("en-IN")}
                </Box>
                <Box component="td" sx={{ p: 1 }}></Box>
              </tr>
            </Box>
          )}
        </Box>

        {/* Summary cards */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, mb: 2 }}>
          <SummaryCard label="Opening" value={formatINRFull(Number(opening) || 0)} />
          <SummaryCard label="Total Receipts" value={formatINRFull(totals.credit)} color="#166534" />
          <SummaryCard label="Total Payments" value={formatINRFull(totals.debit)} color="#b91c1c" />
          <SummaryCard label="Closing Balance" value={formatINRFull(closing)} color={closing >= 0 ? "#1e40af" : "#b91c1c"} />
        </Box>

        {/* Signatures */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, mt: 5 }}>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Prepared By</Typography>
            <Typography sx={{ fontSize: 9, color: "#666" }}>Accountant / Supervisor</Typography>
          </Box>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5, textAlign: "center" }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Checked By</Typography>
            <Typography sx={{ fontSize: 9, color: "#666" }}>Engineer</Typography>
          </Box>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5, textAlign: "right" }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Approved By</Typography>
            <Typography sx={{ fontSize: 9, color: "#666" }}>Builder / Owner</Typography>
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

function SummaryCard({ label, value, color = "#111" }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ p: 1.25, border: "1px solid #ccc", borderRadius: 1, textAlign: "center" }}>
      <Typography sx={{ fontSize: 9, color: "#777", textTransform: "uppercase", fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 900, color }}>{value}</Typography>
    </Box>
  );
}
