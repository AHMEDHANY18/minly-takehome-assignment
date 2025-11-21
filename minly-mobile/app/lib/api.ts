// app/lib/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const API_URL = "http://192.168.1.7:4000/v1";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

// Auto attach token if exists
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");

  if (token) {
    // نفس Postman بتاعك: Authorization: <token>
    config.headers.Authorization = token;
  }

  return config;
});
