"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  Business as SiteIcon,
  People as LabourIcon,
  Inventory2 as MaterialIcon,
  Description as QuoteIcon,
  ReceiptLong as InvoiceIcon,
  Store as VendorIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  KeyboardCommandKey as CmdIcon,
} from "@mui/icons-material";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatINRFull } from "@/utils/format";

interface Result {
  id: string;
  group: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  path: string;
  meta?: string;
  score: number;
}

interface CachedData {
  sites: Array<{ _id: string; name: string; clientName?: string; status?: string; city?: string }>;
  labour: Array<{ _id: string; name: string; type?: string; phoneNumber?: string }>;
  materials: Array<{ _id: string; name: string; unit?: string; currentStock?: number }>;
  quotations: Array<{ _id: string; quotationNumber: string; clientName?: string; totalAmount?: number }>;
  invoices: Array<{ _id: string; invoiceNumber: string; clientName?: string; totalAmount?: number }>;
  raBills: Array<{ _id: string; raNumber: string; clientName?: string; totalAmount?: number }>;
  vendors: Array<{ _id: string; name: string; phone?: string; gstin?: string; outstandingAmount?: number }>;
}

const EMPTY: CachedData = {
  sites: [],
  labour: [],
  materials: [],
  quotations: [],
  invoices: [],
  raBills: [],
  vendors: [],
};

// Simple fuzzy: returns score 0-100 (higher = better), or -1 if no match
function fuzzy(text: string, q: string): number {
  if (!q) return 0;
  const t = text.toLowerCase();
  const query = q.toLowerCase();
  if (t.includes(query)) {
    return t.indexOf(query) === 0 ? 100 : 80;
  }
  // Character-in-order subsequence match
  let i = 0;
  let last = -1;
  let gap = 0;
  for (const c of t) {
    if (c === query[i]) {
      if (last >= 0) gap += i - last;
      last = i;
      i += 1;
      if (i === query.length) {
        return Math.max(0, 50 - gap);
      }
    }
  }
  return -1;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cache, setCache] = useState<CachedData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l, m, qt, inv, ra, v] = await Promise.all([
        api.get(apiEndpoints.sites.base).catch(() => ({ data: { data: [] } })),
        api.get(apiEndpoints.labours.base).catch(() => ({ data: { data: [] } })),
        api.get(apiEndpoints.materials.base).catch(() => ({ data: { data: [] } })),
        api.get(apiEndpoints.quotations.base).catch(() => ({ data: { data: [] } })),
        api.get(apiEndpoints.invoices.base).catch(() => ({ data: { data: [] } })),
        api.get(apiEndpoints.raBills.base).catch(() => ({ data: { data: [] } })),
        api.get(apiEndpoints.vendors.base).catch(() => ({ data: { data: [] } })),
      ]);
      setCache({
        sites: s.data.data || [],
        labour: l.data.data || [],
        materials: m.data.data || [],
        quotations: qt.data.data || [],
        invoices: inv.data.data || [],
        raBills: ra.data.data || [],
        vendors: v.data.data || [],
      });
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Load cache on first open
  useEffect(() => {
    if (open && !hasLoaded && !loading) {
      load();
    }
  }, [open, hasLoaded, loading, load]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQ("");
      setActiveIdx(0);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    if (!q.trim()) return [];
    const all: Result[] = [];

    const push = (r: Omit<Result, "score"> & { fields: string[] }) => {
      const best = Math.max(...r.fields.map((f) => fuzzy(f || "", q)));
      if (best >= 0) {
        all.push({ ...r, score: best });
      }
    };

    cache.sites.forEach((s) =>
      push({
        id: s._id,
        group: "Sites",
        icon: <SiteIcon fontSize="small" color="info" />,
        title: s.name,
        subtitle: [s.clientName, s.city, s.status].filter(Boolean).join(" • "),
        path: `/admin/sites/${s._id}`,
        fields: [s.name, s.clientName || "", s.city || ""],
      })
    );
    cache.labour.forEach((l) =>
      push({
        id: l._id,
        group: "Labour",
        icon: <LabourIcon fontSize="small" color="success" />,
        title: l.name,
        subtitle: [l.type, l.phoneNumber].filter(Boolean).join(" • "),
        path: `/admin/labours`,
        fields: [l.name, l.type || "", l.phoneNumber || ""],
      })
    );
    cache.materials.forEach((m) =>
      push({
        id: m._id,
        group: "Materials",
        icon: <MaterialIcon fontSize="small" color="warning" />,
        title: m.name,
        subtitle: `Stock: ${m.currentStock ?? 0} ${m.unit || ""}`,
        path: `/admin/materials`,
        fields: [m.name],
      })
    );
    cache.quotations.forEach((x) =>
      push({
        id: x._id,
        group: "Quotations",
        icon: <QuoteIcon fontSize="small" color="primary" />,
        title: x.quotationNumber,
        subtitle: x.clientName,
        meta: formatINRFull(x.totalAmount || 0),
        path: `/admin/quotations`,
        fields: [x.quotationNumber, x.clientName || ""],
      })
    );
    cache.invoices.forEach((x) =>
      push({
        id: x._id,
        group: "Invoices",
        icon: <InvoiceIcon fontSize="small" color="error" />,
        title: x.invoiceNumber,
        subtitle: x.clientName,
        meta: formatINRFull(x.totalAmount || 0),
        path: `/admin/invoices`,
        fields: [x.invoiceNumber, x.clientName || ""],
      })
    );
    cache.raBills.forEach((x) =>
      push({
        id: x._id,
        group: "RA Bills",
        icon: <InvoiceIcon fontSize="small" color="secondary" />,
        title: x.raNumber,
        subtitle: x.clientName,
        meta: formatINRFull(x.totalAmount || 0),
        path: `/admin/ra-bills`,
        fields: [x.raNumber, x.clientName || ""],
      })
    );
    cache.vendors.forEach((v) =>
      push({
        id: v._id,
        group: "Vendors",
        icon: <VendorIcon fontSize="small" color="action" />,
        title: v.name,
        subtitle: [v.phone, v.gstin].filter(Boolean).join(" • "),
        meta: v.outstandingAmount && v.outstandingAmount > 0 ? formatINRFull(v.outstandingAmount) : undefined,
        path: `/admin/vendors`,
        fields: [v.name, v.phone || "", v.gstin || ""],
      })
    );

    return all.sort((a, b) => b.score - a.score).slice(0, 40);
  }, [q, cache]);

  // Group results
  const grouped = useMemo(() => {
    const map: Record<string, Result[]> = {};
    results.forEach((r) => {
      if (!map[r.group]) map[r.group] = [];
      map[r.group].push(r);
    });
    return map;
  }, [results]);

  const flatOrdered = useMemo(() => {
    const order = ["Sites", "Milestones", "Labour", "Materials", "Quotations", "Invoices", "RA Bills", "Vendors"];
    const out: Result[] = [];
    order.forEach((g) => {
      if (grouped[g]) out.push(...grouped[g]);
    });
    return out;
  }, [grouped]);

  const handleSelect = (r: Result) => {
    router.push(r.path);
    setOpen(false);
  };

  // Keyboard nav within dialog
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatOrdered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && flatOrdered[activeIdx]) {
      e.preventDefault();
      handleSelect(flatOrdered[activeIdx]);
    }
  };

  useEffect(() => {
    setActiveIdx(0);
  }, [q]);

  return (
    <>
      <Tooltip title="Search (Ctrl+K)">
        <IconButton size="small" onClick={() => setOpen(true)}>
          <SearchIcon />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, mt: 6, alignSelf: "flex-start" } }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "grey.200" }}>
          <TextField
            autoFocus
            fullWidth
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search sites, labour, materials, quotations, invoices, vendors..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {loading ? <CircularProgress size={18} /> : <SearchIcon color="action" />}
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Chip
                    icon={<CmdIcon sx={{ fontSize: 14 }} />}
                    label="K"
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontFamily: "monospace" }}
                  />
                  {q && (
                    <IconButton size="small" onClick={() => setQ("")} sx={{ ml: 0.5 }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
              sx: { fontSize: 16, fontWeight: 600 },
            }}
          />
        </Box>
        <DialogContent sx={{ p: 0, minHeight: 200, maxHeight: 500 }}>
          {!q.trim() ? (
            <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="body2">
                Type to search across all records. Use <strong>↑ ↓</strong> to navigate, <strong>Enter</strong> to open, <strong>Esc</strong> to close.
              </Typography>
              {loading && <Typography variant="caption">Loading index...</Typography>}
            </Box>
          ) : flatOrdered.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="body2">No results for &quot;{q}&quot;</Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {Object.entries(grouped).map(([group, items]) => (
                <React.Fragment key={group}>
                  <ListSubheader sx={{ bgcolor: "grey.50", fontWeight: 800, letterSpacing: 0.5, fontSize: 11 }}>
                    {group.toUpperCase()} ({items.length})
                  </ListSubheader>
                  {items.map((r) => {
                    const idxInFlat = flatOrdered.indexOf(r);
                    const active = idxInFlat === activeIdx;
                    return (
                      <ListItemButton
                        key={r.id}
                        selected={active}
                        onClick={() => handleSelect(r)}
                        onMouseEnter={() => setActiveIdx(idxInFlat)}
                        sx={{ px: 2 }}
                      >
                        <Box sx={{ mr: 1.5, display: "flex" }}>{r.icon}</Box>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {r.title}
                            </Typography>
                          }
                          secondary={r.subtitle}
                        />
                        {r.meta && (
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", ml: 1 }}>
                            {r.meta}
                          </Typography>
                        )}
                      </ListItemButton>
                    );
                  })}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
