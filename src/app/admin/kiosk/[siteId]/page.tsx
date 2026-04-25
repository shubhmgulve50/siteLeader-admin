"use client";

import { toast, Toaster } from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Cancel as AbsentIcon,
  CheckCircle as PresentIcon,
  Close as CloseIcon,
  ExitToApp as ExitIcon,
  Fullscreen as FullscreenIcon,
  Schedule as HalfDayIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";

interface Labour {
  _id: string;
  name: string;
  type: string;
  dailyWage: number;
  kioskPin?: string;
  photoUrl?: string;
}

interface Site {
  _id: string;
  name: string;
  address?: string;
}

type Status = "Present" | "Half Day" | "Absent";

export default function KioskPage() {
  const { siteId } = useParams();
  const [site, setSite] = useState<Site | null>(null);
  const [labour, setLabour] = useState<Labour[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Labour | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [chosenStatus, setChosenStatus] = useState<Status | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [sRes, lRes, aRes] = await Promise.all([
        api.get(apiEndpoints.sites.byId(siteId as string)),
        api.get(apiEndpoints.sites.labour(siteId as string)),
        api.get(apiEndpoints.sites.getAttendance(siteId as string), { params: { date: today } }),
      ]);
      setSite(sRes.data.data);
      setLabour(lRes.data.data);
      const map: Record<string, Status> = {};
      (aRes.data.data || []).forEach((r: { labourId?: { _id: string }; status: Status }) => {
        if (r.labourId?._id) map[r.labourId._id] = r.status;
      });
      setTodayAttendance(map);
    } catch {
      toast.error("Failed to load site data");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 120_000); // refresh every 2 min
    return () => clearInterval(interval);
  }, [fetchAll]);

  const submitClockIn = async () => {
    if (!selected || !chosenStatus) return;
    // PIN verification
    if (selected.kioskPin && selected.kioskPin !== pinInput) {
      toast.error("Wrong PIN");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(apiEndpoints.sites.attendance, {
        siteId,
        attendanceData: [
          {
            labourId: selected._id,
            status: chosenStatus,
            date: new Date().toISOString().split("T")[0],
          },
        ],
      });
      toast.success(`${selected.name} — ${chosenStatus}`, {
        icon: chosenStatus === "Present" ? "✅" : chosenStatus === "Half Day" ? "⌛" : "❌",
        duration: 3000,
      });
      setSelected(null);
      setChosenStatus(null);
      setPinInput("");
      fetchAll();
    } catch {
      toast.error("Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const present = Object.values(todayAttendance).filter((s) => s === "Present").length;
  const halfDay = Object.values(todayAttendance).filter((s) => s === "Half Day").length;
  const absent = Object.values(todayAttendance).filter((s) => s === "Absent").length;

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={64} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e40af 100%)",
        color: "white",
        p: { xs: 2, sm: 4 },
        userSelect: "none",
      }}
    >
      <Toaster position="top-center" toastOptions={{ style: { fontSize: 18, fontWeight: 700 } }} />

      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: 1 }}>
            {site?.name || "Kiosk"}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8 }}>
            {clock.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} •{" "}
            {clock.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<FullscreenIcon />}
            onClick={toggleFullscreen}
            sx={{ bgcolor: alpha("#fff", 0.15), fontWeight: 700 }}
          >
            Fullscreen
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExitIcon />}
            onClick={() => window.close()}
            sx={{ color: "white", borderColor: alpha("#fff", 0.4), fontWeight: 700 }}
          >
            Exit
          </Button>
        </Stack>
      </Stack>

      {/* Today stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap" }} useFlexGap>
        <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: "rgba(34,197,94,0.3)", border: "1px solid rgba(34,197,94,0.5)" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9 }}>PRESENT</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#4ade80" }}>{present}</Typography>
        </Box>
        <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: "rgba(245,158,11,0.3)", border: "1px solid rgba(245,158,11,0.5)" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9 }}>HALF DAY</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#fbbf24" }}>{halfDay}</Typography>
        </Box>
        <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.5)" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9 }}>ABSENT</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#f87171" }}>{absent}</Typography>
        </Box>
        <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: alpha("#fff", 0.1) }}>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9 }}>TOTAL</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>{labour.length}</Typography>
        </Box>
      </Stack>

      {/* Instructions */}
      <Typography variant="h6" sx={{ mb: 2, opacity: 0.85 }}>
        Tap your name — then choose status
      </Typography>

      {/* Labour grid */}
      {labour.length === 0 ? (
        <Box sx={{ p: 6, textAlign: "center", borderRadius: 3, bgcolor: alpha("#fff", 0.08) }}>
          <PersonIcon sx={{ fontSize: 64, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            No labour assigned to this site
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
              lg: "repeat(6, 1fr)",
            },
            gap: 2,
          }}
        >
          {labour.map((l) => {
            const status = todayAttendance[l._id];
            const marked = Boolean(status);
            return (
              <Card
                key={l._id}
                onClick={() => !marked && setSelected(l)}
                sx={{
                  cursor: marked ? "default" : "pointer",
                  minHeight: 180,
                  borderRadius: 3,
                  bgcolor: marked
                    ? status === "Present"
                      ? "rgba(34,197,94,0.3)"
                      : status === "Half Day"
                        ? "rgba(245,158,11,0.3)"
                        : "rgba(239,68,68,0.3)"
                    : alpha("#fff", 0.12),
                  border: "2px solid",
                  borderColor: marked
                    ? status === "Present"
                      ? "#4ade80"
                      : status === "Half Day"
                        ? "#fbbf24"
                        : "#f87171"
                    : alpha("#fff", 0.2),
                  transition: "transform 0.15s",
                  "&:hover": !marked ? { transform: "scale(1.03)", bgcolor: alpha("#fff", 0.2) } : {},
                }}
              >
                <CardContent sx={{ textAlign: "center", color: "white" }}>
                  <Avatar
                    src={l.photoUrl}
                    sx={{
                      width: 64,
                      height: 64,
                      mx: "auto",
                      mb: 1,
                      bgcolor: alpha("#fff", 0.2),
                      fontSize: 28,
                      fontWeight: 900,
                    }}
                  >
                    {l.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                    {l.name}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {l.type}
                  </Typography>
                  {marked && (
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 900 }}>
                      ✓ {status}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Status picker dialog */}
      <Dialog
        open={Boolean(selected) && !chosenStatus}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
      >
        <DialogContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                {selected?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Select status
              </Typography>
            </Box>
            <IconButton onClick={() => setSelected(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack spacing={1.5} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PresentIcon />}
              onClick={() => setChosenStatus("Present")}
              sx={{ py: 2, fontSize: 20, fontWeight: 800, bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}
            >
              Present
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<HalfDayIcon />}
              onClick={() => setChosenStatus("Half Day")}
              sx={{ py: 2, fontSize: 20, fontWeight: 800, bgcolor: "#f59e0b", "&:hover": { bgcolor: "#d97706" } }}
            >
              Half Day
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<AbsentIcon />}
              onClick={() => setChosenStatus("Absent")}
              sx={{ py: 2, fontSize: 20, fontWeight: 800, bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}
            >
              Absent
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* PIN entry dialog */}
      <Dialog
        open={Boolean(chosenStatus)}
        onClose={() => {
          setChosenStatus(null);
          setPinInput("");
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
      >
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
            {selected?.name}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color:
                chosenStatus === "Present"
                  ? "success.main"
                  : chosenStatus === "Half Day"
                    ? "warning.main"
                    : "error.main",
            }}
          >
            {chosenStatus}
          </Typography>
          {selected?.kioskPin ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your 4-digit PIN
              </Typography>
              <Box
                sx={{
                  fontSize: 32,
                  letterSpacing: 8,
                  fontFamily: "monospace",
                  fontWeight: 900,
                  py: 1.5,
                  px: 2,
                  bgcolor: "grey.100",
                  borderRadius: 2,
                  mb: 2,
                  minHeight: 60,
                }}
              >
                {pinInput.replace(/./g, "●") || "____"}
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 1,
                  mb: 2,
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map((k) => (
                  <Button
                    key={String(k)}
                    variant={k === "OK" ? "contained" : "outlined"}
                    color={k === "OK" ? "primary" : k === "C" ? "error" : "inherit"}
                    onClick={() => {
                      if (k === "C") setPinInput("");
                      else if (k === "OK") submitClockIn();
                      else if (pinInput.length < 4) setPinInput(pinInput + k);
                    }}
                    sx={{ py: 2, fontSize: 22, fontWeight: 800 }}
                    disabled={submitting && k === "OK"}
                  >
                    {k === "OK" && submitting ? <CircularProgress size={18} color="inherit" /> : k}
                  </Button>
                ))}
              </Box>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No PIN set — confirm?
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={submitClockIn}
                disabled={submitting}
                sx={{ py: 2, fontSize: 20, fontWeight: 800 }}
              >
                {submitting ? <CircularProgress size={20} color="inherit" /> : "Confirm Attendance"}
              </Button>
            </>
          )}
          <Button
            fullWidth
            variant="text"
            onClick={() => {
              setChosenStatus(null);
              setPinInput("");
            }}
            sx={{ mt: 1, fontWeight: 700 }}
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
