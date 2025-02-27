const API_BASE = "/api/CategoryMember";

export async function addUserToCategory(categoryId, friendId) {
  const response = await fetch(
    `${API_BASE}?categoryId=${categoryId}&friendId=${friendId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function removeUserFromCategory(categoryId, friendId) {
  const response = await fetch(
    `${API_BASE}?categoryId=${categoryId}&friendId=${friendId}`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function getCategoryMembers(categoryId) {
  const response = await fetch(`${API_BASE}/members?categoryId=${categoryId}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}
