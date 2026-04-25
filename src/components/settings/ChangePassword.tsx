"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import React, { useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import PasswordField from "../PasswordField";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters long");
const confirmPassword = z
  .string()
  .min(8, "Password must be at least 8 characters long");
const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(8, "Current password is required"),
    password,
    confirmPassword,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.oldPassword !== data.password, {
    message: "New password must be different from old password",
    path: ["password"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsSubmitting(true);

      // Send only oldPassword and password to the API
      const response = await api.put(apiEndpoints.changePasswordSuperAdmin, {
        oldPassword: data.oldPassword,
        newPassword: data.password,
      });
      console.log(response);
      toast.success(response.data.message);
    } catch (error: any) {
      console.log(error);
      toast.error(error?.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Box sx={{ boxShadow: 1, p: 3, borderRadius: 1 }}>
        <Box sx={{ textAlign: "left", mb: 3 }}>
          <Typography variant="h5" fontWeight={500} mb={1}>
            Change Password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update your account password
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            maxWidth: "450px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <PasswordField
            register={register}
            name="oldPassword"
            label="Current Password"
            placeholder="Enter your current password"
            error={!!errors.oldPassword}
            helperText={errors.oldPassword?.message}
          />

          <PasswordField
            register={register}
            name="password"
            label="New Password"
            placeholder="Enter new password"
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <PasswordField
            register={register}
            name="confirmPassword"
            label="Confirm New Password"
            placeholder="Confirm new password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            loading={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Change Password"
            )}
          </Button>
        </Box>
      </Box>
    </>
  );
}
