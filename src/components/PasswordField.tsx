import { FieldValues, Path, UseFormRegister } from "react-hook-form";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
} from "@mui/material";

// ✅ Make PasswordFieldProps generic
interface PasswordFieldProps<TFieldValues extends FieldValues>
  extends Omit<TextFieldProps, "type" | "name"> {
  register?: UseFormRegister<TFieldValues>;
  name: Path<TFieldValues>;
  error?: boolean;
  helperText?: string;
}

// ✅ Make the component generic with <TFieldValues>
const PasswordField = <TFieldValues extends FieldValues>({
  register,
  name,
  error,
  helperText,
  ...props
}: PasswordFieldProps<TFieldValues>) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      {...(register ? register(name) : {})}
      fullWidth
      type={showPassword ? "text" : "password"}
      error={error}
      helperText={helperText}
      {...props}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
        htmlInput: {
          inputMode: "text", // Prevents native password toggles on some browsers
        },
      }}
    />
  );
};

export default PasswordField;
