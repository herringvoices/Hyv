const API_BASE = `${import.meta.env.VITE_API_URL || ""}/api/user`;

export const getUsersByUsername = async (query, options = {}) => {
  const params = new URLSearchParams({ query, ...options });
  const response = await fetch(`${API_BASE}/search?${params.toString()}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return await response.json();
};

export const getUserById = async (userId) => {
  const response = await fetch(`${API_BASE}/${userId}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
  return await response.json();
};

export const getCurrentUser = async () => {
  const response = await fetch(`${API_BASE}/current`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }
  return await response.json();
};

export const updateUserProfile = async (userData) => {
  const response = await fetch(`${API_BASE}/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to update user profile");
  }
  return await response.json();
};

export const uploadProfilePicture = async (file) => {
  // Create FormData object to send the file
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload-profile-picture`, {
    method: "POST",
    body: formData, // Using FormData - browser will set appropriate content-type with boundary
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.message || "Failed to upload profile picture");
    } catch (e) {
      throw new Error("Failed to upload profile picture");
    }
  }

  return await response.json();
};

export const getUsersByCategory = async (categoryId) => {
  // Ensure categoryId is parsed as a number
  const numericCategoryId = parseInt(categoryId, 10);

  const response = await fetch(`${API_BASE}/category/${numericCategoryId}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response:", errorText);
    throw new Error(
      `Failed to fetch users by category: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
};
