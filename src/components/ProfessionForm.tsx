"use client";

import { FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import { z } from "zod";
import React from "react";
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { addAdvisorSchema } from "@/app/schemas/advisorSchema";

type AdvisorData = z.infer<typeof addAdvisorSchema>;

interface ProfessionFormProps {
  register: UseFormRegister<AdvisorData>;
  errors: FieldErrors<AdvisorData>;
  watch: UseFormWatch<AdvisorData>;
  onProfessionTypeChange: (type: "job" | "business") => void;
}

const ProfessionForm: React.FC<ProfessionFormProps> = ({
  register,
  errors,
  watch,
  onProfessionTypeChange,
}) => {
  const professionType = watch("professionType");

  const handleProfessionTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newType = event.target.value as "job" | "business";
    onProfessionTypeChange(newType);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Profession Information
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Profession Type Selection */}
      <FormControl
        component="fieldset"
        error={!!errors.professionType}
        sx={{ mb: 3 }}
      >
        <FormLabel component="legend">Profession Type *</FormLabel>
        <RadioGroup
          row
          value={professionType || ""}
          onChange={handleProfessionTypeChange}
        >
          <FormControlLabel
            value="job"
            control={<Radio />}
            label="Job/Employment"
          />
          <FormControlLabel
            value="business"
            control={<Radio />}
            label="Business/Self-employed"
          />
        </RadioGroup>
        {errors.professionType && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 1, display: "block" }}
          >
            {errors.professionType.message}
          </Typography>
        )}
      </FormControl>

      {/* Job-related fields */}
      {professionType === "job" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom>
            Job Details
          </Typography>

          <TextField
            {...register("jobTitle")}
            label="Job Title *"
            fullWidth
            error={!!errors.jobTitle}
            helperText={errors.jobTitle?.message}
          />

          <TextField
            {...register("companyName")}
            label="Company Name *"
            fullWidth
            error={!!errors.companyName}
            helperText={errors.companyName?.message}
          />

          <TextField
            {...register("jobLocation")}
            label="Job Location *"
            fullWidth
            error={!!errors.jobLocation}
            helperText={errors.jobLocation?.message}
          />

          <TextField
            {...register("jobExperience")}
            label="Years of Experience"
            fullWidth
            type="number"
            error={!!errors.jobExperience}
            helperText={errors.jobExperience?.message}
          />

          <TextField
            {...register("jobSalary")}
            label="Salary (Optional)"
            fullWidth
            type="number"
            error={!!errors.jobSalary}
            helperText={errors.jobSalary?.message}
          />
        </Box>
      )}

      {/* Business-related fields */}
      {professionType === "business" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom>
            Business Details
          </Typography>

          <TextField
            {...register("businessName")}
            label="Business Name *"
            fullWidth
            error={!!errors.businessName}
            helperText={errors.businessName?.message}
          />

          <TextField
            {...register("businessType")}
            label="Business Type *"
            fullWidth
            error={!!errors.businessType}
            helperText={errors.businessType?.message}
          />

          <TextField
            {...register("businessLocation")}
            label="Business Location *"
            fullWidth
            error={!!errors.businessLocation}
            helperText={errors.businessLocation?.message}
          />

          <TextField
            {...register("businessExperience")}
            label="Years in Business"
            fullWidth
            type="number"
            error={!!errors.businessExperience}
            helperText={errors.businessExperience?.message}
          />

          <TextField
            {...register("businessRevenue")}
            label="Annual Revenue (Optional)"
            fullWidth
            type="number"
            error={!!errors.businessRevenue}
            helperText={errors.businessRevenue?.message}
          />
        </Box>
      )}
    </Box>
  );
};

export default ProfessionForm;
