"use client";

import { toast } from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import {
  Add as AddIcon,
  Agriculture as EquipmentIcon,
  Build as MaintenanceIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  LocalGasStation as FuelIcon,
  Timer as HoursIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import { ROLE } from "@/constants/constants";
import api from "@/lib/axios";
import { formatDateIN, formatINRFull } from "@/utils/format";
import { TABLE_HEAD_SX } from "@/styles/tokens";

type EqType =
  | "JCB"
  | "EXCAVATOR"
  | "CONCRETE_MIXER"
  | "CRANE"
  | "ROLLER"
  | "LOADER"
  | "TRACTOR"
  | "GENERATOR"
  | "PUMP"
  | "OTHER";

type Status = "AVAILABLE" | "DEPLOYED" | "MAINTENANCE" | "INACTIVE";
type Ownership = "OWNED" | "RENTED" | "LEASED";
type LogType = "USAGE" | "MAINTENANCE" | "FUEL" | "ASSIGNMENT" | "UNASSIGN";

interface Equipment {
  _id: string;
  name: string;
  type: EqType;
  assetNumber?: string;
  registrationNumber?: string;
  ownership: Ownership;
  hourlyRate: number;
  dailyRate: number;
  totalHours: number;
  assignedSiteId?: { _id: string; name: string } | string;
  status: Status;
  purchaseDate?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  notes?: string;
}

interface Site {
  _id: string;
  name: string;
}

interface EquipmentLog {
  _id: string;
  equipmentId: { _id: string; name: string; type: string } | string;
  siteId?: { _id: string; name: string };
  type: LogType;
  date: string;
  hours: number;
  fuelQty: number;
  cost: number;
  operator?: string;
  note?: string;
}

const EQ_TYPES: { value: EqType; label: string }[] = [
  { value: "JCB", label: "JCB" },
  { value: "EXCAVATOR", label: "Excavator" },
  { value: "CONCRETE_MIXER", label: "Concrete Mixer" },
  { value: "CRANE", label: "Crane" },
  { value: "ROLLER", label: "Roller" },
  { value: "LOADER", label: "Loader" },
  { value: "TRACTOR", label: "Tractor" },
  { value: "GENERATOR", label: "Generator" },
  { value: "PUMP", label: "Pump" },
  { value: "OTHER", label: "Other" },
];

const STATUS_COLORS: Record<Status, "default" | "success" | "warning" | "error"> = {
  AVAILABLE: "success",
  DEPLOYED: "warning",
  MAINTENANCE: "error",
  INACTIVE: "default",
};

export default function EquipmentPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [summary, setSummary] = useState({
    totalHours: 0,
    deployed: 0,
    available: 0,
    maintenance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [logDialog, setLogDialog] = useState<Equipment | null>(null);
  const [logForm, setLogForm] = useState({
    type: "USAGE" as LogType,
    hours: "",
    fuelQty: "",
    cost: "",
    operator: "",
    note: "",
    siteId: "",
    date: new Date().toISOString().substring(0, 10),
  });
  const [logBusy, setLogBusy] = useState(false);

  const [historyDialog, setHistoryDialog] = useState<Equipment | null>(null);
  const [historyLogs, setHistoryLogs] = useState<EquipmentLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const defaultForm = () => ({
    name: "",
    type: "JCB" as EqType,
    assetNumber: "",
    registrationNumber: "",
    ownership: "OWNED" as Ownership,
    hourlyRate: 0,
    dailyRate: 0,
    status: "AVAILABLE" as Status,
    purchaseDate: "",
    notes: "",
  });

  const [form, setForm] = useState(defaultForm());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eqRes, sRes, pRes] = await Promise.all([
        api.get(apiEndpoints.equipment.base),
        api.get(apiEndpoints.sites.base),
        api.get(apiEndpoints.adminProfile),
      ]);
      setEquipment(eqRes.data.data);
      setSummary(eqRes.data.summary || { totalHours: 0, deployed: 0, available: 0, maintenance: 0 });
      setSites(sRes.data.data);
      setUserRole(pRes.data.data.role);
    } catch {
      toast.error("Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isBuilder = userRole === ROLE.BUILDER || userRole === ROLE.SUPER_ADMIN;

  const handleSave = async () => {
    if (!form.name) return toast.error("Name required");
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(apiEndpoints.equipment.byId(editing._id), form);
        toast.success("Equipment updated");
      } else {
        await api.post(apiEndpoints.equipment.base, form);
        toast.success("Equipment added");
      }
      setOpenForm(false);
      setEditing(null);
      setForm(defaultForm());
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (e: Equipment) => {
    setEditing(e);
    setForm({
      name: e.name,
      type: e.type,
      assetNumber: e.assetNumber || "",
      registrationNumber: e.registrationNumber || "",
      ownership: e.ownership,
      hourlyRate: e.hourlyRate || 0,
      dailyRate: e.dailyRate || 0,
      status: e.status,
      purchaseDate: e.purchaseDate ? e.purchaseDate.substring(0, 10) : "",
      notes: e.notes || "",
    });
    setOpenForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this equipment?")) return;
    try {
      await api.delete(apiEndpoints.equipment.byId(id));
      toast.success("Deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  const saveLog = async () => {
    if (!logDialog) return;
    setLogBusy(true);
    try {
      await api.post(apiEndpoints.equipment.logById(logDialog._id), {
        ...logForm,
        hours: Number(logForm.hours) || 0,
        fuelQty: Number(logForm.fuelQty) || 0,
        cost: Number(logForm.cost) || 0,
      });
      toast.success("Log recorded");
      setLogDialog(null);
      setLogForm({
        type: "USAGE",
        hours: "",
        fuelQty: "",
        cost: "",
        operator: "",
        note: "",
        siteId: "",
        date: new Date().toISOString().substring(0, 10),
      });
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Log failed");
    } finally {
      setLogBusy(false);
    }
  };

  const openHistory = async (e: Equipment) => {
    setHistoryDialog(e);
    setHistoryLoading(true);
    try {
      const res = await api.get(apiEndpoints.equipment.logById(e._id));
      setHistoryLogs(res.data.data);
    } catch {
      setHistoryLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const typeLabel = (t: string) => EQ_TYPES.find((e) => e.value === t)?.label || t;

  const logTypeChip = (t: LogType) => {
    const map: Record<LogType, { label: string; color: "default" | "primary" | "warning" | "info" | "success" | "error" }> = {
      USAGE: { label: "Usage", color: "primary" },
      MAINTENANCE: { label: "Maintenance", color: "error" },
      FUEL: { label: "Fuel", color: "warning" },
      ASSIGNMENT: { label: "Assigned", color: "info" },
      UNASSIGN: { label: "Unassigned", color: "default" },
    };
    return <Chip size="small" label={map[t].label} color={map[t].color} sx={{ fontWeight: 700 }} />;
  };

  const totalOperatingCost = useMemo(
    () => equipment.reduce((s, e) => s + (e.totalHours || 0) * (e.hourlyRate || 0), 0),
    [equipment]
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions
        pageTitle="Equipment"
        pageIcon={<EquipmentIcon />}
        onRefreshAction={fetchData}
        actions={[
          isBuilder && (
            <Button
              key="add"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditing(null);
                setForm(defaultForm());
                setOpenForm(true);
              }}
              sx={{ borderRadius: 2, px: 3, bgcolor: "white", color: "primary.main" }}
            >
              Add Equipment
            </Button>
          ),
        ].filter(Boolean)}
      />

      {/* Summary strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: alpha("#16a34a", 0.3), bgcolor: alpha("#16a34a", 0.05) }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#16a34a", textTransform: "uppercase" }}>
              Available
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#16a34a" }}>
              {summary.available}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: alpha("#f59e0b", 0.3), bgcolor: alpha("#f59e0b", 0.05) }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#b45309", textTransform: "uppercase" }}>
              Deployed
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#b45309" }}>
              {summary.deployed}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: alpha("#dc2626", 0.3), bgcolor: alpha("#dc2626", 0.05) }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#dc2626", textTransform: "uppercase" }}>
              Maintenance
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#dc2626" }}>
              {summary.maintenance}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: alpha("#2563eb", 0.3), bgcolor: alpha("#2563eb", 0.05) }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>
              Total Hours
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#2563eb" }}>
              {summary.totalHours}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Op. cost: {formatINRFull(totalOperatingCost)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <GenericTable
        mobileCard
        columns={[
          {
            id: "name",
            label: "Name",
            isPrimaryOnMobile: true,
            render: (v: string, row: Equipment) => (
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{v}</Typography>
                {row.assetNumber && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                    #{row.assetNumber}
                  </Typography>
                )}
              </Box>
            ),
          },
          { id: "type", label: "Type", mobileLabel: "Type", render: (v: string) => typeLabel(v) },
          {
            id: "ownership",
            label: "Ownership",
            hiddenOnMobile: true,
            render: (v: Ownership) => (
              <Chip label={v} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
            ),
          },
          {
            id: "assignedSiteId",
            label: "Assigned To",
            mobileLabel: "Site",
            render: (v: Equipment["assignedSiteId"]) =>
              typeof v === "object" && v ? v.name : <Typography variant="caption" color="text.disabled">—</Typography>,
          },
          {
            id: "totalHours",
            label: "Hrs",
            mobileLabel: "Hours",
            align: "right",
            render: (v: number) => <Typography sx={{ fontWeight: 700 }}>{v || 0}</Typography>,
          },
          {
            id: "hourlyRate",
            label: "Rate",
            hiddenOnMobile: true,
            align: "right",
            render: (v: number) => (v ? `₹${v}/hr` : "—"),
          },
          {
            id: "status",
            label: "Status",
            mobileLabel: "Status",
            render: (v: Status) => (
              <Chip label={v} size="small" color={STATUS_COLORS[v]} sx={{ fontWeight: 700 }} />
            ),
          },
          {
            id: "actions",
            label: "Actions",
            align: "right",
            isActionColumn: true,
            render: (_: unknown, row: Equipment) => (
              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                <Tooltip title="Log usage / fuel / maintenance">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setLogDialog(row)}
                  >
                    <HoursIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="History">
                  <IconButton size="small" onClick={() => openHistory(row)}>
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {isBuilder && (
                  <>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(row)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(row._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            ),
          },
        ]}
        data={equipment}
        loading={loading}
        emptyMessage="No equipment yet. Add your first JCB / mixer / tool."
      />

      {/* Form dialog */}
      <Dialog
        open={openForm}
        onClose={() => !submitting && setOpenForm(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          component="div"
          sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h6" fontWeight={800}>
            {editing ? `Edit — ${editing.name}` : "Add Equipment"}
          </Typography>
          <IconButton onClick={() => setOpenForm(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "grey.50" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as EqType })}
                >
                  {EQ_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Asset Number"
                value={form.assetNumber}
                onChange={(e) => setForm({ ...form, assetNumber: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Registration No."
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Ownership</InputLabel>
                <Select
                  label="Ownership"
                  value={form.ownership}
                  onChange={(e) => setForm({ ...form, ownership: e.target.value as Ownership })}
                >
                  <MenuItem value="OWNED">Owned</MenuItem>
                  <MenuItem value="RENTED">Rented</MenuItem>
                  <MenuItem value="LEASED">Leased</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Hourly Rate ₹"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Daily Rate ₹"
                value={form.dailyRate}
                onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                >
                  <MenuItem value="AVAILABLE">Available</MenuItem>
                  <MenuItem value="DEPLOYED">Deployed</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Purchase Date"
                InputLabelProps={{ shrink: true }}
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Notes"
                multiline
                minRows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenForm(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={submitting || !form.name}>
            {submitting ? <CircularProgress size={18} color="inherit" /> : editing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log dialog */}
      <Dialog open={Boolean(logDialog)} onClose={() => !logBusy && setLogDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {logDialog?.name} — Log Entry
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={logForm.type}
                onChange={(e) => setLogForm({ ...logForm, type: e.target.value as LogType })}
              >
                <MenuItem value="USAGE">Usage (hours)</MenuItem>
                <MenuItem value="FUEL">Fuel refill</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance / Repair</MenuItem>
                <MenuItem value="ASSIGNMENT">Assign to site</MenuItem>
                <MenuItem value="UNASSIGN">Unassign</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={logForm.date}
              onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
            />
            {logForm.type === "USAGE" && (
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Hours Used"
                inputProps={{ inputMode: "decimal" }}
                value={logForm.hours}
                onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })}
              />
            )}
            {logForm.type === "FUEL" && (
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Litres"
                  value={logForm.fuelQty}
                  onChange={(e) => setLogForm({ ...logForm, fuelQty: e.target.value })}
                  InputProps={{ startAdornment: <FuelIcon sx={{ mr: 0.5, color: "warning.main" }} /> }}
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Cost ₹"
                  value={logForm.cost}
                  onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })}
                />
              </Stack>
            )}
            {logForm.type === "MAINTENANCE" && (
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Repair Cost ₹"
                value={logForm.cost}
                onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })}
                InputProps={{ startAdornment: <MaintenanceIcon sx={{ mr: 0.5, color: "error.main" }} /> }}
              />
            )}
            {(logForm.type === "ASSIGNMENT" || logForm.type === "USAGE") && (
              <FormControl fullWidth size="small">
                <InputLabel>Site{logForm.type === "ASSIGNMENT" ? " *" : ""}</InputLabel>
                <Select
                  label={`Site${logForm.type === "ASSIGNMENT" ? " *" : ""}`}
                  value={logForm.siteId}
                  onChange={(e) => setLogForm({ ...logForm, siteId: e.target.value })}
                >
                  <MenuItem value="">—</MenuItem>
                  {sites.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              fullWidth
              size="small"
              label="Operator"
              value={logForm.operator}
              onChange={(e) => setLogForm({ ...logForm, operator: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="Note"
              value={logForm.note}
              onChange={(e) => setLogForm({ ...logForm, note: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLogDialog(null)} disabled={logBusy}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveLog} disabled={logBusy}>
            {logBusy ? <CircularProgress size={18} color="inherit" /> : "Record"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History dialog */}
      <Dialog open={Boolean(historyDialog)} onClose={() => setHistoryDialog(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            {historyDialog?.name} — History
            <Typography variant="caption" color="text.secondary" display="block">
              Total hours: {historyDialog?.totalHours || 0}
            </Typography>
          </Box>
          <IconButton onClick={() => setHistoryDialog(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : historyLogs.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              No history
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={TABLE_HEAD_SX}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Site</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Hrs</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Fuel (L)</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Cost</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Operator</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Note</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyLogs.map((l) => (
                    <TableRow key={l._id}>
                      <TableCell>{formatDateIN(l.date)}</TableCell>
                      <TableCell>{logTypeChip(l.type)}</TableCell>
                      <TableCell>{l.siteId?.name || "—"}</TableCell>
                      <TableCell align="right">{l.hours || "—"}</TableCell>
                      <TableCell align="right">{l.fuelQty || "—"}</TableCell>
                      <TableCell align="right">{l.cost ? formatINRFull(l.cost) : "—"}</TableCell>
                      <TableCell>{l.operator || "—"}</TableCell>
                      <TableCell>{l.note || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {isBuilder && (
        <GlassFab color="primary" onClick={() => { setEditing(null); setForm(defaultForm()); setOpenForm(true); }}>
          <AddIcon />
        </GlassFab>
      )}
    </Box>
  );
}
