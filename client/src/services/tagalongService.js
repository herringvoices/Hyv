const API_BASE = "/api/Tagalong";

export const sendTagalongRequest = async (recipientId) => {
  // Use the API_BASE variable for consistency
  const response = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipientId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error sending tagalong request:", errorText);
    throw new Error(`Failed to send tagalong request: ${response.status}`);
  }
  return await response.json();
};

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

export const removeTagalong = async (tagalongId) => {
  // Make sure we're using the same API_BASE url as other functions
  const response = await fetch(`${API_BASE}/${tagalongId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error removing tagalong:", errorText);
    throw new Error(`Failed to remove tagalong: ${response.status}`);
  }
  return await response.json();
};
