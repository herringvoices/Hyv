const API_BASE = "/api/FriendshipCategory";

export async function getAllCategories() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function getCategoryById(id) {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function createCategory(name) {
  const encodedName = encodeURIComponent(name);
  const response = await fetch(`${API_BASE}?name=${encodedName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function updateCategory(id, name) {
  const encodedName = encodeURIComponent(name);
  const response = await fetch(`${API_BASE}/${id}?name=${encodedName}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

export async function deleteCategory(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return;
}
