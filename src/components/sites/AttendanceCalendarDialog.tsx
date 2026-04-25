"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";

interface DayCell {
  day: number;
  date: string;
  status: "Present" | "Half Day" | "Absent" | null;
}

interface CalendarData {
  year: number;
  month: number;
  daysInMonth: number;
  firstDayOfWeek: number;
  summary: { present: number; halfDay: number; absent: number };
  data: DayCell[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  Present: { bg: "#16a34a", fg: "#fff", label: "P" },
  "Half Day": { bg: "#f59e0b", fg: "#fff", label: "H" },
  Absent: { bg: "#dc2626", fg: "#fff", label: "A" },
};

export default function AttendanceCalendarDialog({
  open,
  onClose,
  siteId,
  labourId,
  labourName,
  wage,
}: {
  open: boolean;
  onClose: () => void;
  siteId: string;
  labourId: string;
  labourName: string;
  wage?: number;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCalendar = useCallback(async () => {
    if (!siteId || !labourId) return;
    setLoading(true);
    try {
      const res = await api.get(apiEndpoints.sites.labourCalendar(siteId, labourId), {
        params: { year, month },
      });
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [siteId, labourId, year, month]);

  useEffect(() => {
    if (open) fetchCalendar();
  }, [open, fetchCalendar]);

  const earnings = wage
    ? (data?.summary.present || 0) * wage + (data?.summary.halfDay || 0) * (wage / 2)
    : 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        component="div"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {labourName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Attendance Calendar
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Controls */}
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Month</InputLabel>
            <Select
              label="Month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 110 }}>
            <InputLabel>Year</InputLabel>
            <Select
              label="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const y = now.getFullYear() - 2 + i;
                return (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Stack>

        {/* Legend */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
          <Chip
            label={`Present: ${data?.summary.present ?? 0}`}
            size="small"
            sx={{ bgcolor: "#16a34a", color: "#fff", fontWeight: 700 }}
          />
          <Chip
            label={`Half Day: ${data?.summary.halfDay ?? 0}`}
            size="small"
            sx={{ bgcolor: "#f59e0b", color: "#fff", fontWeight: 700 }}
          />
          <Chip
            label={`Absent: ${data?.summary.absent ?? 0}`}
            size="small"
            sx={{ bgcolor: "#dc2626", color: "#fff", fontWeight: 700 }}
          />
          {wage != null && (
            <Chip
              label={`Earnings: ₹${earnings.toLocaleString("en-IN")}`}
              size="small"
              color="primary"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Stack>

        {/* Calendar grid */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : data ? (
          <Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 0.5,
                mb: 0.5,
              }}
            >
              {WEEKDAYS.map((wd) => (
                <Typography
                  key={wd}
                  variant="caption"
                  sx={{
                    textAlign: "center",
                    fontWeight: 700,
                    color: "text.disabled",
                    py: 0.5,
                  }}
                >
                  {wd}
                </Typography>
              ))}
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 0.5,
              }}
            >
              {/* Leading empty cells */}
              {Array.from({ length: data.firstDayOfWeek }).map((_, i) => (
                <Box key={`empty-${i}`} />
              ))}
              {data.data.map((cell) => {
                const color = cell.status ? COLORS[cell.status] : null;
                const isWeekend = (data.firstDayOfWeek + cell.day - 1) % 7 === 0 || (data.firstDayOfWeek + cell.day - 1) % 7 === 6;
                return (
                  <Box
                    key={cell.day}
                    sx={{
                      aspectRatio: "1 / 1",
                      borderRadius: 1.5,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      bgcolor: color ? color.bg : isWeekend ? "grey.50" : "grey.100",
                      color: color ? color.fg : "text.secondary",
                      border: "1px solid",
                      borderColor: color ? "transparent" : "grey.200",
                      transition: "transform 0.15s",
                      "&:hover": color ? { transform: "scale(1.05)", boxShadow: 2 } : {},
                    }}
                    title={
                      cell.status
                        ? `${new Date(cell.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${cell.status}`
                        : new Date(cell.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                    }
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: 14, lineHeight: 1 }}>
                      {cell.day}
                    </Typography>
                    {color && (
                      <Typography sx={{ fontSize: 9, fontWeight: 700, opacity: 0.9 }}>
                        {color.label}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            No data
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
