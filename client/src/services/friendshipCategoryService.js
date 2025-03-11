const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/FriendshipCategory`;

/**
 * Fetches all friendship categories for the current user
 * @returns {Promise<Array>} - Promise resolving to an array of category objects
 * @throws {Error} - If the request fails
 */
export async function getAllCategories() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

/**
 * Fetches a specific friendship category by ID
 * @param {number} id - ID of the category to fetch
 * @returns {Promise<Object>} - Promise resolving to the category object
 * @throws {Error} - If the category doesn't exist or user is not authorized
 */
export async function getCategoryById(id) {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}

/**
 * Creates a new friendship category
 * @param {string} name - Name of the category to create
 * @returns {Promise<Object>} - Promise resolving to a success message with the created category
 * @throws {Error} - If category creation fails
 */
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

/**
 * Updates an existing friendship category's name
 * @param {number} id - ID of the category to update
 * @param {string} name - New name for the category
 * @returns {Promise<Object>} - Promise resolving to a success message
 * @throws {Error} - If update fails or user is not authorized
 */
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

/**
 * Deletes a friendship category
 * @param {number} id - ID of the category to delete
 * @returns {Promise<void>} - Promise resolving when deletion is complete
 * @throws {Error} - If deletion fails or user is not authorized
 */
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
