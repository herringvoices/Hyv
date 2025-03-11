const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/Tagalong`;

export const sendTagalongRequest = async (recipientId) => {
  // Use the API_BASE variable for consistency
  const response = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
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
  const response = await fetch(url, {
    credentials: "include"
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function deleteAllTagalongRequests() {
  const response = await fetch(`${API_BASE}/all`, {
    method: "DELETE",
    credentials: "include"
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
      credentials: "include"
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
    credentials: "include"
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error removing tagalong:", errorText);
    throw new Error(`Failed to remove tagalong: ${response.status}`);
  }
  return await response.json();
};

export async function checkTagalongExists(userId) {
  const response = await fetch(`${API_BASE}/exists?userId=${userId}`, {
    credentials: "include"
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error checking tagalong status:", errorText);
    throw new Error(`Failed to check tagalong status: ${response.status}`);
  }
  const data = await response.json();
  return data.exists;
}

export async function getAcceptedTagalongs() {
  try {
    console.log("Fetching accepted tagalongs from:", `${API_BASE}/accepted`);
    const response = await fetch(`${API_BASE}/accepted`, {
      credentials: "include"
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Error fetching accepted tagalongs:",
        errorText,
        response.status
      );
      throw new Error(`Failed to fetch accepted tagalongs: ${response.status}`);
    }

    const data = await response.json();
    console.log("Accepted tagalongs data:", data);
    return data;
  } catch (err) {
    console.error("Exception in getAcceptedTagalongs:", err);
    // Return an empty array as fallback
    return [];
  }
}
