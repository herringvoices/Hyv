const apiUrl = "/api/hangout";

// Uncomment and adjust this block if you need to use a different API URL in development
/*
const apiUrl = process.env.NODE_ENV === 'development' 
  ? "https://localhost:7242/api/hangout" // Replace with your actual API URL
  : "/api/hangout";

console.log("Using API URL:", apiUrl); // For debugging
*/

/**
 * Fetch hangouts for a specific user with optional filtering
 * @param {string} userId - The user's ID
 * @param {boolean} [past] - When true, returns past hangouts; when false, returns future hangouts
 * @param {number} [limit] - Maximum number of hangouts to return
 * @param {number} [offset] - Number of hangouts to skip for pagination
 * @returns {Promise<Array>} - Promise resolving to an array of hangout objects
 */
export const getUserHangouts = async (
  userId,
  past = null,
  limit = null,
  offset = 0
) => {
  let url = `${apiUrl}/user/${userId}`;

  // Add query parameters if provided
  const params = new URLSearchParams();
  if (past !== null) params.append("past", past);
  if (limit !== null) params.append("limit", limit);
  if (offset !== null) params.append("offset", offset);

  // Append query string if we have parameters
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch hangouts: ${response.status}`);
  }

  return await response.json();
};

/**
 * Fetch pending hangout requests for the current user
 * @returns {Promise<Array>} - Promise resolving to an array of hangout request objects
 */
export const getPendingHangoutRequests = async () => {
  const url = `${apiUrl}/pending-requests`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch pending hangout requests: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching pending hangout requests:", error);
    throw error;
  }
};

/**
 * Fetch sent pending hangout requests to a specific friend
 * @param {string} friendId - The friend's ID
 * @returns {Promise<Array>} - Promise resolving to an array of sent pending hangout request objects
 */
export const getSentPendingHangoutRequests = async (friendId) => {
  const url = `${apiUrl}/pending-requests-sent-to/${friendId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch sent pending hangout requests: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching sent pending hangout requests:", error);
    throw error;
  }
};

/**
 * Create a new hangout request with multiple recipients
 * @param {Object} requestData - The hangout request data with recipient user IDs
 * @param {string} [requestData.senderId] - ID of the user sending the request (optional, defaults to current user)
 * @param {string} requestData.title - Title of the hangout request
 * @param {string} requestData.description - Description of the hangout
 * @param {Date} requestData.proposedStart - Proposed start time
 * @param {Date} requestData.proposedEnd - Proposed end time
 * @param {boolean} requestData.isOpen - Whether the request is open to responses
 * @param {string[]} requestData.recipientUserIds - Array of user IDs to invite
 * @returns {Promise<Object>} - Promise resolving to the created hangout request
 */
export const createHangoutRequest = async (requestData) => {
  console.log("Sending request to:", `${apiUrl}/request`);
  console.log("Request data:", requestData);

  try {
    const response = await fetch(`${apiUrl}/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(
        `Failed to create hangout request: ${response.status} - ${errorText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in createHangoutRequest:", error);
    throw error;
  }
};

/**
 * Respond to a hangout request
 * @param {number} requestId - ID of the hangout request
 * @param {string} response - Response type ("accept", "decline", "maybe")
 * @returns {Promise<Object>} - Promise resolving to the updated hangout request
 */
export const respondToHangoutRequest = async (requestId, response) => {
  const url = `${apiUrl}/request/${requestId}/respond`;

  try {
    const responseData = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ response }),
    });

    if (!responseData.ok) {
      throw new Error(
        `Failed to respond to hangout request: ${responseData.status}`
      );
    }

    return await responseData.json();
  } catch (error) {
    console.error("Error responding to hangout request:", error);
    throw error;
  }
};

/**
 * Accept a hangout request
 * @param {number} recipientId - ID of the HangoutRequestRecipient to accept
 * @param {boolean} createNewWindow - Whether to create a new window for this hangout
 * @returns {Promise<Object>} - Promise resolving to the accepted request
 */
export const acceptHangoutRequest = async (
  recipientId,
  createNewWindow = false
) => {
  const url = `${apiUrl}/request/recipient/${recipientId}/accept?newWindow=${createNewWindow}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to accept hangout request: ${response.status} - ${errorText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error accepting hangout request:", error);
    throw error;
  }
};

/**
 * Reject a hangout request
 * @param {number} recipientId - ID of the HangoutRequestRecipient to reject
 * @returns {Promise<Object>} - Promise resolving to success message
 */
export const rejectHangoutRequest = async (recipientId) => {
  const url = `${apiUrl}/request/recipient/${recipientId}/reject`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to reject hangout request: ${response.status} - ${errorText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error rejecting hangout request:", error);
    throw error;
  }
};
