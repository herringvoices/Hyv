const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/Notification`;

export async function getPendingNotificationCounts() {
  const response = await fetch(`${API_BASE}/pending-counts`, {
    credentials: "include"
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}
