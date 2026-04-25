import { create } from "zustand";
import { Backdrop } from "@mui/material";
import ProgressIndicator from "./ProgressIndicator";

interface LoaderStore {
  isLoading: boolean;
  show: () => void;
  hide: () => void;
}

export const useLoader = create<LoaderStore>((set) => ({
  isLoading: true,
  show: () => set({ isLoading: true }),
  hide: () => set({ isLoading: false }),
}));

const Loader = () => {
  const isLoading = useLoader((state) => state.isLoading);

  return (
    <Backdrop
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={isLoading}
    >
      <ProgressIndicator type={"circular"} />
    </Backdrop>
  );
};

export default Loader;
