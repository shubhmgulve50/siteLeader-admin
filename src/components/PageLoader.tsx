import { Box } from "@mui/material";
import ProgressIndicator from "./ProgressIndicator";

export default function PageLoader() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <ProgressIndicator size={50} />
    </Box>
  );
}
