export const getUsersByUsername = async (query, options = {}) => {
  const params = new URLSearchParams({ query, ...options });
  const response = await fetch(`/api/user/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return await response.json();
};
