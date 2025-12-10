import axios from "axios";

const API_BASE_URL = "https://minly-takehome-assignment.onrender.com/v1";
// const API_BASE_URL = "http://localhost:4000/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
});
//Middleware
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};

    config.headers.Authorization = token;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
