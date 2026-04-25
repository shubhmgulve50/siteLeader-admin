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
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatINRFull } from "@/utils/format";
import AttendanceCalendarDialog from "./AttendanceCalendarDialog";
import { TABLE_HEAD_SX } from "@/styles/tokens";

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

export default function LabourTab({ siteId }: { siteId: string }) {
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

  // Calendar dialog
  const [calendarLabour, setCalendarLabour] = useState<Labour | null>(null);

  // Advance dialog
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
      assigned.forEach((l) => {
        initialAttendance[l._id] = "Present";
      });
      const todayRecords: AttendanceRecord[] = attendanceRes.data.data;
      todayRecords.forEach((record) => {
        if (record.labourId?._id) {
          initialAttendance[record.labourId._id] = record.status;
        }
      });
      setAttendance(initialAttendance);

      fetchSummary();
    } catch {
      toast.error("Failed to load labour data");
    } finally {
      setLoading(false);
    }
  }, [siteId, fetchSummary]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleAssign = async () => {
    if (!selectedToAssign) return;
    setSubmitting(true);
    try {
      await api.post(apiEndpoints.sites.assignLabour, {
        siteId,
        labourId: selectedToAssign,
      });
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
      const attendanceData = Object.entries(attendance).map(
        ([labourId, status]) => ({
          labourId,
          status,
          date: new Date().toISOString().split("T")[0],
        })
      );
      await api.post(apiEndpoints.sites.attendance, {
        siteId,
        attendanceData,
      });
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
    if (!advanceForm.labourId || !advanceForm.amount) {
      return toast.error("Amount required");
    }
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
    const url = `/admin/labour-register/print?siteId=${siteId}&month=${summaryMonth}&year=${summaryYear}`;
    window.open(url, "_blank", "noopener");
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Manage Site Labour
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAssign(true)}
          sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
        >
          Assign Labour
        </Button>
      </Stack>

      <TableContainer
        component={Card}
        elevation={0}
        sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 3 }}
      >
        <Table>
          <TableHead sx={TABLE_HEAD_SX}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Labour Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Daily Attendance
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Advance
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {siteLabour.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  No labour assigned to this site.
                </TableCell>
              </TableRow>
            ) : (
              siteLabour.map((l) => (
                <TableRow key={l._id}>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {l.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ₹{l.dailyWage} / day
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={l.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        onClick={() => handleStatusChange(l._id, "Present")}
                        sx={{
                          bgcolor:
                            attendance[l._id] === "Present"
                              ? alpha("#4caf50", 0.1)
                              : "transparent",
                          color:
                            attendance[l._id] === "Present" ? "#4caf50" : "grey.400",
                        }}
                      >
                        <PresentIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleStatusChange(l._id, "Half Day")}
                        sx={{
                          bgcolor:
                            attendance[l._id] === "Half Day"
                              ? alpha("#ff9800", 0.1)
                              : "transparent",
                          color:
                            attendance[l._id] === "Half Day" ? "#ff9800" : "grey.400",
                        }}
                      >
                        <HalfDayIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleStatusChange(l._id, "Absent")}
                        sx={{
                          bgcolor:
                            attendance[l._id] === "Absent"
                              ? alpha("#f44336", 0.1)
                              : "transparent",
                          color:
                            attendance[l._id] === "Absent" ? "#f44336" : "grey.400",
                        }}
                      >
                        <AbsentIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Record Advance">
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<AdvanceIcon fontSize="small" />}
                        onClick={() => openAdvanceDialog(l._id)}
                        sx={{ fontWeight: 700, textTransform: "none" }}
                      >
                        Advance
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {siteLabour.length > 0 && (
        <Box sx={{ mt: 3, textAlign: "right" }}>
          <Button
            variant="contained"
            size="large"
            disabled={submitting}
            onClick={saveAttendance}
            sx={{ px: 4, borderRadius: 2, fontWeight: 800 }}
          >
            {submitting ? <CircularProgress size={24} /> : "Submit Attendance"}
          </Button>
        </Box>
      )}

      {/* Attendance Summary Section */}
      <Box sx={{ mt: 5 }}>
        <Divider sx={{ mb: 4 }} />
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={1.5}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Attendance &amp; Payroll Summary
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Earnings − Advances = Balance to pay.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select value={summaryMonth} onChange={(e) => setSummaryMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" onClick={fetchSummary} disabled={loadingSummary}>
              Refresh
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={openRegister}
              sx={{ fontWeight: 700 }}
            >
              Payment Register
            </Button>
          </Stack>
        </Stack>

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 3, overflow: "hidden" }}
        >
          <Table size="small">
            <TableHead sx={TABLE_HEAD_SX}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Labour</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>P</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>HD</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>A</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Total Days</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Earnings</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Advance</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Balance</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingSummary ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={20} />
                  </TableCell>
                </TableRow>
              ) : summaryData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    No data for this month.
                  </TableCell>
                </TableRow>
              ) : (
                summaryData.map((s) => {
                  const bal = s.balance ?? (s.earnings - (s.advance || 0));
                  return (
                    <TableRow key={s.labour._id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {s.labour.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.labour.type}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={s.present} size="small" color="success" sx={{ fontWeight: 700, height: 20 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={s.halfDay} size="small" color="warning" sx={{ fontWeight: 700, height: 20 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={s.absent} size="small" color="error" sx={{ fontWeight: 700, height: 20 }} />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {s.totalDays}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
                          {formatINRFull(s.earnings)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.dark" }}>
                          {formatINRFull(s.advance || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 900, color: bal >= 0 ? "success.main" : "error.main" }}>
                          {formatINRFull(bal)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View calendar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setCalendarLabour(s.labour)}
                            >
                              <CalendarIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add Advance">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => openAdvanceDialog(s.labour._id)}
                            >
                              <AdvanceIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", fontStyle: "italic" }}>
          * P: Present, HD: Half Day, A: Absent. Advances are scoped to this site in the selected month.
        </Typography>
      </Box>

      {/* Assign Labour Dialog */}
      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Assign Global Labour</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select labour from the global master list to assign to this site.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Select Labour</InputLabel>
            <Select
              value={selectedToAssign}
              label="Select Labour"
              onChange={(e) => setSelectedToAssign(e.target.value)}
            >
              {allLabour
                .filter((l) => !siteLabour.find((sl) => sl._id === l._id))
                .map((l) => (
                  <MenuItem key={l._id} value={l._id}>
                    {l.name} ({l.type})
                  </MenuItem>
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

      {/* Calendar Dialog */}
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

      {/* Advance Dialog */}
      <Dialog open={openAdvance} onClose={() => !advanceSaving && setOpenAdvance(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Record Advance</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Amount ₹ *"
              inputProps={{ inputMode: "decimal" }}
              value={advanceForm.amount}
              onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={advanceForm.date}
              onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Mode</InputLabel>
              <Select
                label="Mode"
                value={advanceForm.paymentMode}
                onChange={(e) =>
                  setAdvanceForm({ ...advanceForm, paymentMode: e.target.value as typeof advanceForm.paymentMode })
                }
              >
                {["Cash", "UPI", "Bank", "Cheque", "Other"].map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Note"
              value={advanceForm.note}
              onChange={(e) => setAdvanceForm({ ...advanceForm, note: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAdvance(false)} disabled={advanceSaving}>
            Cancel
          </Button>
          <Button variant="contained" color="warning" onClick={saveAdvance} disabled={advanceSaving}>
            {advanceSaving ? <CircularProgress size={18} color="inherit" /> : "Record"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
