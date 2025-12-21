import axios from "axios";
import * as SecureStore from "expo-secure-store";

// export const API_BASE_URL =
//   "https://minly-takehome-assignment.onrender.com/v1";
export const API_BASE_URL =
  "http://localhost:4000/v1";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = token;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("token");
      // هنا لاحقًا هنربط store + navigation
    }
    return Promise.reject(error);
  }
);
