import BulletPointIcon from "@mui/icons-material/FiberManualRecord"; // or whatever you're using
import { SxProps } from "@mui/material";

interface BulletIconProps {
  color?: string;
  size?: number;
  sx?: SxProps;
}

export default function BulletIcon({
  color = "black",
  size = 15,
  sx,
}: BulletIconProps) {
  return (
    <BulletPointIcon
      sx={{
        fontSize: size,
        color,
        filter: "drop-shadow(0px 0px 1px rgba(0, 0, 0, 1))",
        stroke: "black",
        strokeWidth: 1,
        ...sx,
      }}
    />
  );
}
