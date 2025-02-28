export const getUsersByUsername = async (query, options = {}) => {
  const params = new URLSearchParams({ query, ...options });
  const response = await fetch(`/api/user/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return await response.json();
};

export const getUserById = async (userId) => {
  const response = await fetch(`/api/user/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
  return await response.json();
};

export const getCurrentUser = async () => {
  const response = await fetch("/api/user/current");
  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }
  return await response.json();
};

export const updateUserProfile = async (userData) => {
  const response = await fetch("/api/user/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error("Failed to update user profile");
  }
  return await response.json();
};

export const getUsersByCategory = async (categoryId) => {
  // Ensure categoryId is parsed as a number
  const numericCategoryId = parseInt(categoryId, 10);

  const response = await fetch(`/api/user/category/${numericCategoryId}`);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response:", errorText);
    throw new Error(
      `Failed to fetch users by category: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
};
