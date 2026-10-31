import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    const isAuthRequest =
      url.includes("/auth/login") || url.includes("/auth/signup");

    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");

      toast.error("Session expired. Please login again.");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (status === 403 && !isAuthRequest) {
      toast.error("You do not have permission for this action.");
    }

    if (error.code === "ECONNABORTED") {
      toast.error("Request timeout. Backend may be slow.");
    }

    return Promise.reject(error);
  }
);

export const getApiError = (error, fallback = "Something went wrong") => {
  const data = error?.response?.data;

  if (!data) return error?.message || fallback;
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.error) return data.error;

  if (Array.isArray(data.errors)) {
    return data.errors
      .map((item) => item.message || item.error)
      .filter(Boolean)
      .join(", ");
  }

  return fallback;
};

export default api;