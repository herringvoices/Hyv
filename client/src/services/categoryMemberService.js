const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/CategoryMember`;

/**
 * Adds a friend to a friendship category
 * @param {number} categoryId - ID of the category to add the friend to
 * @param {string} friendId - ID of the friend to add to the category
 * @returns {Promise<Object>} - Promise resolving to a success message
 * @throws {Error} - If the request fails, e.g., category doesn't belong to user or friendship doesn't exist
 */
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

/**
 * Removes a friend from a friendship category
 * @param {number} categoryId - ID of the category to remove the friend from
 * @param {string} friendId - ID of the friend to remove from the category
 * @returns {Promise<Object>} - Promise resolving to a success message
 * @throws {Error} - If the request fails or user is not authorized to modify the category
 */
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

/**
 * Fetches all members of a specific category
 * @param {number} categoryId - ID of the category to get members for
 * @returns {Promise<Array>} - Promise resolving to an array of user objects in the category
 * @throws {Error} - If the request fails
 */
export async function getCategoryMembers(categoryId) {
  const response = await fetch(`${API_BASE}/members?categoryId=${categoryId}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return await response.json();
}
