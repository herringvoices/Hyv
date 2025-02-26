const API_BASE = "/api/FriendRequest";

export async function sendFriendRequest(recipientId) {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipientId }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function getPendingFriendRequests(userIsSender) {
  let url = `${API_BASE}/pending`;
  if (userIsSender !== undefined) {
    url += `?userIsSender=${userIsSender}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}
