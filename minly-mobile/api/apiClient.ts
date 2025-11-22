import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const API_BASE_URL = "https://minly-takehome-assignment.onrender.com/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers = config.headers ?? {};
    // Backend expects raw token (no Bearer prefix)
    config.headers.Authorization = token;
  }
  return config;
});
