"use client";

import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useState } from "react";
import {
  Cancel as AbsentIcon,
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  CurrencyRupee as AdvanceIcon,
  Schedule as HalfDayIcon,
  CheckCircle as PresentIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatINRFull } from "@/utils/format";
import AttendanceCalendarDialog from "./AttendanceCalendarDialog";
import { ACCENT } from "@/styles/tokens";

interface Labour {
  _id: string;
  name: string;
  type: string;
  dailyWage: number;
}

interface SummaryRow {
  labour: Labour;
  present: number;
  halfDay: number;
  absent: number;
  totalDays: number;
  earnings: number;
  advance: number;
  balance: number;
}

interface AttendanceRecord {
  labourId?: { _id: string };
  status: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ATTENDANCE_OPTIONS = [
  { value: "Present", label: "Present", icon: <PresentIcon sx={{ fontSize: 16 }} />, color: "#16a34a" },
  { value: "Half Day", label: "Half", icon: <HalfDayIcon sx={{ fontSize: 16 }} />, color: "#f59e0b" },
  { value: "Absent", label: "Absent", icon: <AbsentIcon sx={{ fontSize: 16 }} />, color: "#dc2626" },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function LabourTab({ siteId, builderId }: { siteId: string; builderId: string }) {
  const [siteLabour, setSiteLabour] = useState<Labour[]>([]);
  const [allLabour, setAllLabour] = useState<Labour[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  const [openAssign, setOpenAssign] = useState(false);
  const [selectedToAssign, setSelectedToAssign] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summaryYear] = useState(new Date().getFullYear());
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [calendarLabour, setCalendarLabour] = useState<Labour | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", mobile: "", type: "Helper", dailyWage: "" });
  const [creating, setCreating] = useState(false);

  const handleCreateLabour = async () => {
    if (!createForm.name || !createForm.mobile || !createForm.dailyWage) {
      return toast.error("Name, mobile and daily wage are required");
    }
    setCreating(true);
    try {
      const res = await api.post(apiEndpoints.labours.base, {
        name: createForm.name,
        mobile: createForm.mobile,
        type: createForm.type,
        dailyWage: Number(createForm.dailyWage),
      });
      const newLabour = res.data.data;
      await api.post(apiEndpoints.sites.assignLabour, { siteId, labourId: newLabour._id, builderId });
      toast.success("Labour created and assigned");
      setOpenCreate(false);
      setCreateForm({ name: "", mobile: "", type: "Helper", dailyWage: "" });
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to create labour");
    } finally {
      setCreating(false);
    }
  };

  const [openAdvance, setOpenAdvance] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    labourId: "",
    amount: "",
    date: new Date().toISOString().substring(0, 10),
    paymentMode: "Cash" as "Cash" | "UPI" | "Bank" | "Cheque" | "Other",
    note: "",
  });
  const [advanceSaving, setAdvanceSaving] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await api.get(apiEndpoints.sites.attendanceSummary(siteId), {
        params: { month: summaryMonth, year: summaryYear },
      });
      setSummaryData(res.data.data);
    } catch {
      toast.error("Failed to load attendance summary");
    } finally {
      setLoadingSummary(false);
    }
  }, [siteId, summaryMonth, summaryYear]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [assignedRes, allRes, attendanceRes] = await Promise.all([
        api.get(apiEndpoints.sites.labour(siteId)),
        api.get(apiEndpoints.labours.base),
        api.get(apiEndpoints.sites.getAttendance(siteId), { params: { date: today } }),
      ]);

      const assigned: Labour[] = assignedRes.data.data;
      setSiteLabour(assigned);
      setAllLabour(allRes.data.data);

      const initialAttendance: Record<string, string> = {};
      assigned.forEach((l) => { initialAttendance[l._id] = "Present"; });
      const todayRecords: AttendanceRecord[] = attendanceRes.data.data;
      todayRecords.forEach((record) => {
        if (record.labourId?._id) initialAttendance[record.labourId._id] = record.status;
      });
      setAttendance(initialAttendance);
      fetchSummary();
    } catch {
      toast.error("Failed to load labour data");
    } finally {
      setLoading(false);
    }
  }, [siteId, fetchSummary]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleAssign = async () => {
    if (!selectedToAssign) return;
    setSubmitting(true);
    try {
      await api.post(apiEndpoints.sites.assignLabour, { siteId, labourId: selectedToAssign, builderId });
      toast.success("Labour assigned to site");
      setOpenAssign(false);
      setSelectedToAssign("");
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Assignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (labourId: string, status: string) => {
    setAttendance((prev) => ({ ...prev, [labourId]: status }));
  };

  const saveAttendance = async () => {
    setSubmitting(true);
    try {
      const attendanceData = Object.entries(attendance).map(([labourId, status]) => ({
        labourId,
        status,
        date: new Date().toISOString().split("T")[0],
      }));
      await api.post(apiEndpoints.sites.attendance, { siteId, attendanceData, builderId });
      toast.success("Attendance marked successfully");
      fetchSummary();
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const openAdvanceDialog = (labourId: string) => {
    setAdvanceForm({
      labourId,
      amount: "",
      date: new Date().toISOString().substring(0, 10),
      paymentMode: "Cash",
      note: "",
    });
    setOpenAdvance(true);
  };

  const saveAdvance = async () => {
    if (!advanceForm.labourId || !advanceForm.amount) return toast.error("Amount required");
    setAdvanceSaving(true);
    try {
      await api.post(apiEndpoints.labourAdvances.base, {
        ...advanceForm,
        amount: Number(advanceForm.amount),
        siteId,
      });
      toast.success("Advance recorded");
      setOpenAdvance(false);
      fetchSummary();
    } catch {
      toast.error("Failed to record advance");
    } finally {
      setAdvanceSaving(false);
    }
  };

  const openRegister = () => {
    window.open(
      `/admin/labour-register/print?siteId=${siteId}&month=${summaryMonth}&year=${summaryYear}`,
      "_blank", "noopener"
    );
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      {/* ── Header ───────────────────────────────────────── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>Manage Site Labour</Typography>
          <Typography variant="caption" color="text.secondary">
            {siteLabour.length} assigned · Today&apos;s attendance
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
            sx={{ borderRadius: 2, flex: { xs: 1, sm: "none" }, fontWeight: 700, whiteSpace: "nowrap" }}
          >
            New Labour
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAssign(true)}
            sx={{ borderRadius: 2, flex: { xs: 1, sm: "none" }, whiteSpace: "nowrap" }}
          >
            Assign Existing
          </Button>
        </Stack>
      </Stack>

      {/* ── Today's Attendance Cards ──────────────────────── */}
      {siteLabour.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed", borderColor: "grey.300" }}
        >
          <Typography variant="body2" color="text.secondary">
            No labour assigned to this site yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {siteLabour.map((l) => {
            const status = attendance[l._id] || "Present";
            return (
              <Paper
                key={l._id}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  border: "1px solid",
                  borderColor: "grey.200",
                  bgcolor: "background.paper",
                }}
              >
                {/* Name row */}
                <Stack direction="row" alignItems="center" spacing={1.5} mb={1.25}>
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      bgcolor: alpha(ACCENT.primary, 0.15),
                      color: ACCENT.primary,
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      flexShrink: 0,
                    }}
                  >
                    {initials(l.name)}
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={700} noWrap>{l.name}</Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Chip
                        label={l.type}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        ₹{l.dailyWage.toLocaleString("en-IN")}/day
                      </Typography>
                    </Stack>
                  </Box>
                  <Tooltip title="Record Advance">
                    <IconButton
                      size="small"
                      onClick={() => openAdvanceDialog(l._id)}
                      sx={{
                        color: ACCENT.warning,
                        bgcolor: alpha(ACCENT.warning, 0.08),
                        border: "1px solid",
                        borderColor: alpha(ACCENT.warning, 0.25),
                        borderRadius: 1.5,
                        flexShrink: 0,
                      }}
                    >
                      <AdvanceIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* Attendance toggle */}
                <Stack direction="row" spacing={1}>
                  {ATTENDANCE_OPTIONS.map((opt) => {
                    const active = status === opt.value;
                    return (
                      <Button
                        key={opt.value}
                        size="small"
                        onClick={() => handleStatusChange(l._id, opt.value)}
                        startIcon={opt.icon}
                        sx={{
                          flex: 1,
                          borderRadius: 2,
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          py: 0.6,
                          border: "1.5px solid",
                          ...(active
                            ? { bgcolor: alpha(opt.color, 0.12), borderColor: opt.color, color: opt.color }
                            : { bgcolor: "transparent", borderColor: "grey.300", color: "text.secondary" }),
                          "&:hover": { bgcolor: alpha(opt.color, 0.08), borderColor: opt.color },
                        }}
                      >
                        {opt.label}
                      </Button>
                    );
                  })}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {siteLabour.length > 0 && (
        <Box sx={{ mt: 2.5, textAlign: "right" }}>
          <Button
            variant="contained"
            disabled={submitting}
            onClick={saveAttendance}
            sx={{ px: 4, borderRadius: 2, fontWeight: 800 }}
          >
            {submitting ? <CircularProgress size={20} /> : "Submit Attendance"}
          </Button>
        </Box>
      )}

      {/* ── Payroll Summary ───────────────────────────────── */}
      <Box sx={{ mt: 4 }}>
        <Divider sx={{ mb: 3 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.5}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>Attendance &amp; Payroll Summary</Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Earnings − Advances = Balance to pay
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select value={summaryMonth} onChange={(e) => setSummaryMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              size="small"
              onClick={fetchSummary}
              disabled={loadingSummary}
              sx={{ border: "1px solid", borderColor: "grey.300", borderRadius: 1.5 }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={openRegister}
              sx={{ fontWeight: 700, borderRadius: 2, whiteSpace: "nowrap" }}
            >
              Payment Register
            </Button>
          </Stack>
        </Stack>

        {loadingSummary ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : summaryData.length === 0 ? (
          <Paper
            elevation={0}
            sx={{ p: 3, textAlign: "center", borderRadius: 3, border: "1px dashed", borderColor: "grey.300" }}
          >
            <Typography variant="body2" color="text.secondary">No data for this month.</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {summaryData.map((s) => {
              const bal = s.balance ?? (s.earnings - (s.advance || 0));
              return (
                <Paper
                  key={s.labour._id}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor: "grey.200",
                    bgcolor: "background.paper",
                  }}
                >
                  {/* Name + action icons */}
                  <Stack direction="row" alignItems="center" spacing={1} mb={1.25}>
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: alpha(ACCENT.info, 0.15),
                        color: ACCENT.info,
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        flexShrink: 0,
                      }}
                    >
                      {initials(s.labour.name)}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={700} noWrap>{s.labour.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.labour.type} · ₹{s.labour.dailyWage.toLocaleString("en-IN")}/day
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} flexShrink={0}>
                      <Tooltip title="View Calendar">
                        <IconButton
                          size="small"
                          onClick={() => setCalendarLabour(s.labour)}
                          sx={{
                            color: ACCENT.info,
                            bgcolor: alpha(ACCENT.info, 0.08),
                            border: "1px solid",
                            borderColor: alpha(ACCENT.info, 0.2),
                            borderRadius: 1.5,
                          }}
                        >
                          <CalendarIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add Advance">
                        <IconButton
                          size="small"
                          onClick={() => openAdvanceDialog(s.labour._id)}
                          sx={{
                            color: ACCENT.warning,
                            bgcolor: alpha(ACCENT.warning, 0.08),
                            border: "1px solid",
                            borderColor: alpha(ACCENT.warning, 0.2),
                            borderRadius: 1.5,
                          }}
                        >
                          <AdvanceIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  {/* Attendance stats */}
                  <Stack direction="row" spacing={1} mb={1.25}>
                    {[
                      { label: "Present", val: s.present, color: ACCENT.success },
                      { label: "Half Day", val: s.halfDay, color: ACCENT.warning },
                      { label: "Absent", val: s.absent, color: ACCENT.error },
                      { label: "Total Days", val: s.totalDays, color: ACCENT.info },
                    ].map((stat) => (
                      <Box
                        key={stat.label}
                        sx={{
                          flex: 1,
                          textAlign: "center",
                          py: 0.75,
                          borderRadius: 2,
                          bgcolor: alpha(stat.color, 0.07),
                          border: "1px solid",
                          borderColor: alpha(stat.color, 0.2),
                        }}
                      >
                        <Typography variant="body2" fontWeight={800} color={stat.color} lineHeight={1.2}>
                          {stat.val}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" lineHeight={1.2} display="block"
                          sx={{ fontSize: "0.6rem" }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>

                  {/* Financials */}
                  <Stack
                    direction="row"
                    divider={<Box sx={{ width: "1px", bgcolor: "grey.200", flexShrink: 0 }} />}
                    sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2, overflow: "hidden" }}
                  >
                    {[
                      { label: "Earnings", val: s.earnings, color: ACCENT.success },
                      { label: "Advance", val: s.advance || 0, color: ACCENT.warning },
                      { label: "Balance", val: bal, color: bal >= 0 ? ACCENT.success : ACCENT.error },
                    ].map((fin) => (
                      <Box key={fin.label} sx={{ flex: 1, textAlign: "center", py: 0.75, px: 0.5 }}>
                        <Typography variant="body2" fontWeight={800} color={fin.color} lineHeight={1.2}
                          sx={{ fontSize: "0.8rem" }}>
                          {formatINRFull(fin.val)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" lineHeight={1.2} display="block"
                          sx={{ fontSize: "0.6rem" }}>
                          {fin.label}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block", fontStyle: "italic" }}>
          Advances scoped to this site in the selected month.
        </Typography>
      </Box>

      {/* ── Create Labour Dialog ──────────────────────────── */}
      <Dialog open={openCreate} onClose={() => !creating && setOpenCreate(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Create New Labour</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField fullWidth size="small" label="Full Name *"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
            <TextField fullWidth size="small" label="Mobile *" type="tel"
              value={createForm.mobile}
              onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={createForm.type}
                onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}>
                {["Mason", "Carpenter", "Helper", "Electrician", "Plumber", "Other"].map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth size="small" label="Daily Wage ₹ *" type="number"
              inputProps={{ inputMode: "decimal" }}
              value={createForm.dailyWage}
              onChange={(e) => setCreateForm({ ...createForm, dailyWage: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreate(false)} disabled={creating}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateLabour} disabled={creating}>
            {creating ? <CircularProgress size={18} color="inherit" /> : "Create & Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Assign Labour Dialog ──────────────────────────── */}
      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Assign Global Labour</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select labour from the global master list to assign to this site.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Select Labour</InputLabel>
            <Select value={selectedToAssign} label="Select Labour"
              onChange={(e) => setSelectedToAssign(e.target.value)}>
              {allLabour
                .filter((l) => !siteLabour.find((sl) => sl._id === l._id))
                .map((l) => (
                  <MenuItem key={l._id} value={l._id}>{l.name} ({l.type})</MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} disabled={!selectedToAssign || submitting}>
            Assign Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Calendar Dialog ───────────────────────────────── */}
      {calendarLabour && (
        <AttendanceCalendarDialog
          open={Boolean(calendarLabour)}
          onClose={() => setCalendarLabour(null)}
          siteId={siteId}
          labourId={calendarLabour._id}
          labourName={calendarLabour.name}
          wage={calendarLabour.dailyWage}
        />
      )}

      {/* ── Advance Dialog ────────────────────────────────── */}
      <Dialog open={openAdvance} onClose={() => !advanceSaving && setOpenAdvance(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Record Advance</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField fullWidth size="small" type="number" label="Amount ₹ *"
              inputProps={{ inputMode: "decimal" }}
              value={advanceForm.amount}
              onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
            />
            <TextField fullWidth size="small" type="date" label="Date"
              InputLabelProps={{ shrink: true }}
              value={advanceForm.date}
              onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Mode</InputLabel>
              <Select label="Mode" value={advanceForm.paymentMode}
                onChange={(e) =>
                  setAdvanceForm({ ...advanceForm, paymentMode: e.target.value as typeof advanceForm.paymentMode })
                }>
                {["Cash", "UPI", "Bank", "Cheque", "Other"].map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth size="small" label="Note"
              value={advanceForm.note}
              onChange={(e) => setAdvanceForm({ ...advanceForm, note: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAdvance(false)} disabled={advanceSaving}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={saveAdvance} disabled={advanceSaving}>
            {advanceSaving ? <CircularProgress size={18} color="inherit" /> : "Record"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
