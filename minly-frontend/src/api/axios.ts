import axios from "axios";

// const API_BASE_URL = "https://minly-takehome-assignment.onrender.com/v1";
const API_BASE_URL = "http://localhost:4000/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

function getAccessToken() {
  return localStorage.getItem("accessToken") || localStorage.getItem("token");
}

function clearAuthStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("idToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthStorage();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
