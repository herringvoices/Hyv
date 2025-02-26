const API_BASE = "/api/Friend";

export async function getFriends(search) {
  const url = search ? `${API_BASE}?search=${search}` : API_BASE;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}
