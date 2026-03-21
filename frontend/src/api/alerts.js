import apiClient from "./client";

export async function fetchUserAlerts() {
  const { data } = await apiClient.get("/user/alerts");
  return Array.isArray(data?.alerts) ? data.alerts : [];
}
