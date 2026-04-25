"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  Add as AddIcon,
  Category as BoxIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  SwapHoriz as LogIcon,
  CompareArrows as TransferIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import GlassFab from "@/components/common/GlassFab";
import GenericTable from "@/components/common/GenericTable";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { useT } from "@/i18n/LocaleProvider";
import { HEADER_ICON_BTN_SX, TABLE_HEAD_SX } from "@/styles/tokens";

interface Material {
  _id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
}

interface MaterialLog {
  _id: string;
  materialId: { name: string; unit: string };
  siteId: { name: string } | null;
  type: "In" | "Out";
  quantity: number;
  description: string;
  createdAt: string;
}

interface Site {
  _id: string;
  name: string;
}

const UNITS = [
  "Bags",
  "Tons",
  "Cu.Ft.",
  "Sq.Ft.",
  "Units",
  "kg",
  "Litre",
  "Other",
];

export default function MaterialsPage() {
  const t = useT();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [tab, setTab] = useState(0);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [openMaterialDialog, setOpenMaterialDialog] = useState(false);
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );

  const [transferForm, setTransferForm] = useState({
    materialId: "",
    fromSiteId: "",
    toSiteId: "",
    quantity: "",
    description: "",
  });
  const [transferBusy, setTransferBusy] = useState(false);

  const handleTransfer = async () => {
    const { materialId, fromSiteId, toSiteId, quantity } = transferForm;
    if (!materialId || !fromSiteId || !toSiteId || !quantity) {
      return toast.error("Fill material, both sites and quantity");
    }
    if (fromSiteId === toSiteId) return toast.error("Sites must differ");
    setTransferBusy(true);
    try {
      await api.post(apiEndpoints.materials.transfer, {
        ...transferForm,
        quantity: Number(quantity),
      });
      toast.success("Transfer recorded");
      setOpenTransferDialog(false);
      setTransferForm({
        materialId: "",
        fromSiteId: "",
        toSiteId: "",
        quantity: "",
        description: "",
      });
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Transfer failed");
    } finally {
      setTransferBusy(false);
    }
  };

  // Forms
  const [mForm, setMForm] = useState({
    name: "",
    unit: "Bags",
    minStock: "0",
    initialStock: "0",
  });
  const [lForm, setLForm] = useState({
    materialId: "",
    siteId: "",
    type: "Out",
    quantity: "",
    description: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        api.get(apiEndpoints.materials.base),
        api.get(apiEndpoints.sites.base),
      ]);
      setMaterials(mRes.data.data);
      setSites(sRes.data.data);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get(apiEndpoints.materials.logs);
      setLogs(res.data.data);
    } catch {
      /* Handled */
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (tab === 2) fetchLogs();
  }, [tab]);

  const handleOpenMaterialDialog = (m?: Material) => {
    if (m) {
      setSelectedMaterial(m);
      setMForm({
        name: m.name,
        unit: m.unit,
        minStock: m.minStock.toString(),
        initialStock: m.currentStock.toString(),
      });
    } else {
      setSelectedMaterial(null);
      setMForm({ name: "", unit: "Bags", minStock: "0", initialStock: "0" });
    }
    setOpenMaterialDialog(true);
  };

  const handleSaveMaterial = async () => {
    if (!mForm.name) return;
    setDialogLoading(true);
    try {
      const payload = {
        ...mForm,
        minStock: Number(mForm.minStock),
        initialStock: Number(mForm.initialStock),
      };

      if (selectedMaterial) {
        await api.put(
          apiEndpoints.materials.byId(selectedMaterial._id),
          payload
        );
        toast.success("Catalog updated");
      } else {
        await api.post(apiEndpoints.materials.base, payload);
        toast.success("Material cataloged with initial stock");
      }
      setOpenMaterialDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!window.confirm("Delete this material permanently?")) return;
    try {
      await api.delete(apiEndpoints.materials.byId(id));
      toast.success("Material removed");
      fetchData();
    } catch {
      toast.error("Process failed");
    }
  };

  const handleLogMovement = async () => {
    if (!lForm.materialId || !lForm.quantity) return;
    setDialogLoading(true);
    try {
      await api.post(apiEndpoints.materials.log, {
        ...lForm,
        quantity: Number(lForm.quantity),
      });
      toast.success("Stock synced");
      setOpenLogDialog(false);
      fetchData();
      if (tab === 2) fetchLogs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Insufficient stock?");
    } finally {
      setDialogLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 2 } }}>
      <PageHeaderWithActions
        pageTitle={t("page.materialsTitle")}
        pageIcon={<BoxIcon />}
        onRefreshAction={fetchData}
        handleSearch={(q) => setSearchQuery(q)}
        actions={[
          <Box key="update-stock" sx={{ display: { xs: "none", md: "flex" } }}>
            <Tooltip title="Update Stock">
              <span>
                <IconButton
                  size="small"
                  disabled={materials.length === 0}
                  onClick={() => setOpenLogDialog(true)}
                  sx={HEADER_ICON_BTN_SX}
                >
                  <LogIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>,
          <Box key="transfer" sx={{ display: { xs: "none", md: "flex" } }}>
            <Tooltip title="Transfer between sites">
              <span>
                <IconButton
                  size="small"
                  disabled={materials.length === 0 || sites.length < 2}
                  onClick={() => setOpenTransferDialog(true)}
                  sx={HEADER_ICON_BTN_SX}
                >
                  <TransferIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>,
          <Box key="new-material" sx={{ display: { xs: "none", md: "flex" } }}>
            <Tooltip title="Add Material">
              <IconButton
                size="small"
                onClick={() => handleOpenMaterialDialog()}
                sx={{ ...HEADER_ICON_BTN_SX, bgcolor: "rgba(255,255,255,0.15)" }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>,
        ]}
      />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab label="Live Stock" />
        <Tab label="Material Catalog" />
        <Tab label="Activity History" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Skeleton
                  variant="rectangular"
                  height={120}
                  sx={{ borderRadius: 3 }}
                />
              </Grid>
            ))
          ) : materials.filter((m) => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
            <Box sx={{ p: 10, textAlign: "center", width: "100%" }}>
              <BoxIcon sx={{ fontSize: 60, color: "grey.300", mb: 2 }} />
              <Typography color="text.secondary">
                {searchQuery ? "No materials match your search." : "Inventory is empty."}
              </Typography>
            </Box>
          ) : (
            materials.filter((m) => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase())).map((m) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m._id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor:
                      m.currentStock <= m.minStock ? "error.light" : "grey.200",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    bgcolor:
                      m.currentStock <= m.minStock
                        ? "error.50"
                        : "background.paper",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          {m.unit}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {m.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${m.currentStock} ${m.unit}`}
                        color={
                          m.currentStock <= m.minStock ? "error" : "primary"
                        }
                        variant={
                          m.currentStock <= m.minStock ? "filled" : "outlined"
                        }
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>
                    {m.currentStock <= m.minStock && (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 2, color: "error.main" }}
                      >
                        <WarningIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Low Stock Alert
                        </Typography>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {tab === 1 && (
        <GenericTable
          mobileCard
          columns={[
            { id: "name", label: "Material Name", isPrimaryOnMobile: true },
            {
              id: "currentStock",
              label: "Stock",
              mobileLabel: "Stock",
              render: (v, row) => `${v} ${row.unit}`,
            },
            {
              id: "minStock",
              label: "Min Threshold",
              mobileLabel: "Min",
              render: (v, row) => (
                <Chip
                  label={`${v} ${row.unit}`}
                  size="small"
                  color={row.currentStock < v ? "error" : "default"}
                  variant="outlined"
                />
              ),
            },
            {
              id: "actions",
              label: "Actions",
              align: "right",
              isActionColumn: true,
              render: (_: any, row: Material) => (
                <Box>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenMaterialDialog(row)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteMaterial(row._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ),
            },
          ]}
          data={materials.filter((m) =>
            !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          loading={loading}
        />
      )}

      {tab === 2 && (
        isMobile ? (
          <Stack spacing={1.5}>
            {logs.length === 0 ? (
              <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                <Typography color="text.secondary" variant="body2">No history records.</Typography>
              </Paper>
            ) : logs.map((log) => (
              <Paper
                key={log._id}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                  bgcolor: "background.paper",
                }}
              >
                {/* Header row: material name + chip */}
                <Box sx={{ px: 2, pt: 1.5, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {log.materialId?.name}
                  </Typography>
                  <Chip
                    label={log.type === "In" ? "Stock In" : "Stock Out"}
                    color={log.type === "In" ? "success" : "warning"}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, flexShrink: 0 }}
                  />
                </Box>
                {/* Body: 2-col grid */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", px: 2, pb: 0.5, gap: 0 }}>
                  {[
                    {
                      label: "Quantity",
                      value: (
                        <Typography variant="body2" sx={{ fontWeight: 700, color: log.type === "In" ? "success.main" : "warning.main" }}>
                          {log.type === "In" ? "+" : "−"}{log.quantity} {log.materialId?.unit}
                        </Typography>
                      ),
                    },
                    {
                      label: "Site",
                      value: <Typography variant="body2" sx={{ fontWeight: 500 }}>{log.siteId?.name || "Warehouse"}</Typography>,
                    },
                  ].map((item, i) => (
                    <Box key={item.label} sx={{ py: 0.75, pr: i % 2 === 0 ? 1.5 : 0, pl: i % 2 === 1 ? 1.5 : 0, borderRight: i % 2 === 0 ? "1px solid" : "none", borderColor: "divider" }}>
                      <Typography variant="caption" sx={{ color: "text.disabled", display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600, mb: 0.2 }}>
                        {item.label}
                      </Typography>
                      {item.value}
                    </Box>
                  ))}
                </Box>
                {/* Footer: date + note */}
                <Box sx={{ px: 2, py: 0.75, bgcolor: (t) => alpha(t.palette.action.hover, 0.3), borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>
                    {new Date(log.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Typography>
                  {log.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "right", maxWidth: "55%" }} noWrap>
                      {log.description}
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))}
          </Stack>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", overflowX: "auto" }}
          >
            <Table>
              <TableHead sx={TABLE_HEAD_SX}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Material</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Movement</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Site / Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      No history records.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id} hover>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{log.materialId?.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.type === "In" ? "Stock In" : "Stock Out"}
                          color={log.type === "In" ? "success" : "warning"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {log.type === "In" ? "+" : "-"}{log.quantity} {log.materialId?.unit}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.siteId?.name || "Warehouse"}</Typography>
                        <Typography variant="caption" color="text.secondary">{log.description}</Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      <Dialog
        open={openMaterialDialog}
        onClose={() => setOpenMaterialDialog(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedMaterial ? "Edit Catalog" : "Add to Catalog"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={mForm.name}
              onChange={(e) => setMForm({ ...mForm, name: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select
                label="Unit"
                value={mForm.unit}
                onChange={(e) =>
                  setMForm({ ...mForm, unit: e.target.value as string })
                }
              >
                {UNITS.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Current / Opening Stock"
              type="number"
              fullWidth
              value={mForm.initialStock}
              onChange={(e) =>
                setMForm({ ...mForm, initialStock: e.target.value })
              }
              helperText="Set current quantity you have right now"
            />
            <TextField
              label="Low Stock Alert Level"
              type="number"
              fullWidth
              value={mForm.minStock}
              onChange={(e) => setMForm({ ...mForm, minStock: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenMaterialDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveMaterial}
            disabled={dialogLoading}
          >
            {dialogLoading ? (
              <CircularProgress size={24} />
            ) : (
              "Record Catalog Line"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openLogDialog}
        onClose={() => setOpenLogDialog(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Update Stock Level</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Item</InputLabel>
              <Select
                label="Select Item"
                value={lForm.materialId}
                onChange={(e) =>
                  setLForm({ ...lForm, materialId: e.target.value as string })
                }
              >
                {materials.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {m.name} ({m.currentStock} {m.unit} in hand)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Movement Type</InputLabel>
              <Select
                label="Movement Type"
                value={lForm.type}
                onChange={(e) =>
                  setLForm({ ...lForm, type: e.target.value as string })
                }
              >
                <MenuItem value="In">Stock IN (New Purchase)</MenuItem>
                <MenuItem value="Out">Stock OUT (Issue to Site)</MenuItem>
              </Select>
            </FormControl>
            {lForm.type === "Out" && (
              <FormControl fullWidth>
                <InputLabel>Assign to Site</InputLabel>
                <Select
                  label="Assign to Site"
                  value={lForm.siteId}
                  onChange={(e) =>
                    setLForm({ ...lForm, siteId: e.target.value as string })
                  }
                >
                  {sites.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={lForm.quantity}
              onChange={(e) => setLForm({ ...lForm, quantity: e.target.value })}
            />
            <TextField
              label="Note"
              fullWidth
              multiline
              rows={2}
              value={lForm.description}
              onChange={(e) =>
                setLForm({ ...lForm, description: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenLogDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleLogMovement}
            disabled={dialogLoading}
          >
            {dialogLoading ? <CircularProgress size={24} /> : "Update Counts"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inter-site transfer dialog */}
      <Dialog
        open={openTransferDialog}
        onClose={() => !transferBusy && setOpenTransferDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Transfer Material Between Sites</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create linked Out + In log pair. Global stock unchanged.
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Material *</InputLabel>
              <Select
                label="Material *"
                value={transferForm.materialId}
                onChange={(e) => setTransferForm({ ...transferForm, materialId: e.target.value })}
              >
                {materials.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {m.name} ({m.unit}) — Stock: {m.currentStock}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>From Site *</InputLabel>
              <Select
                label="From Site *"
                value={transferForm.fromSiteId}
                onChange={(e) => setTransferForm({ ...transferForm, fromSiteId: e.target.value })}
              >
                {sites.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>To Site *</InputLabel>
              <Select
                label="To Site *"
                value={transferForm.toSiteId}
                onChange={(e) => setTransferForm({ ...transferForm, toSiteId: e.target.value })}
              >
                {sites
                  .filter((s) => s._id !== transferForm.fromSiteId)
                  .map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Quantity *"
              inputProps={{ inputMode: "decimal" }}
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="Note"
              value={transferForm.description}
              onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenTransferDialog(false)} disabled={transferBusy}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleTransfer} disabled={transferBusy}>
            {transferBusy ? <CircularProgress size={18} color="inherit" /> : "Transfer"}
          </Button>
        </DialogActions>
      </Dialog>

      <GlassFab
        color="primary"
        onClick={() => {
          if (tab === 0 || tab === 1) setOpenMaterialDialog(true);
          else setOpenLogDialog(true);
        }}
      >
        <AddIcon />
      </GlassFab>
    </Box>
  );
}
