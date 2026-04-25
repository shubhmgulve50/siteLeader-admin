import axios from "axios";
import { useLoader } from "../components/Loader";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Check if we are in the browser
const isBrowser = typeof window !== "undefined";

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (isBrowser) {
      useLoader.getState().show();
    }

    if (
      ["post", "put", "patch"].includes(config.method || "") &&
      (config.data === undefined || config.data === null)
    ) {
      config.data = {};
    }

    if (isBrowser) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    if (isBrowser) {
      useLoader.getState().hide();
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (isBrowser) {
      useLoader.getState().hide();
    }
    return response;
  },
  (error) => {
    if (isBrowser) {
      useLoader.getState().hide();
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
