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
  _id?: string;
  sectionTitle?: string;
  itemNumber?: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  materialRate?: number;
  labourRate?: number;
  equipmentRate?: number;
  otherRate?: number;
  hsnCode?: string;
  notes?: string;
}

interface Quotation {
  _id: string;
  quotationNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  siteId?: { _id: string; name: string } | string;
  items: Item[];
  subTotal: number;
  discountAmount?: number;
  gstType?: "NONE" | "CGST_SGST" | "IGST";
  cgstPercentage?: number;
  sgstPercentage?: number;
  igstPercentage?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxPercentage?: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  date: string;
  validUntil?: string;
  revisionNumber?: number;
  createdAt: string;
}

// Convert number to Indian-format words (simplified — covers typical quotation totals)
function numberToWordsIN(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const twoDigit = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o ? " " + ones[o] : "");
  };
  const threeDigit = (n: number): string => {
    if (n === 0) return "";
    const h = Math.floor(n / 100);
    const r = n % 100;
    let str = "";
    if (h) str += ones[h] + " Hundred";
    if (r) str += (str ? " " : "") + twoDigit(r);
    return str;
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const remainder = rupees % 1000;

  let str = "";
  if (crore) str += twoDigit(crore) + " Crore ";
  if (lakh) str += twoDigit(lakh) + " Lakh ";
  if (thousand) str += twoDigit(thousand) + " Thousand ";
  if (remainder) str += threeDigit(remainder);

  str = (str || "Zero").trim() + " Rupees";
  if (paise > 0) str += " and " + twoDigit(paise) + " Paise";
  return str + " Only";
}

export default function QuotationPrintPage() {
  const { id } = useParams();
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(apiEndpoints.quotations.byId(id as string));
        setQuote(res.data.data);
      } catch {
        setQuote(null);
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

  if (!quote) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography>Quotation not found</Typography>
      </Box>
    );
  }

  // Group items by sectionTitle
  const sections = new Map<string, Item[]>();
  quote.items.forEach((it) => {
    const key = it.sectionTitle || "";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(it);
  });

  const hasRateAnalysis = quote.items.some(
    (it) => (it.materialRate || 0) + (it.labourRate || 0) + (it.equipmentRate || 0) + (it.otherRate || 0) > 0
  );

  const siteName = typeof quote.siteId === "object" && quote.siteId ? quote.siteId.name : "";

  const handleWhatsApp = () => {
    const text = `*Quotation ${quote.quotationNumber}*\nTo: ${quote.clientName}\nTotal: ${formatINRFull(quote.totalAmount)}\nDate: ${formatDateIN(quote.date || quote.createdAt)}`;
    shareOnWhatsApp(text);
  };

  return (
    <Box className="print-root" sx={{ bgcolor: "grey.100", minHeight: "100vh", py: { xs: 0, print: 0 } }}>
      {/* Action bar — hidden on print */}
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
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Print / Save as PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<WhatsAppIcon sx={{ color: "#25D366" }} />}
          onClick={handleWhatsApp}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Share on WhatsApp
        </Button>
      </Box>

      {/* A4 sheet */}
      <Box
        className="sheet"
        sx={{
          maxWidth: "210mm",
          mx: "auto",
          my: { xs: 2, print: 0 },
          p: { xs: "15mm 12mm", print: "15mm 12mm" },
          bgcolor: "#fff",
          boxShadow: { xs: "0 4px 24px rgba(0,0,0,0.08)", print: "none" },
          color: "#111",
          fontFamily: "'Inter', Arial, sans-serif",
          fontSize: 12,
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #111", pb: 2, mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 900, letterSpacing: 1 }}>QUOTATION</Typography>
            <Typography sx={{ fontSize: 11, color: "#555", mt: 0.5 }}>
              Bill of Quantities (BOQ) &amp; Rate Schedule
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{quote.quotationNumber}</Typography>
            <Typography sx={{ fontSize: 11, color: "#555" }}>
              Date: <strong>{formatDateIN(quote.date || quote.createdAt)}</strong>
            </Typography>
            {quote.validUntil && (
              <Typography sx={{ fontSize: 11, color: "#555" }}>
                Valid Until: <strong>{formatDateIN(quote.validUntil)}</strong>
              </Typography>
            )}
            {(quote.revisionNumber || 1) > 1 && (
              <Typography sx={{ fontSize: 11, color: "#555" }}>
                Revision: <strong>R{quote.revisionNumber}</strong>
              </Typography>
            )}
          </Box>
        </Box>

        {/* Parties */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>
              Bill To
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 800, mt: 0.25 }}>{quote.clientName}</Typography>
            {quote.clientAddress && (
              <Typography sx={{ fontSize: 11, color: "#444", whiteSpace: "pre-line" }}>{quote.clientAddress}</Typography>
            )}
            {quote.clientEmail && (
              <Typography sx={{ fontSize: 11, color: "#444" }}>{quote.clientEmail}</Typography>
            )}
          </Box>
          {siteName && (
            <Box>
              <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>
                Project Site
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 800, mt: 0.25 }}>{siteName}</Typography>
            </Box>
          )}
        </Box>

        {/* Items table */}
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mb: 3, fontSize: 11 }}>
          <Box component="thead" sx={{ bgcolor: "#111", color: "#fff" }}>
            <tr>
              <Box component="th" sx={{ p: 1, textAlign: "left", fontWeight: 800, width: "5%" }}>#</Box>
              <Box component="th" sx={{ p: 1, textAlign: "left", fontWeight: 800 }}>Description</Box>
              <Box component="th" sx={{ p: 1, textAlign: "center", fontWeight: 800, width: "8%" }}>HSN</Box>
              <Box component="th" sx={{ p: 1, textAlign: "right", fontWeight: 800, width: "8%" }}>Qty</Box>
              <Box component="th" sx={{ p: 1, textAlign: "center", fontWeight: 800, width: "8%" }}>Unit</Box>
              <Box component="th" sx={{ p: 1, textAlign: "right", fontWeight: 800, width: "12%" }}>Rate (₹)</Box>
              <Box component="th" sx={{ p: 1, textAlign: "right", fontWeight: 800, width: "14%" }}>Amount (₹)</Box>
            </tr>
          </Box>
          <Box component="tbody">
            {Array.from(sections.entries()).map(([sectionTitle, items], sIdx) => (
              <>
                {sectionTitle && (
                  <tr key={`section-${sIdx}`}>
                    <Box component="td" colSpan={7} sx={{ bgcolor: "#f3f4f6", p: 1, fontWeight: 800, borderBottom: "1px solid #ddd" }}>
                      {sectionTitle}
                    </Box>
                  </tr>
                )}
                {items.map((it, idx) => {
                  const analysis =
                    (it.materialRate || 0) + (it.labourRate || 0) + (it.equipmentRate || 0) + (it.otherRate || 0);
                  return (
                    <tr key={`${sIdx}-${idx}`}>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", verticalAlign: "top" }}>
                        {it.itemNumber || idx + 1}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", verticalAlign: "top" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{it.description}</Typography>
                        {analysis > 0 && (
                          <Typography sx={{ fontSize: 10, color: "#666", mt: 0.25 }}>
                            {[
                              it.materialRate ? `M ₹${it.materialRate}` : null,
                              it.labourRate ? `L ₹${it.labourRate}` : null,
                              it.equipmentRate ? `E ₹${it.equipmentRate}` : null,
                              it.otherRate ? `O ₹${it.otherRate}` : null,
                            ].filter(Boolean).join(" + ")}
                          </Typography>
                        )}
                        {it.notes && (
                          <Typography sx={{ fontSize: 10, color: "#666", fontStyle: "italic", mt: 0.25 }}>
                            {it.notes}
                          </Typography>
                        )}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", textAlign: "center", verticalAlign: "top" }}>
                        {it.hsnCode || "—"}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", textAlign: "right", verticalAlign: "top" }}>
                        {it.quantity}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", textAlign: "center", verticalAlign: "top" }}>
                        {it.unit}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", textAlign: "right", verticalAlign: "top" }}>
                        {it.rate.toLocaleString("en-IN")}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e5e7eb", textAlign: "right", fontWeight: 700, verticalAlign: "top" }}>
                        {it.amount.toLocaleString("en-IN")}
                      </Box>
                    </tr>
                  );
                })}
              </>
            ))}
          </Box>
        </Box>

        {/* Totals */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <Box sx={{ minWidth: "280px", fontSize: 12 }}>
            <Row label="Sub Total" value={formatINRFull(quote.subTotal)} />
            {(quote.discountAmount || 0) > 0 && (
              <Row label="Discount" value={`- ${formatINRFull(quote.discountAmount || 0)}`} />
            )}
            {quote.gstType === "CGST_SGST" && (
              <>
                <Row label={`CGST @ ${quote.cgstPercentage || 0}%`} value={formatINRFull(quote.cgstAmount || 0)} />
                <Row label={`SGST @ ${quote.sgstPercentage || 0}%`} value={formatINRFull(quote.sgstAmount || 0)} />
              </>
            )}
            {quote.gstType === "IGST" && (
              <Row label={`IGST @ ${quote.igstPercentage || 0}%`} value={formatINRFull(quote.igstAmount || 0)} />
            )}
            {(!quote.gstType || quote.gstType === "NONE") && (quote.taxPercentage || 0) > 0 && (
              <Row label={`Tax @ ${quote.taxPercentage || 0}%`} value={formatINRFull(quote.taxAmount)} />
            )}
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, mt: 1, borderTop: "2px solid #111", fontWeight: 900, fontSize: 14 }}>
              <span>Grand Total</span>
              <span>{formatINRFull(quote.totalAmount)}</span>
            </Box>
          </Box>
        </Box>

        {/* Amount in words */}
        <Box sx={{ border: "1px dashed #777", p: 1.5, borderRadius: 1, mb: 3 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>
            Amount in Words
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 700, fontStyle: "italic", mt: 0.25 }}>
            {numberToWordsIN(quote.totalAmount)}
          </Typography>
        </Box>

        {/* Rate analysis legend (only when analysis present) */}
        {hasRateAnalysis && (
          <Box sx={{ fontSize: 10, color: "#555", mb: 2 }}>
            <strong>Rate Analysis:</strong> M = Material, L = Labour, E = Equipment, O = Overhead &amp; Profit (per-unit breakdown shown below description where applicable).
          </Box>
        )}

        {/* Signatures */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, mt: 5 }}>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700 }}>Prepared By</Typography>
            <Typography sx={{ fontSize: 10, color: "#666" }}>Signature &amp; Stamp</Typography>
          </Box>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700 }}>Accepted By (Client)</Typography>
            <Typography sx={{ fontSize: 10, color: "#666" }}>Signature &amp; Date</Typography>
          </Box>
        </Box>
      </Box>

      <style jsx global>{`
        @media print {
          html, body { background: white !important; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; border: none !important; }
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
