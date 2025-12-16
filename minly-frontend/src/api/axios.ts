import axios from "axios";

const API_BASE_URL = "http://localhost:4000/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // CRITICAL: send/receive HttpOnly cookies
});

// Optional: لو عايز تتعامل مع 401 بشكل هادي بدون force redirect من هنا
api.interceptors.response.use(
  (r) => r,
  (error) => Promise.reject(error)
);
