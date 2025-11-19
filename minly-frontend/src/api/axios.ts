import axios from "axios";

const API_BASE_URL = "http://localhost:4000/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = token;
  }

  return config;
});
