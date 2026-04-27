"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import LogoView from "./LogoView";

// Define the validation schema
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

// Infer the type from the schema
type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const theme = useTheme();

  const onSubmit = async (data: LoginFormData) => {
    setErrorCode(null);
    try {
      const response = await api.post(apiEndpoints.login, data);
      if (response.status === 200) {
        // Successful login - backend sets HttpOnly cookie for middleware
        // Router push to admin area
        router.push("/admin/dashboard");
      } else {
        setError("root", {
          type: "manual",
          message: "Invalid credentials",
        });
      }
    } catch (err: any) {
      const code = err.response?.data?.code ?? null;
      setErrorCode(code);
      setError("root", {
        type: "manual",
        message: err.response?.data?.message || "Login failed",
      });
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  return (
    <Box
      component="main"
      sx={{
        width: "100vw",
        height: "100dvh",
        overflow: "auto",
        background:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at top right, ${theme.palette.primary.main}22, #121212)`
            : `radial-gradient(circle at top right, ${theme.palette.primary.main}11, #F4F3F0)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="xs">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              borderRadius: 6,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              backdropFilter: "blur(10px)",
            }}
          >
            <Box sx={{ mb: 1 }}>
              <LogoView clickable={false} />
            </Box>

            <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
              Admin Login
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ width: "100%" }}
            >
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email Address"
                autoComplete="email"
                autoFocus
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register("email")}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: "action.active" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                margin="normal"
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register("password")}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "action.active" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {errors.root && errorCode === "PENDING_APPROVAL" && (
                <Alert
                  severity="warning"
                  sx={{ mt: 2, borderRadius: 2 }}
                  action={
                    <Button
                      color="warning"
                      size="small"
                      variant="outlined"
                      href="/admin/super-admin"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.7rem" }}
                    >
                      Approve Now
                    </Button>
                  }
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Account pending approval
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", mt: 0.25 }}>
                    Log in as Super Admin → approve this builder.
                  </Typography>
                </Alert>
              )}

              {errors.root && errorCode === "EMAIL_NOT_VERIFIED" && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Email not verified
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", mt: 0.25 }}>
                    Check inbox for verification link. Or ask Super Admin to verify manually.
                  </Typography>
                </Alert>
              )}

              {errors.root && errorCode === "ACCOUNT_DENIED" && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Account denied
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", mt: 0.25 }}>
                    Contact support or ask Super Admin to reinstate your account.
                  </Typography>
                </Alert>
              )}

              {errors.root && errorCode === "ACCOUNT_SUSPENDED" && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Account suspended
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", mt: 0.25 }}>
                    Contact support or ask Super Admin to reinstate your account.
                  </Typography>
                </Alert>
              )}

              {errors.root && !errorCode && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  {errors.root.message}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginForm;
