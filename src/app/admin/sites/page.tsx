"use client";

import { toast } from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Add as AddIcon,
  AssignmentInd as AttendanceIcon,
  Construction as ConstructionIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AccountBalanceWallet as FinanceIcon,
  InfoOutlined as InfoIcon,
  PeopleAlt as LabourIcon,
  HistoryEdu as LogIcon,
  Inventory2 as MaterialIcon,
  Refresh as RefreshIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import GlassFab from "@/components/common/GlassFab";
import GenericTable from "@/components/common/GenericTable";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import { ROLE } from "@/constants/constants";
import api from "@/lib/axios";
import { buildSiteSummary, shareOnWhatsApp } from "@/utils/share";
import { useT } from "@/i18n/LocaleProvider";
import { HEADER_BTN_SX, WA_GREEN } from "@/styles/tokens";

interface Site {
  _id: string;
  name: string;
  phoneNumber?: string;
  address?: string;
  clientName?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
  projectType?: string;
  status?: string;
  supervisor?: string;
  engineer?: string;
  priority?: string;
  estimatedBudget?: number;
  notes?: string;
  builderId: string;
  createdAt: string;
}

interface User {
  _id: string;
  role: string;
  name: string;
}

export default function SitesPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const t = useT();
  const [sites, setSites] = useState<Site[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // Management Drawer States
  const [openManageDrawer, setOpenManageDrawer] = useState(false);
  const [managingSite, setManagingSite] = useState<any | null>(null);
  // Expanded Form State
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    address: "",
    startDate: new Date().toISOString().split("T")[0],
    clientName: "",
    city: "",
    latitude: "",
    longitude: "",
    endDate: "",
    projectType: "Residential",
    status: "Not Started",
    supervisor: "",
    engineer: "",
    priority: "Medium",
    estimatedBudget: "",
    notes: "",
  });

  const checkUser = async () => {
    try {
      const response = await api.get(apiEndpoints.adminProfile);
      setUser(response.data.data);
    } catch {
      // Not critical
    }
  };

  const fetchSites = async () => {
    setLoading(true);
    try {
      const response = await api.get(apiEndpoints.sites.base);
      setSites(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch sites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
    fetchSites();
  }, []);

  const canManage =
    user?.role === ROLE.SUPER_ADMIN || user?.role === ROLE.BUILDER;

  const handleOpenDialog = (site?: any) => {
    if (!canManage) return;
    if (site) {
      setSelectedSite(site);
      setFormData({
        name: site.name || "",
        phoneNumber: site.phoneNumber || "",
        address: site.address || "",
        startDate: site.startDate
          ? site.startDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        clientName: site.clientName || "",
        city: site.city || "",
        latitude: site.latitude?.toString() || "",
        longitude: site.longitude?.toString() || "",
        endDate: site.endDate ? site.endDate.split("T")[0] : "",
        projectType: site.projectType || "Residential",
        status: site.status || "Not Started",
        supervisor: site.supervisor || "",
        engineer: site.engineer || "",
        priority: site.priority || "Medium",
        estimatedBudget: site.estimatedBudget?.toString() || "",
        notes: site.notes || "",
      });
    } else {
      setSelectedSite(null);
      setFormData({
        name: "",
        phoneNumber: "",
        address: "",
        startDate: new Date().toISOString().split("T")[0],
        clientName: "",
        city: "",
        latitude: "",
        longitude: "",
        endDate: "",
        projectType: "Residential",
        status: "Not Started",
        supervisor: "",
        engineer: "",
        priority: "Medium",
        estimatedBudget: "",
        notes: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSite(null);
  };

  const handleSubmit = async () => {
    if (
      !formData.name.trim() ||
      !formData.phoneNumber ||
      !formData.address ||
      !formData.startDate
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setDialogLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        estimatedBudget: formData.estimatedBudget
          ? Number(formData.estimatedBudget)
          : undefined,
      };

      if (selectedSite) {
        await api.put(apiEndpoints.sites.byId(selectedSite._id), payload);
        toast.success("Site updated successfully");
      } else {
        await api.post(apiEndpoints.sites.base, payload);
        toast.success("Site created successfully");
      }
      handleCloseDialog();
      fetchSites();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleOpenManage = (site: any) => {
    router.push(`/admin/sites/${site._id}`);
  };

  const handleCloseManage = () => {
    setOpenManageDrawer(false);
    setManagingSite(null);
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this site?")) return;

    try {
      await api.delete(apiEndpoints.sites.byId(id));
      toast.success("Site deleted successfully");
      fetchSites();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions
        pageTitle={t("page.sitesTitle")}
        pageIcon={<ConstructionIcon />}
        onRefreshAction={fetchSites}
        handleSearch={(q) => setSearchQuery(q)}
        actions={[
          canManage && (
            <Button
              key="new-site"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ ...HEADER_BTN_SX, display: { xs: "none", md: "inline-flex" } }}
            >
              {t("action.addSite")}
            </Button>
          ),
        ].filter((btn): btn is React.ReactElement => Boolean(btn))}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <GenericTable
        mobileCard
        columns={[
          {
            id: "name",
            label: "Site Name",
            isPrimaryOnMobile: true,
            render: (v) => <Typography>{v}</Typography>,
          },
          {
            id: "phoneNumber",
            label: "Contact",
            mobileLabel: "Phone",
            render: (v) => (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {v || "N/A"}
              </Typography>
            ),
          },
          {
            id: "address",
            label: "Location",
            hiddenOnMobile: true,
            render: (v) => (
              <Typography
                variant="caption"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  maxWidth: 200,
                }}
              >
                {v || "N/A"}
              </Typography>
            ),
          },
          {
            id: "status",
            label: "Status",
            isSecondaryBadge: true,
            render: (v) => (
              <Chip
                label={v || "Not Started"}
                size="small"
                color={
                  v === "Completed"
                    ? "success"
                    : v === "Ongoing"
                      ? "warning"
                      : "default"
                }
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              />
            ),
          },
          {
            id: "priority",
            label: "Priority",
            render: (v) => (
              <Chip
                label={v || "Medium"}
                size="small"
                variant="outlined"
                color={
                  v === "High" ? "error" : v === "Medium" ? "info" : "success"
                }
                sx={{ fontWeight: 600, borderWeight: 2 }}
              />
            ),
          },
          {
            id: "createdAt",
            label: "Onboarded",
            hiddenOnMobile: true,
            render: (v) =>
              new Date(v).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
          },
          ...(canManage
            ? [
                {
                  id: "actions",
                  label: "Actions",
                  align: "right" as const,
                  isActionColumn: true,
                  render: (_: any, row: Site) => (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenManage(row)}
                        sx={{
                          color: "info.main",
                          bgcolor: (theme) =>
                            alpha(theme.palette.info.main, 0.08),
                          borderRadius: 2,
                          mr: 1,
                          "&:hover": {
                            bgcolor: (theme) =>
                              alpha(theme.palette.info.main, 0.15),
                          },
                        }}
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => shareOnWhatsApp(buildSiteSummary(row))}
                        sx={{
                          color: WA_GREEN,
                          bgcolor: alpha(WA_GREEN, 0.08),
                          borderRadius: 2,
                          mr: 1,
                          "&:hover": { bgcolor: alpha(WA_GREEN, 0.15) },
                        }}
                      >
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(row)}
                        sx={{
                          color: "primary.main",
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.08),
                          borderRadius: 2,
                          mr: 1,
                          "&:hover": {
                            bgcolor: (theme) =>
                              alpha(theme.palette.primary.main, 0.15),
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(row._id)}
                        sx={{
                          color: "error.main",
                          bgcolor: (theme) =>
                            alpha(theme.palette.error.main, 0.08),
                          borderRadius: 2,
                          "&:hover": {
                            bgcolor: (theme) =>
                              alpha(theme.palette.error.main, 0.15),
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  ),
                },
              ]
            : []),
        ]}
        data={sites.filter((s) =>
          !searchQuery ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.clientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.city || "").toLowerCase().includes(searchQuery.toLowerCase())
        )}
        loading={loading}
        emptyMessage="No sites found. Add your first site!"
      />

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, p: isMobile ? 0 : 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.5rem", pb: 1 }}>
          {selectedSite ? "Site Data Audit" : "Establish New Site"}
        </DialogTitle>
        <DialogContent dividers sx={{ borderTop: "none" }}>
          <Box component="form" sx={{ mt: 2 }}>
            {/* SECTION: REQUIRED CORE */}
            <Typography
              variant="overline"
              color="primary"
              sx={{ fontWeight: 700, mb: 2, display: "block" }}
            >
              Core Requirements
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Site Name *"
                  fullWidth
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Skyline Residency"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Phone Number *"
                  fullWidth
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  placeholder="+91 XXXXX XXXXX"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Site Address *"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Start Date *"
                  type="date"
                  fullWidth
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Client Name"
                  fullWidth
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            {/* SECTION: LOCATION */}
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, mt: 4, mb: 2, display: "block" }}
            >
              Location & Geodata
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="City"
                  fullWidth
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Latitude"
                  type="number"
                  fullWidth
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Longitude"
                  type="number"
                  fullWidth
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            {/* SECTION: PROJECT DETAILS */}
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, mt: 4, mb: 2, display: "block" }}
            >
              Project Lifecycle
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  label="Project Type"
                  fullWidth
                  value={formData.projectType}
                  onChange={(e) =>
                    setFormData({ ...formData, projectType: e.target.value })
                  }
                >
                  {["Residential", "Commercial", "Renovation"].map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  {["Not Started", "Ongoing", "Completed"].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  label="Priority"
                  fullWidth
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  {["Low", "Medium", "High"].map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Target Completion Date"
                  type="date"
                  fullWidth
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Estimated Budget (₹)"
                  type="number"
                  fullWidth
                  value={formData.estimatedBudget}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedBudget: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>

            {/* SECTION: ASSIGNMENT */}
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, mt: 4, mb: 2, display: "block" }}
            >
              Operational Assignment
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Assigned Supervisor"
                  fullWidth
                  value={formData.supervisor}
                  onChange={(e) =>
                    setFormData({ ...formData, supervisor: e.target.value })
                  }
                  placeholder="User ID or Name"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Lead Engineer"
                  fullWidth
                  value={formData.engineer}
                  onChange={(e) =>
                    setFormData({ ...formData, engineer: e.target.value })
                  }
                  placeholder="User ID or Name"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <TextField
                label="General Notes"
                fullWidth
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Strategic remarks or site constraints..."
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4 }}>
          <Button
            onClick={handleCloseDialog}
            color="inherit"
            sx={{ fontWeight: 700 }}
          >
            Dismiss
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={dialogLoading}
            sx={{
              px: 5,
              borderRadius: 2,
              fontWeight: 800,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 8px 32px rgba(10, 163, 141, 0.3)"
                  : "0 8px 32px rgba(10, 163, 141, 0.2)",
            }}
          >
            {dialogLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : selectedSite ? (
              "Synchronize Changes"
            ) : (
              "Deploy Site"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Site Management Drawer */}
      <Drawer
        anchor="right"
        open={openManageDrawer}
        onClose={handleCloseManage}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 450 },
            p: 0,
            borderRadius: "20px 0 0 20px",
          },
        }}
      >
        {managingSite && (
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {/* Drawer Header */}
            <Box sx={{ p: 3, bgcolor: "primary.main", color: "white" }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {managingSite.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Control Center & Intelligence
              </Typography>
            </Box>

            <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto" }}>
              {/* SECTION: RAPID OPERATIONS */}
              <Typography
                variant="overline"
                color="primary"
                sx={{ fontWeight: 800, mb: 2, display: "block" }}
              >
                Rapid Operations
              </Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                  {
                    label: "Labour",
                    icon: <LabourIcon />,
                    color: "#2E7D32",
                    action: "Add Labour",
                  },
                  {
                    label: "Material",
                    icon: <MaterialIcon />,
                    color: "#ED6C02",
                    action: "Add Material",
                  },
                  {
                    label: "Finance",
                    icon: <FinanceIcon />,
                    color: "#9C27B0",
                    action: "Manage Finance",
                  },
                  {
                    label: "Attendance",
                    icon: <AttendanceIcon />,
                    color: "#0288D1",
                    action: "Mark Attendance",
                  },
                  {
                    label: "Logs",
                    icon: <LogIcon />,
                    color: "#757575",
                    action: "Daily Log",
                  },
                ].map((op) => (
                  <Grid size={{ xs: 6 }} key={op.label}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={op.icon}
                      onClick={() =>
                        toast.success(
                          `${op.action} triggered for ${managingSite.name}`
                        )
                      }
                      sx={{
                        height: 60,
                        borderRadius: 3,
                        borderColor: alpha(op.color, 0.2),
                        color: op.color,
                        justifyContent: "flex-start",
                        px: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        "&:hover": {
                          borderColor: op.color,
                          bgcolor: alpha(op.color, 0.05),
                        },
                      }}
                    >
                      {op.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ mb: 3 }} />

              {/* SECTION: ABOUT SITE */}
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 800, mb: 2, display: "block" }}
              >
                Site intelligence
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  { label: "Client", value: managingSite.clientName },
                  { label: "Contact", value: managingSite.phoneNumber },
                  { label: "Address", value: managingSite.address },
                  { label: "Project Type", value: managingSite.projectType },
                  {
                    label: "Budget",
                    value: managingSite.estimatedBudget
                      ? `₹${managingSite.estimatedBudget}`
                      : null,
                  },
                  { label: "Priority", value: managingSite.priority },
                  { label: "Engineer", value: managingSite.engineer },
                  { label: "Notes", value: managingSite.notes },
                ].map(
                  (item) =>
                    item.value && (
                      <Box key={item.label}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 700, textTransform: "uppercase" }}
                        >
                          {item.label}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {item.value}
                        </Typography>
                      </Box>
                    )
                )}
              </Box>
            </Box>

            {/* Footer Actions */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCloseManage}
                sx={{ borderRadius: 2, py: 1.5, fontWeight: 800 }}
              >
                Close Control Center
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {canManage && (
        <GlassFab color="primary" onClick={() => handleOpenDialog()}>
          <AddIcon />
        </GlassFab>
      )}
    </Box>
  );
}
