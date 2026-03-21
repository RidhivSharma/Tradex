import axios from "axios";
import { getToken, removeToken } from "../utils/token";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

const apiClient = axios.create({
  baseURL,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.token = token;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      removeToken();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
