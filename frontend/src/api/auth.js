import apiClient from "./client";

export async function loginWithEmailPassword(payload) {
  const { data } = await apiClient.post("/user/login", payload);
  return data;
}

export function getGoogleLoginUrl() {
  const baseURL = import.meta.env.VITE_API_BASE_URL || "";
  return `${baseURL}/user/auth/google/login`;
}

export async function connectGmailForAlerts(payload) {
  const { data } = await apiClient.post("/user/auth/google", payload);
  return data;
}

export async function fetchConnectionProfile() {
  const { data } = await apiClient.get("/user/profile");
  return data?.profile || null;
}
