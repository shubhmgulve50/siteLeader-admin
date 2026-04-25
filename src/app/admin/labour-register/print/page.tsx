"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Print as PrintIcon, WhatsApp as WhatsAppIcon } from "@mui/icons-material";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatINRFull } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";

interface SummaryRow {
  labour: { _id: string; name: string; type: string; dailyWage: number };
  present: number;
  halfDay: number;
  absent: number;
  totalDays: number;
  earnings: number;
  advance: number;
  balance: number;
}

interface Site {
  _id: string;
  name: string;
  address?: string;
  clientName?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function LabourRegisterPrintPage() {
  const params = useSearchParams();
  const siteId = params.get("siteId") || "";
  const month = Number(params.get("month") || new Date().getMonth() + 1);
  const year = Number(params.get("year") || new Date().getFullYear());

  const [site, setSite] = useState<Site | null>(null);
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!siteId) {
        setLoading(false);
        return;
      }
      try {
        const [siteRes, summaryRes] = await Promise.all([
          api.get(apiEndpoints.sites.byId(siteId)),
          api.get(apiEndpoints.sites.attendanceSummary(siteId), {
            params: { month, year },
          }),
        ]);
        setSite(siteRes.data.data);
        setRows(summaryRes.data.data);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [siteId, month, year]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!siteId) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography>Missing siteId parameter</Typography>
      </Box>
    );
  }

  const totals = rows.reduce(
    (acc, r) => ({
      earnings: acc.earnings + r.earnings,
      advance: acc.advance + (r.advance || 0),
      balance: acc.balance + (r.balance ?? r.earnings - (r.advance || 0)),
    }),
    { earnings: 0, advance: 0, balance: 0 }
  );

  const handleWA = () => {
    const text = `*Labour Payment Register*\nSite: ${site?.name || ""}\nMonth: ${MONTHS[month - 1]} ${year}\nTotal Earnings: ${formatINRFull(totals.earnings)}\nAdvances: ${formatINRFull(totals.advance)}\nBalance Due: ${formatINRFull(totals.balance)}`;
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
          maxWidth: "297mm", // A4 landscape width
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
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 2, borderBottom: "2px solid #111", pb: 1 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>
            LABOUR PAYMENT REGISTER
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 700, mt: 0.5 }}>
            {site?.name || "Site"} — {MONTHS[month - 1]} {year}
          </Typography>
          {site?.address && (
            <Typography sx={{ fontSize: 10, color: "#555" }}>{site.address}</Typography>
          )}
        </Box>

        {/* Table */}
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 10, mb: 2 }}>
          <Box component="thead" sx={{ bgcolor: "#111", color: "#fff" }}>
            <tr>
              <Box component="th" sx={{ p: 0.75, textAlign: "left", width: "4%" }}>#</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "left", width: "16%" }}>Name</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "left", width: "10%" }}>Category</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "7%" }}>Rate ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "center", width: "5%" }}>P</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "center", width: "5%" }}>HD</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "center", width: "5%" }}>A</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "center", width: "5%" }}>Total</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "10%" }}>Earnings ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "9%" }}>Advance ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "right", width: "10%" }}>Balance ₹</Box>
              <Box component="th" sx={{ p: 0.75, textAlign: "center", width: "14%" }}>Signature / Thumb</Box>
            </tr>
          </Box>
          <Box component="tbody">
            {rows.length === 0 ? (
              <tr>
                <Box component="td" colSpan={12} sx={{ p: 2, textAlign: "center", color: "#666" }}>
                  No attendance recorded for this month.
                </Box>
              </tr>
            ) : (
              rows.map((r, i) => {
                const bal = r.balance ?? r.earnings - (r.advance || 0);
                return (
                  <tr key={r.labour._id}>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb" }}>{i + 1}</Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", fontWeight: 700 }}>{r.labour.name}</Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb" }}>{r.labour.type}</Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{r.labour.dailyWage.toLocaleString("en-IN")}</Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>{r.present}</Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>{r.halfDay}</Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>{r.absent}</Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>{r.totalDays}</Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", fontWeight: 700 }}>{r.earnings.toLocaleString("en-IN")}</Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", color: "#b45309" }}>{(r.advance || 0).toLocaleString("en-IN")}</Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", textAlign: "right", fontWeight: 900, color: bal >= 0 ? "#166534" : "#b91c1c" }}>
                      {bal.toLocaleString("en-IN")}
                    </Box>
                    <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e5e7eb", height: 28 }}></Box>
                  </tr>
                );
              })
            )}
          </Box>
          {rows.length > 0 && (
            <Box component="tfoot" sx={{ bgcolor: "#f3f4f6", fontWeight: 900 }}>
              <tr>
                <Box component="td" colSpan={8} sx={{ p: 1, textAlign: "right" }}>TOTAL</Box>
                <Box component="td" sx={{ p: 1, textAlign: "right" }}>{totals.earnings.toLocaleString("en-IN")}</Box>
                <Box component="td" sx={{ p: 1, textAlign: "right", color: "#b45309" }}>{totals.advance.toLocaleString("en-IN")}</Box>
                <Box component="td" sx={{ p: 1, textAlign: "right", color: totals.balance >= 0 ? "#166534" : "#b91c1c" }}>
                  {totals.balance.toLocaleString("en-IN")}
                </Box>
                <Box component="td" sx={{ p: 1 }}></Box>
              </tr>
            </Box>
          )}
        </Box>

        {/* Totals box */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, mb: 2 }}>
          <Box sx={{ p: 1.5, border: "1px solid #ccc", borderRadius: 1, textAlign: "center" }}>
            <Typography sx={{ fontSize: 9, color: "#777", textTransform: "uppercase", fontWeight: 700 }}>Gross Earnings</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: "#1e40af" }}>{formatINRFull(totals.earnings)}</Typography>
          </Box>
          <Box sx={{ p: 1.5, border: "1px solid #ccc", borderRadius: 1, textAlign: "center" }}>
            <Typography sx={{ fontSize: 9, color: "#777", textTransform: "uppercase", fontWeight: 700 }}>Total Advances</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: "#b45309" }}>{formatINRFull(totals.advance)}</Typography>
          </Box>
          <Box sx={{ p: 1.5, border: "1px solid #ccc", borderRadius: 1, textAlign: "center" }}>
            <Typography sx={{ fontSize: 9, color: "#777", textTransform: "uppercase", fontWeight: 700 }}>Net Payable</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: totals.balance >= 0 ? "#166534" : "#b91c1c" }}>
              {formatINRFull(totals.balance)}
            </Typography>
          </Box>
        </Box>

        {/* Signatures */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, mt: 4 }}>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Prepared By</Typography>
            <Typography sx={{ fontSize: 9, color: "#666" }}>Site Supervisor</Typography>
          </Box>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5, textAlign: "center" }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Verified By</Typography>
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
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>
    </Box>
  );
}
