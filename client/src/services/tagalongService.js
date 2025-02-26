const API_BASE = "/api/Tagalong";

export async function sendTagalongRequest(recipientId) {
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

export async function getPendingTagalongs(userIsSender) {
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

export async function deleteAllTagalongRequests() {
  const response = await fetch(`${API_BASE}/all`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return;
}

export async function respondToTagalongRequest(requestId, accepted) {
  const response = await fetch(
    `${API_BASE}/${requestId}/respond?accepted=${accepted}`,
    {
      method: "POST",
    }
  );
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}
