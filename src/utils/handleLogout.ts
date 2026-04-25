import { useRouter } from "next/navigation";
// import { clearAllStores } from "@/store/clearStore";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";

const handleLogout = async (
  router: ReturnType<typeof useRouter>,
  setLoading: (loading: boolean) => void
) => {
  try {
    setLoading(true);
    await api.post(apiEndpoints.logout, {});
    // clearAllStores();
    router.push("/login");
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

export default handleLogout;
