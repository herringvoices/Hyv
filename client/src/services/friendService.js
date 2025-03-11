const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/Friend`;

export async function getFriends(search) {
  const url = search ? `${API_BASE}?search=${search}` : API_BASE;
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function removeFriend(friendId) {
  const response = await fetch(`${API_BASE}/${friendId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return;
}

export async function blockUser(userIdToBlock) {
  const response = await fetch(`${API_BASE}/${userIdToBlock}/block`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return;
}
