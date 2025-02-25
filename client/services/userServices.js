export const getUsersByUsername = async (query) => {
  const response = await fetch(`/api/user/search?query=${query}`);
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return await response.json();
};


