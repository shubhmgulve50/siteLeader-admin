"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Print as PrintIcon, WhatsApp as WhatsAppIcon } from "@mui/icons-material";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";

interface Log {
  _id: string;
  issueSlipNumber?: string;
  type: "In" | "Out";
  quantity: number;
  materialId?: { _id: string; name: string; unit: string };
  siteId?: { _id: string; name: string; address?: string };
  issuedTo?: string;
  purpose?: string;
  description?: string;
  vendorName?: string;
  invoiceReference?: string;
  createdBy?: { name: string };
  createdAt: string;
  date?: string;
}

export default function MaterialSlipPrintPage() {
  const { id } = useParams();
  const [log, setLog] = useState<Log | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(apiEndpoints.materials.logById(id as string));
        setLog(res.data.data);
      } catch {
        setLog(null);
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
  if (!log) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography>Issue slip not found</Typography>
      </Box>
    );
  }

  const isOut = log.type === "Out";
  const title = isOut ? "MATERIAL ISSUE SLIP" : "STOCK ARRIVAL NOTE";
  const slipNumber = log.issueSlipNumber || "—";
  const material = log.materialId;
  const site = log.siteId;

  const handleWA = () => {
    const text = isOut
      ? `*Material Issue Slip ${slipNumber}*\nMaterial: ${material?.name || ""}\nQty: ${log.quantity} ${material?.unit || ""}\nIssued To: ${log.issuedTo || "—"}\nPurpose: ${log.purpose || "—"}\nSite: ${site?.name || "—"}\nDate: ${formatDateIN(log.date || log.createdAt)}`
      : `*Stock Arrival Note*\nMaterial: ${material?.name || ""}\nQty: ${log.quantity} ${material?.unit || ""}\nVendor: ${log.vendorName || "—"}\nDate: ${formatDateIN(log.date || log.createdAt)}`;
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

      {/* A5 half-sheet (148mm × 210mm) — fits 2 slips per A4 page if user prints multiple */}
      <Box
        className="sheet"
        sx={{
          maxWidth: "148mm",
          mx: "auto",
          my: 2,
          p: "10mm",
          bgcolor: "#fff",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          color: "#111",
          fontSize: 12,
          fontFamily: "'Inter', Arial, sans-serif",
          minHeight: "210mm",
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", borderBottom: "2px solid #111", pb: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 900, letterSpacing: 1 }}>{title}</Typography>
          <Typography sx={{ fontSize: 10, color: "#555", mt: 0.25 }}>
            {isOut ? "Acknowledgement of material issued from store" : "Receipt acknowledgement"}
          </Typography>
        </Box>

        {/* Slip meta */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 9, color: "#777", fontWeight: 700, textTransform: "uppercase" }}>Slip No.</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 900 }}>{slipNumber}</Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography sx={{ fontSize: 9, color: "#777", fontWeight: 700, textTransform: "uppercase" }}>Date</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 900 }}>{formatDateIN(log.date || log.createdAt)}</Typography>
          </Box>
        </Box>

        {/* Site */}
        {site && (
          <Box sx={{ mb: 2, p: 1, bgcolor: "grey.100", borderRadius: 1 }}>
            <Typography sx={{ fontSize: 9, color: "#777", fontWeight: 700, textTransform: "uppercase" }}>Site / Project</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{site.name}</Typography>
            {site.address && <Typography sx={{ fontSize: 10, color: "#444" }}>{site.address}</Typography>}
          </Box>
        )}

        {/* Material table */}
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mb: 3, fontSize: 12 }}>
          <Box component="thead" sx={{ bgcolor: "#111", color: "#fff" }}>
            <tr>
              <Box component="th" sx={{ p: 1, textAlign: "left" }}>Material</Box>
              <Box component="th" sx={{ p: 1, textAlign: "right", width: "25%" }}>Quantity</Box>
              <Box component="th" sx={{ p: 1, textAlign: "center", width: "20%" }}>Unit</Box>
            </tr>
          </Box>
          <Box component="tbody">
            <tr>
              <Box component="td" sx={{ p: 1.5, border: "1px solid #e5e7eb", fontWeight: 700, fontSize: 14 }}>
                {material?.name || "—"}
              </Box>
              <Box component="td" sx={{ p: 1.5, border: "1px solid #e5e7eb", textAlign: "right", fontWeight: 900, fontSize: 16 }}>
                {log.quantity}
              </Box>
              <Box component="td" sx={{ p: 1.5, border: "1px solid #e5e7eb", textAlign: "center", fontWeight: 700 }}>
                {material?.unit || "—"}
              </Box>
            </tr>
          </Box>
        </Box>

        {/* Context rows */}
        {isOut ? (
          <Box sx={{ mb: 3 }}>
            <Row label="Issued To" value={log.issuedTo || "—"} />
            <Row label="Purpose" value={log.purpose || "—"} />
            {log.description && <Row label="Remarks" value={log.description} />}
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Row label="Vendor" value={log.vendorName || "—"} />
            <Row label="Invoice / Bill Ref." value={log.invoiceReference || "—"} />
            {log.description && <Row label="Remarks" value={log.description} />}
          </Box>
        )}

        {log.createdBy?.name && (
          <Typography sx={{ fontSize: 10, color: "#666", mb: 4 }}>
            Recorded by: <strong>{log.createdBy.name}</strong>
          </Typography>
        )}

        {/* Signatures */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, mt: "auto", pt: 6 }}>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Issued By / Store Keeper</Typography>
            <Typography sx={{ fontSize: 9, color: "#666" }}>Signature</Typography>
          </Box>
          <Box sx={{ borderTop: "1px solid #111", pt: 0.5, textAlign: "right" }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700 }}>
              {isOut ? "Received By" : "Verified By"}
            </Typography>
            <Typography sx={{ fontSize: 9, color: "#666" }}>Signature &amp; Thumb</Typography>
          </Box>
        </Box>
      </Box>

      <style jsx global>{`
        @media print {
          html, body { background: white !important; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; }
          @page { size: A5; margin: 0; }
        }
      `}</style>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", py: 0.75, borderBottom: "1px dashed #ccc" }}>
      <Box sx={{ width: "35%" }}>
        <Typography sx={{ fontSize: 10, color: "#777", fontWeight: 700, textTransform: "uppercase" }}>{label}</Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{value}</Typography>
      </Box>
    </Box>
  );
}
