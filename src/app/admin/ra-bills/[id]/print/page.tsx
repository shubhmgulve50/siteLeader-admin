"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Print as PrintIcon, WhatsApp as WhatsAppIcon } from "@mui/icons-material";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN, formatINRFull } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";

interface RaItem {
  description: string;
  itemNumber?: string;
  unit: string;
  contractQty: number;
  rate: number;
  previousCumulativeQty: number;
  cumulativeQty: number;
  currentQty: number;
  cumulativeAmount: number;
  previousAmount: number;
  currentAmount: number;
  hsnCode?: string;
}

interface RaBill {
  _id: string;
  raNumber: string;
  raSequence: number;
  clientName: string;
  clientAddress?: string;
  clientGstin?: string;
  siteId?: { _id: string; name: string; address?: string } | string;
  quotationId?: { _id: string; quotationNumber: string } | string;
  items: RaItem[];
  cumulativeGrossValue: number;
  previouslyBilled: number;
  thisBillGross: number;
  retentionPercentage: number;
  retentionAmount: number;
  mobilizationAdjustment: number;
  securityDepositAmount: number;
  otherDeductions: number;
  otherDeductionsNote?: string;
  taxableAmount: number;
  gstType: "NONE" | "CGST_SGST" | "IGST";
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  tdsPercentage: number;
  tdsAmount: number;
  totalAmount: number;
  issueDate: string;
  periodFrom?: string;
  periodTo?: string;
  notes?: string;
  status: string;
}

function numberToWordsIN(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  };
  const three = (n: number): string => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return (h ? ones[h] + " Hundred" : "") + (r ? (h ? " " : "") + two(r) : "");
  };
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;
  let s = "";
  if (crore) s += two(crore) + " Crore ";
  if (lakh) s += two(lakh) + " Lakh ";
  if (thousand) s += two(thousand) + " Thousand ";
  if (rest) s += three(rest);
  s = (s || "Zero").trim() + " Rupees";
  if (paise) s += " and " + two(paise) + " Paise";
  return s + " Only";
}

export default function RaBillPrintPage() {
  const { id } = useParams();
  const [bill, setBill] = useState<RaBill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(apiEndpoints.raBills.byId(id as string));
        setBill(res.data.data);
      } catch {
        setBill(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!bill) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography>RA Bill not found</Typography>
      </Box>
    );
  }

  const siteName = typeof bill.siteId === "object" && bill.siteId ? bill.siteId.name : "";
  const quoteNum =
    typeof bill.quotationId === "object" && bill.quotationId
      ? bill.quotationId.quotationNumber
      : "";

  const handleWA = () => {
    const text = `*RA Bill ${bill.raNumber}*\nClient: ${bill.clientName}\nSite: ${siteName}\nThis Period: ${formatINRFull(bill.thisBillGross)}\nNet Payable: ${formatINRFull(bill.totalAmount)}\nDate: ${formatDateIN(bill.issueDate)}`;
    shareOnWhatsApp(text);
  };

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
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ textTransform: "none", fontWeight: 700 }}>
          Print / Save as PDF
        </Button>
        <Button variant="outlined" startIcon={<WhatsAppIcon sx={{ color: "#25D366" }} />} onClick={handleWA} sx={{ textTransform: "none", fontWeight: 700 }}>
          Share on WhatsApp
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
        <Box sx={{ textAlign: "center", mb: 1 }}>
          <Typography sx={{ fontSize: 10, letterSpacing: 2, color: "#666", fontWeight: 700 }}>
            RUNNING ACCOUNT BILL
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #111", pb: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 900 }}>RA Bill No. {bill.raSequence}</Typography>
            <Typography sx={{ fontSize: 11, color: "#555", mt: 0.5 }}>
              Certificate of Work Executed &amp; Payment Due
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{bill.raNumber}</Typography>
            <Typography sx={{ fontSize: 11, color: "#555" }}>
              Date: <strong>{formatDateIN(bill.issueDate)}</strong>
            </Typography>
            {bill.periodFrom && bill.periodTo && (
              <Typography sx={{ fontSize: 11, color: "#555" }}>
                Period: {formatDateIN(bill.periodFrom)} → {formatDateIN(bill.periodTo)}
              </Typography>
            )}
            {quoteNum && (
              <Typography sx={{ fontSize: 11, color: "#555" }}>
                Against: <strong>{quoteNum}</strong>
              </Typography>
            )}
          </Box>
        </Box>

        {/* Parties */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>
              Bill To
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 800, mt: 0.25 }}>{bill.clientName}</Typography>
            {bill.clientAddress && (
              <Typography sx={{ fontSize: 10, color: "#444", whiteSpace: "pre-line" }}>{bill.clientAddress}</Typography>
            )}
            {bill.clientGstin && (
              <Typography sx={{ fontSize: 10, color: "#444" }}>GSTIN: <strong>{bill.clientGstin}</strong></Typography>
            )}
          </Box>
          {siteName && (
            <Box>
              <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>
                Project Site
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 800, mt: 0.25 }}>{siteName}</Typography>
            </Box>
          )}
        </Box>

        {/* Measurement table */}
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mb: 2, fontSize: 10 }}>
          <Box component="thead" sx={{ bgcolor: "#111", color: "#fff" }}>
            <tr>
              <Box component="th" sx={{ p: 0.75, textAlign: "left", width: "5%" }}>#</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "left" }}>Description</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "center", width: "6%" }}>Unit</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "8%" }}>Rate ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "7%" }}>Contract Qty</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "8%" }}>Prev. Cum. Qty</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "8%" }}>Cum. Qty</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "7%" }}>Current Qty</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "11%" }}>Current Value ₹</Box>
            </tr>
          </Box>
          <Box component="tbody">
            {bill.items.map((it, i) => (
              <tr key={i}>
                <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb" }}>{it.itemNumber || i + 1}</Box>
                <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>{it.description}</Box>
                <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>{it.unit}</Box>
                <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{it.rate.toLocaleString("en-IN")}</Box>
                <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{it.contractQty}</Box>
                <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{it.previousCumulativeQty}</Box>
                <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{it.cumulativeQty}</Box>
                <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", fontWeight: 700 }}>{it.currentQty}</Box>
                <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", fontWeight: 700 }}>{it.currentAmount.toLocaleString("en-IN")}</Box>
              </tr>
            ))}
          </Box>
        </Box>

        {/* Totals */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Box sx={{ minWidth: "340px", fontSize: 11 }}>
            <Row label="Cumulative Gross Value" value={formatINRFull(bill.cumulativeGrossValue)} />
            <Row label="Previously Billed" value={`− ${formatINRFull(bill.previouslyBilled)}`} />
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5, fontWeight: 800, borderTop: "1px solid #ddd", mt: 0.5 }}>
              <span>This Period Gross</span>
              <span>{formatINRFull(bill.thisBillGross)}</span>
            </Box>
            {bill.retentionAmount > 0 && <Row label={`Retention @ ${bill.retentionPercentage}%`} value={`− ${formatINRFull(bill.retentionAmount)}`} />}
            {bill.mobilizationAdjustment > 0 && <Row label="Mobilization Recovery" value={`− ${formatINRFull(bill.mobilizationAdjustment)}`} />}
            {bill.securityDepositAmount > 0 && <Row label="Security Deposit" value={`− ${formatINRFull(bill.securityDepositAmount)}`} />}
            {bill.otherDeductions > 0 && (
              <Row label={bill.otherDeductionsNote || "Other Deductions"} value={`− ${formatINRFull(bill.otherDeductions)}`} />
            )}
            <Row label="Taxable Value" value={formatINRFull(bill.taxableAmount)} />
            {bill.gstType === "CGST_SGST" && (
              <>
                <Row label={`CGST @ ${bill.cgstPercentage}%`} value={formatINRFull(bill.cgstAmount)} />
                <Row label={`SGST @ ${bill.sgstPercentage}%`} value={formatINRFull(bill.sgstAmount)} />
              </>
            )}
            {bill.gstType === "IGST" && (
              <Row label={`IGST @ ${bill.igstPercentage}%`} value={formatINRFull(bill.igstAmount)} />
            )}
            {bill.tdsAmount > 0 && <Row label={`TDS @ ${bill.tdsPercentage}%`} value={`− ${formatINRFull(bill.tdsAmount)}`} />}
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, mt: 1, borderTop: "2px solid #111", fontWeight: 900, fontSize: 13 }}>
              <span>Net Payable</span>
              <span>{formatINRFull(bill.totalAmount)}</span>
            </Box>
          </Box>
        </Box>

        {/* Amount in words */}
        <Box sx={{ border: "1px dashed #777", p: 1, borderRadius: 1, mb: 2 }}>
          <Typography sx={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>
            Net Payable in Words
          </Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 700, fontStyle: "italic" }}>
            {numberToWordsIN(bill.totalAmount)}
          </Typography>
        </Box>

        {bill.notes && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>Remarks</Typography>
            <Typography sx={{ fontSize: 11, color: "#444", whiteSpace: "pre-line" }}>{bill.notes}</Typography>
          </Box>
        )}

        {/* Signatures */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mt: 5 }}>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Prepared By</Typography>
            <Typography sx={{ fontSize: 9, color: "#666" }}>Site Engineer</Typography>
          </Box>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5, textAlign: "center" }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Certified By</Typography>
            <Typography sx={{ fontSize: 9, color: "#666" }}>Project Manager</Typography>
          </Box>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5, textAlign: "right" }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Accepted By (Client)</Typography>
            <Typography sx={{ fontSize: 9, color: "#666" }}>Signature &amp; Date</Typography>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
      <span style={{ color: "#555" }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </Box>
  );
}
