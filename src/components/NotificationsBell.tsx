"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Notifications as BellIcon,
  NotificationsActive as BellActiveIcon,
  EventBusy as OverdueIcon,
  HowToReg as ApprovalIcon,
  Inventory as StockIcon,
  Schedule as TimelineIcon,
  Warning as WarningIcon,
  AccountBalance as VendorIcon,
} from "@mui/icons-material";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN, formatINRFull } from "@/utils/format";

interface Notif {
  id: string;
  severity: "warning" | "error" | "info";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  path: string;
  weight: number; // for sort
}

const REFRESH_MS = 5 * 60 * 1000; // 5 min

export default function NotificationsBell() {
  const router = useRouter();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [invRes, matRes, sitesRes, vendorsRes, pendingRes] = await Promise.all([
        api.get(apiEndpoints.invoices.base).catch(() => ({ data: { data: [] } })),
        api.get(apiEndpoints.materials.base).catch(() => ({ data: { data: [] } })),
        api.get(apiEndpoints.sites.base).catch(() => ({ data: { data: [] } })),
        api.get(apiEndpoints.vendors.base).catch(() => ({ data: { data: [] } })),
        api.get(apiEndpoints.finance.pendingApprovals).catch(() => ({ data: { data: [] } })),
      ]);

      const list: Notif[] = [];
      const now = Date.now();

      // Overdue invoices
      (invRes.data.data || []).forEach((inv: { _id: string; invoiceNumber: string; clientName: string; dueDate?: string; paymentStatus: string; totalAmount: number; paidAmount: number }) => {
        if (inv.paymentStatus === "PAID") return;
        if (!inv.dueDate) return;
        const dueMs = new Date(inv.dueDate).getTime();
        if (dueMs < now) {
          const daysOverdue = Math.floor((now - dueMs) / (1000 * 60 * 60 * 24));
          const outstanding = inv.totalAmount - (inv.paidAmount || 0);
          list.push({
            id: `inv-${inv._id}`,
            severity: "error",
            icon: <OverdueIcon fontSize="small" />,
            title: `Invoice ${inv.invoiceNumber} overdue`,
            subtitle: `${inv.clientName} • ${formatINRFull(outstanding)} • ${daysOverdue}d overdue`,
            path: "/admin/invoices",
            weight: 100 + daysOverdue,
          });
        }
      });

      // Low-stock materials
      (matRes.data.data || []).forEach((m: { _id: string; name: string; unit: string; currentStock: number; minStock: number }) => {
        if (m.minStock > 0 && m.currentStock <= m.minStock) {
          list.push({
            id: `mat-${m._id}`,
            severity: m.currentStock === 0 ? "error" : "warning",
            icon: <StockIcon fontSize="small" />,
            title: m.currentStock === 0 ? `${m.name} OUT of stock` : `${m.name} low stock`,
            subtitle: `${m.currentStock}/${m.minStock} ${m.unit}`,
            path: "/admin/materials",
            weight: m.currentStock === 0 ? 90 : 60,
          });
        }
      });

      // Sites ending soon
      (sitesRes.data.data || []).forEach((s: { _id: string; name: string; endDate?: string; status?: string }) => {
        if (!s.endDate) return;
        if (s.status && s.status !== "Ongoing") return;
        const endMs = new Date(s.endDate).getTime();
        const daysLeft = Math.ceil((endMs - now) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) {
          list.push({
            id: `site-${s._id}`,
            severity: "error",
            icon: <TimelineIcon fontSize="small" />,
            title: `${s.name} past due`,
            subtitle: `${Math.abs(daysLeft)} days past target end`,
            path: `/admin/sites/${s._id}`,
            weight: 80 + Math.abs(daysLeft),
          });
        } else if (daysLeft <= 7) {
          list.push({
            id: `site-${s._id}`,
            severity: "warning",
            icon: <TimelineIcon fontSize="small" />,
            title: `${s.name} ending soon`,
            subtitle: `${daysLeft === 0 ? "Due today" : `${daysLeft} days left`} • ${formatDateIN(s.endDate)}`,
            path: `/admin/sites/${s._id}`,
            weight: 40,
          });
        }
      });

      // High vendor outstanding
      (vendorsRes.data.data || []).forEach((v: { _id: string; name: string; outstandingAmount: number; paymentTermsDays: number }) => {
        if (v.outstandingAmount && v.outstandingAmount > 100000) {
          list.push({
            id: `vendor-${v._id}`,
            severity: "warning",
            icon: <VendorIcon fontSize="small" />,
            title: `${v.name} — large outstanding`,
            subtitle: formatINRFull(v.outstandingAmount),
            path: "/admin/vendors",
            weight: 30,
          });
        }
      });

      // Pending expense approvals
      (pendingRes.data.data || []).forEach((tx: { _id: string; amount: number; category: string; createdBy?: { name: string }; siteId?: { name: string } }) => {
        list.push({
          id: `approval-${tx._id}`,
          severity: "warning",
          icon: <ApprovalIcon fontSize="small" />,
          title: `Expense needs approval — ${formatINRFull(tx.amount)}`,
          subtitle: `${tx.category}${tx.siteId ? ` • ${tx.siteId.name}` : ""}${tx.createdBy ? ` • by ${tx.createdBy.name}` : ""}`,
          path: "/admin/finance?filter=pending",
          weight: 70,
        });
      });

      list.sort((a, b) => b.weight - a.weight);
      setNotifs(list);
      setLastFetched(new Date());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchAll]);

  const count = notifs.length;
  const hasCritical = useMemo(() => notifs.some((n) => n.severity === "error"), [notifs]);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(e.currentTarget);
    // Refresh on open if stale (>60s)
    if (!lastFetched || Date.now() - lastFetched.getTime() > 60_000) {
      fetchAll();
    }
  };

  const handleSelect = (n: Notif) => {
    router.push(n.path);
    setAnchor(null);
  };

  return (
    <>
      <Tooltip title={count > 0 ? `${count} notification${count > 1 ? "s" : ""}` : "No notifications"}>
        <IconButton onClick={handleOpen} size="small">
          <Badge
            badgeContent={count}
            color={hasCritical ? "error" : "warning"}
            max={99}
            overlap="circular"
          >
            {count > 0 ? <BellActiveIcon /> : <BellIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 1, width: { xs: 320, sm: 400 }, maxHeight: 500, borderRadius: 2 } } }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "grey.200", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Notifications
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {count > 0 && (
              <Chip
                label={`${count} pending`}
                size="small"
                color={hasCritical ? "error" : "warning"}
                sx={{ fontWeight: 700 }}
              />
            )}
            <Button size="small" onClick={fetchAll} sx={{ textTransform: "none", fontSize: 11 }}>
              Refresh
            </Button>
          </Stack>
        </Box>
        {notifs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <BellIcon sx={{ fontSize: 40, color: "grey.400" }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 700 }}>
              All caught up
            </Typography>
            <Typography variant="caption" color="text.disabled">
              No overdue bills, low stock, or upcoming deadlines
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {notifs.map((n, i) => (
              <React.Fragment key={n.id}>
                <ListItemButton onClick={() => handleSelect(n)} sx={{ px: 2, py: 1.25 }}>
                  <Box
                    sx={{
                      mr: 1.5,
                      display: "flex",
                      p: 1,
                      borderRadius: "50%",
                      bgcolor:
                        n.severity === "error"
                          ? "error.50"
                          : n.severity === "warning"
                            ? "warning.50"
                            : "info.50",
                      color:
                        n.severity === "error"
                          ? "error.main"
                          : n.severity === "warning"
                            ? "warning.main"
                            : "info.main",
                    }}
                  >
                    {n.icon}
                  </Box>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {n.title}
                      </Typography>
                    }
                    secondary={n.subtitle}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                  {n.severity === "error" && (
                    <WarningIcon fontSize="small" color="error" sx={{ ml: 1 }} />
                  )}
                </ListItemButton>
                {i < notifs.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
        {lastFetched && (
          <Box sx={{ p: 1, borderTop: "1px solid", borderColor: "grey.200", textAlign: "center" }}>
            <Typography variant="caption" color="text.disabled">
              Updated {formatDateIN(lastFetched, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
}
