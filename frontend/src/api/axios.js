import axios from "axios";

const configuredUrl = import.meta.env.VITE_API_URL;
const isLocalHost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

// Never let a production build accidentally use a localhost API URL.
const API_URL =
  configuredUrl && (!configuredUrl.includes("localhost") && !configuredUrl.includes("127.0.0.1"))
    ? configuredUrl
    : isLocalHost
      ? (configuredUrl || "http://localhost:5000/api")
      : "https://quiz-adv.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
