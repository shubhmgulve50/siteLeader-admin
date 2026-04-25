"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Print as PrintIcon, WhatsApp as WhatsAppIcon } from "@mui/icons-material";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN, formatINRFull } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";

interface Item {
  description: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  type: string;
  clientName: string;
  clientAddress?: string;
  clientGstin?: string;
  clientEmail?: string;
  clientPhone?: string;
  placeOfSupply?: string;
  siteId?: { _id: string; name: string } | string;
  items: Item[];
  subTotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstType: "NONE" | "CGST_SGST" | "IGST";
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  roundOff: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  termsConditions?: string;
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

export default function InvoicePrintPage() {
  const { id } = useParams();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(apiEndpoints.invoices.byId(id as string));
        setInv(res.data.data);
      } catch {
        setInv(null);
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
  if (!inv) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography>Invoice not found</Typography>
      </Box>
    );
  }

  const siteName = typeof inv.siteId === "object" && inv.siteId ? inv.siteId.name : "";
  const typeLabel = inv.type === "PROFORMA" ? "Proforma Invoice" : "Tax Invoice";

  const handleWA = () => {
    const text = `*${typeLabel} ${inv.invoiceNumber}*\nTo: ${inv.clientName}\nAmount: ${formatINRFull(inv.totalAmount)}\nDate: ${formatDateIN(inv.issueDate)}${inv.dueDate ? `\nDue: ${formatDateIN(inv.dueDate)}` : ""}`;
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
          fontSize: 12,
          fontFamily: "'Inter', Arial, sans-serif",
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography sx={{ fontSize: 10, letterSpacing: 2, color: "#666", fontWeight: 700 }}>
            {inv.type === "PROFORMA" ? "PROFORMA INVOICE" : "TAX INVOICE"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #111", pb: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{typeLabel}</Typography>
            <Typography sx={{ fontSize: 11, color: "#555", mt: 0.5 }}>
              Original for Recipient
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{inv.invoiceNumber}</Typography>
            <Typography sx={{ fontSize: 11, color: "#555" }}>
              Date: <strong>{formatDateIN(inv.issueDate)}</strong>
            </Typography>
            {inv.dueDate && (
              <Typography sx={{ fontSize: 11, color: "#555" }}>
                Due: <strong>{formatDateIN(inv.dueDate)}</strong>
              </Typography>
            )}
          </Box>
        </Box>

        {/* Parties */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>
              Billed To
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 800, mt: 0.25 }}>{inv.clientName}</Typography>
            {inv.clientAddress && (
              <Typography sx={{ fontSize: 11, color: "#444", whiteSpace: "pre-line" }}>{inv.clientAddress}</Typography>
            )}
            {inv.clientGstin && (
              <Typography sx={{ fontSize: 11, color: "#444" }}>
                GSTIN: <strong>{inv.clientGstin}</strong>
              </Typography>
            )}
            {inv.clientPhone && (
              <Typography sx={{ fontSize: 11, color: "#444" }}>Ph: {inv.clientPhone}</Typography>
            )}
            {inv.clientEmail && (
              <Typography sx={{ fontSize: 11, color: "#444" }}>{inv.clientEmail}</Typography>
            )}
          </Box>
          <Box>
            {siteName && (
              <>
                <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>
                  Project / Site
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mt: 0.25 }}>{siteName}</Typography>
              </>
            )}
            {inv.placeOfSupply && (
              <Typography sx={{ fontSize: 11, color: "#444", mt: 0.75 }}>
                Place of Supply: <strong>{inv.placeOfSupply}</strong>
              </Typography>
            )}
          </Box>
        </Box>

        {/* Items */}
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mb: 2, fontSize: 11 }}>
          <Box component="thead" sx={{ bgcolor: "#111", color: "#fff" }}>
            <tr>
              <Box component="th" sx={{ p: 1, textAlign: "left", fontWeight: 800, width: "5%" }}>#</Box>
              <Box component="th" sx={{ p: 1, textAlign: "left", fontWeight: 800 }}>Description</Box>
              <Box component="th" sx={{ p: 1, textAlign: "center", fontWeight: 800, width: "10%" }}>HSN/SAC</Box>
              <Box component="th" sx={{ p: 1, textAlign: "right", fontWeight: 800, width: "8%" }}>Qty</Box>
              <Box component="th" sx={{ p: 1, textAlign: "center", fontWeight: 800, width: "8%" }}>Unit</Box>
              <Box component="th" sx={{ p: 1, textAlign: "right", fontWeight: 800, width: "12%" }}>Rate (₹)</Box>
              <Box component="th" sx={{ p: 1, textAlign: "right", fontWeight: 800, width: "15%" }}>Amount (₹)</Box>
            </tr>
          </Box>
          <Box component="tbody">
            {inv.items.map((it, i) => (
              <tr key={i}>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb" }}>{i + 1}</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>{it.description}</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>{it.hsnCode || "—"}</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{it.quantity}</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>{it.unit}</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{it.rate.toLocaleString("en-IN")}</Box>
                <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", textAlign: "right", fontWeight: 700 }}>{it.amount.toLocaleString("en-IN")}</Box>
              </tr>
            ))}
          </Box>
        </Box>

        {/* Totals */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Box sx={{ minWidth: "300px", fontSize: 12 }}>
            <Row label="Sub Total" value={formatINRFull(inv.subTotal)} />
            {inv.discountAmount > 0 && <Row label="Discount" value={`− ${formatINRFull(inv.discountAmount)}`} />}
            <Row label="Taxable Value" value={formatINRFull(inv.taxableAmount)} />
            {inv.gstType === "CGST_SGST" && (
              <>
                <Row label={`CGST @ ${inv.cgstPercentage}%`} value={formatINRFull(inv.cgstAmount)} />
                <Row label={`SGST @ ${inv.sgstPercentage}%`} value={formatINRFull(inv.sgstAmount)} />
              </>
            )}
            {inv.gstType === "IGST" && (
              <Row label={`IGST @ ${inv.igstPercentage}%`} value={formatINRFull(inv.igstAmount)} />
            )}
            {Math.abs(inv.roundOff) > 0.001 && (
              <Row label="Round Off" value={formatINRFull(inv.roundOff)} />
            )}
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, mt: 1, borderTop: "2px solid #111", fontWeight: 900, fontSize: 14 }}>
              <span>Grand Total</span>
              <span>{formatINRFull(inv.totalAmount)}</span>
            </Box>
            {inv.paidAmount > 0 && (
              <>
                <Row label="Paid" value={formatINRFull(inv.paidAmount)} />
                <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: inv.totalAmount - inv.paidAmount > 0 ? "#b91c1c" : "#166534", mt: 0.5 }}>
                  <span>Balance Due</span>
                  <span>{formatINRFull(Math.max(0, inv.totalAmount - inv.paidAmount))}</span>
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Amount in words */}
        <Box sx={{ border: "1px dashed #777", p: 1.5, borderRadius: 1, mb: 2 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>
            Amount in Words
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 700, fontStyle: "italic", mt: 0.25 }}>
            {numberToWordsIN(inv.totalAmount)}
          </Typography>
        </Box>

        {/* Notes + terms */}
        {(inv.notes || inv.termsConditions) && (
          <Box sx={{ display: "grid", gridTemplateColumns: inv.notes && inv.termsConditions ? "1fr 1fr" : "1fr", gap: 2, mb: 3 }}>
            {inv.notes && (
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>Notes</Typography>
                <Typography sx={{ fontSize: 11, color: "#444", whiteSpace: "pre-line" }}>{inv.notes}</Typography>
              </Box>
            )}
            {inv.termsConditions && (
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>Terms &amp; Conditions</Typography>
                <Typography sx={{ fontSize: 11, color: "#444", whiteSpace: "pre-line" }}>{inv.termsConditions}</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Signatures */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, mt: 5 }}>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700 }}>Receiver&apos;s Signature</Typography>
          </Box>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5, textAlign: "right" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700 }}>Authorised Signatory</Typography>
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
