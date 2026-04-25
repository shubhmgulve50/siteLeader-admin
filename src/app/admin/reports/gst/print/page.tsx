"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { Print as PrintIcon, WhatsApp as WhatsAppIcon } from "@mui/icons-material";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN, formatINRFull } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  clientGstin?: string;
  gstType: "NONE" | "CGST_SGST" | "IGST";
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxableAmount: number;
  totalAmount: number;
  issueDate: string;
}

export default function GstSummaryPrintPage() {
  const sp = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(sp.get("from") || "");
  const [to, setTo] = useState(sp.get("to") || "");

  useEffect(() => {
    api
      .get(apiEndpoints.invoices.base)
      .then((r) => setInvoices(r.data.data || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const f = from ? new Date(from).getTime() : -Infinity;
    const t = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return invoices
      .filter((i) => {
        const ts = new Date(i.issueDate).getTime();
        return ts >= f && ts <= t;
      })
      .sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());
  }, [invoices, from, to]);

  // Group by tax rate
  const byRate = useMemo(() => {
    const map: Record<
      string,
      {
        rate: number;
        gstType: string;
        taxable: number;
        cgst: number;
        sgst: number;
        igst: number;
        total: number;
        count: number;
      }
    > = {};
    filtered.forEach((inv) => {
      const rate =
        inv.gstType === "IGST"
          ? inv.igstPercentage
          : inv.gstType === "CGST_SGST"
            ? inv.cgstPercentage + inv.sgstPercentage
            : 0;
      const key = `${inv.gstType}-${rate}`;
      if (!map[key]) {
        map[key] = { rate, gstType: inv.gstType, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, count: 0 };
      }
      map[key].taxable += inv.taxableAmount || 0;
      map[key].cgst += inv.cgstAmount || 0;
      map[key].sgst += inv.sgstAmount || 0;
      map[key].igst += inv.igstAmount || 0;
      map[key].total += inv.totalAmount || 0;
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.rate - a.rate);
  }, [filtered]);

  const totals = filtered.reduce(
    (acc, i) => ({
      taxable: acc.taxable + (i.taxableAmount || 0),
      cgst: acc.cgst + (i.cgstAmount || 0),
      sgst: acc.sgst + (i.sgstAmount || 0),
      igst: acc.igst + (i.igstAmount || 0),
      total: acc.total + (i.totalAmount || 0),
    }),
    { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
  );

  const handleWA = () => {
    const text = `*GST Summary*\nPeriod: ${from || "All"} → ${to || "Today"}\nTaxable: ${formatINRFull(totals.taxable)}\nCGST: ${formatINRFull(totals.cgst)}\nSGST: ${formatINRFull(totals.sgst)}\nIGST: ${formatINRFull(totals.igst)}\nTotal: ${formatINRFull(totals.total)}`;
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
          maxWidth: "297mm",
          mx: "auto",
          my: 2,
          p: "12mm",
          bgcolor: "#fff",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          color: "#111",
          fontSize: 10,
          fontFamily: "'Inter', Arial, sans-serif",
        }}
      >
        <Box sx={{ textAlign: "center", borderBottom: "2px solid #111", pb: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>
            GST SUMMARY (OUTWARD SUPPLY)
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#555", mt: 0.5 }}>
            Period: <strong>{from ? formatDateIN(from) : "Inception"} → {to ? formatDateIN(to) : "Today"}</strong> • {filtered.length} invoice(s)
          </Typography>
        </Box>

        {/* Rate-wise summary */}
        <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 1, textTransform: "uppercase" }}>
          Tax Rate-wise Summary
        </Typography>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mb: 3, fontSize: 10 }}>
          <Box component="thead" sx={{ bgcolor: "#111", color: "#fff" }}>
            <tr>
              <Box component="th" sx={{ p: 0.75, textAlign: "left", width: "10%" }}>Rate</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "left", width: "12%" }}>Type</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "8%" }}>Invoices</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "14%" }}>Taxable ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "12%" }}>CGST ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "12%" }}>SGST ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "12%" }}>IGST ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "14%" }}>Total ₹</Box>
            </tr>
          </Box>
          <Box component="tbody">
            {byRate.length === 0 ? (
              <tr>
                <Box component="td" colSpan={8} sx={{ p: 2, textAlign: "center", color: "#666" }}>
                  No invoices in this period
                </Box>
              </tr>
            ) : (
              byRate.map((r, i) => (
                <tr key={i}>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", fontWeight: 800 }}>{r.rate}%</Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb" }}>{r.gstType.replace("_", "+")}</Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{r.count}</Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{r.taxable.toLocaleString("en-IN")}</Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{r.cgst.toLocaleString("en-IN")}</Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{r.sgst.toLocaleString("en-IN")}</Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{r.igst.toLocaleString("en-IN")}</Box>
                  <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", fontWeight: 800 }}>{r.total.toLocaleString("en-IN")}</Box>
                </tr>
              ))
            )}
          </Box>
          <Box component="tfoot" sx={{ bgcolor: "#f3f4f6", fontWeight: 900 }}>
            <tr>
              <Box component="td" colSpan={3} sx={{ p: 1, textAlign: "right" }}>TOTAL</Box>
              <Box component="td" sx={{ p: 1, textAlign: "right" }}>{totals.taxable.toLocaleString("en-IN")}</Box>
              <Box component="td" sx={{ p: 1, textAlign: "right" }}>{totals.cgst.toLocaleString("en-IN")}</Box>
              <Box component="td" sx={{ p: 1, textAlign: "right" }}>{totals.sgst.toLocaleString("en-IN")}</Box>
              <Box component="td" sx={{ p: 1, textAlign: "right" }}>{totals.igst.toLocaleString("en-IN")}</Box>
              <Box component="td" sx={{ p: 1, textAlign: "right" }}>{totals.total.toLocaleString("en-IN")}</Box>
            </tr>
          </Box>
        </Box>

        {/* Invoice list */}
        <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 1, textTransform: "uppercase" }}>
          Invoice Register
        </Typography>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <Box component="thead" sx={{ bgcolor: "#111", color: "#fff" }}>
            <tr>
              <Box component="th" sx={{ p: 0.6, textAlign: "left" }}>Date</Box>
              <Box component="th" sx={{ p: 0.6, textAlign: "left" }}>Invoice #</Box>
              <Box component="th" sx={{ p: 0.6, textAlign: "left" }}>Client</Box>
              <Box component="th" sx={{ p: 0.6, textAlign: "left" }}>GSTIN</Box>
              <Box component="th" sx={{ p: 0.6, textAlign: "right" }}>Taxable ₹</Box>
              <Box component="th" sx={{ p: 0.6, textAlign: "right" }}>CGST</Box>
              <Box component="th" sx={{ p: 0.6, textAlign: "right" }}>SGST</Box>
              <Box component="th" sx={{ p: 0.6, textAlign: "right" }}>IGST</Box>
              <Box component="th" sx={{ p: 0.6, textAlign: "right" }}>Total</Box>
            </tr>
          </Box>
          <Box component="tbody">
            {filtered.map((inv) => (
              <tr key={inv._id}>
                <Box component="td" sx={{ p: 0.6, borderBottom: "1px solid #e5e7eb" }}>{formatDateIN(inv.issueDate)}</Box>
                <Box component="td" sx={{ p: 0.6, borderBottom: "1px solid #e5e7eb", fontFamily: "monospace" }}>{inv.invoiceNumber}</Box>
                <Box component="td" sx={{ p: 0.6, borderBottom: "1px solid #e5e7eb" }}>{inv.clientName}</Box>
                <Box component="td" sx={{ p: 0.6, borderBottom: "1px solid #e5e7eb", fontFamily: "monospace" }}>{inv.clientGstin || "—"}</Box>
                <Box component="td" sx={{ p: 0.6, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{(inv.taxableAmount || 0).toLocaleString("en-IN")}</Box>
                <Box component="td" sx={{ p: 0.6, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{(inv.cgstAmount || 0).toLocaleString("en-IN")}</Box>
                <Box component="td" sx={{ p: 0.6, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{(inv.sgstAmount || 0).toLocaleString("en-IN")}</Box>
                <Box component="td" sx={{ p: 0.6, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{(inv.igstAmount || 0).toLocaleString("en-IN")}</Box>
                <Box component="td" sx={{ p: 0.6, borderBottom: "1px solid #e5e7eb", textAlign: "right", fontWeight: 700 }}>{(inv.totalAmount || 0).toLocaleString("en-IN")}</Box>
              </tr>
            ))}
          </Box>
        </Box>
      </Box>

      <style jsx global>{`
        @media print {
          html, body { background: white !important; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>
    </Box>
  );
}
