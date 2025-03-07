const apiUrl = "/api/window";

/**
 * Fetches windows for the current user within a date range
 * @param {string} start - ISO date string for the start of the range
 * @param {string} end - ISO date string for the end of the range
 * @returns {Promise<Array>} - Promise resolving to an array of window objects formatted for FullCalendar
 */
export const getWindowsByDateRange = async (start, end) => {
  const response = await fetch(`${apiUrl}?start=${start}&end=${end}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch windows: ${response.status}`);
  }

  return await response.json();
};

/**
 * Creates a new availability window
 * @param {Object} windowData - The window data to create
 * @param {string} windowData.title - Title of the window
 * @param {string} windowData.start - ISO date string for the start time
 * @param {string} windowData.end - ISO date string for the end time
 * @param {Object} [windowData.extendedProps] - Extended properties for the window
 * @param {string} [windowData.extendedProps.preferredActivity] - Preferred activity during this time
 * @param {number} [windowData.extendedProps.daysOfNoticeNeeded] - Days of notice needed for hangouts
 * @param {boolean} [windowData.extendedProps.active=true] - Whether the window is active
 * @param {Array} [windowData.extendedProps.participants] - List of participants to include
 * @param {Array} [windowData.extendedProps.visibilities] - List of categories that can see this window
 * @returns {Promise<Object>} - Promise resolving to the created window object
 * @throws {Error} - If window creation fails, including if it overlaps with existing windows
 */
export const createWindow = async (windowData) => {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(windowData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create window: ${response.status}`);
  }

  return await response.json();
};

/**
 * Updates an existing window
 * @param {number|string} id - ID of the window to update
 * @param {Object} windowData - The updated window data
 * @param {string} windowData.title - Title of the window
 * @param {string} windowData.start - ISO date string for the start time
 * @param {string} windowData.end - ISO date string for the end time
 * @param {Object} [windowData.extendedProps] - Extended properties for the window
 * @returns {Promise<Object>} - Promise resolving to the updated window object
 * @throws {Error} - If window update fails or user is not authorized
 */
export const updateWindow = async (id, windowData) => {
  const response = await fetch(`${apiUrl}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(windowData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update window: ${response.status}`);
  }

  return await response.json();
};

/**
 * Deletes a window by ID
 * @param {number|string} id - ID of the window to delete
 * @returns {Promise<Object>} - Promise resolving to a success message
 * @throws {Error} - If deletion fails or user is not authorized
 */
export const deleteWindow = async (id) => {
  const response = await fetch(`${apiUrl}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete window: ${response.status}`);
  }

  return await response.json();
};

/**
 * Fetches windows from friends that overlap with the current user's schedule
 * @param {string|null} [start=null] - Optional ISO date string for the start of the range
 * @param {string|null} [end=null] - Optional ISO date string for the end of the range
 * @param {number|string|null} [categoryId=null] - Optional category ID to filter by ("all" or null for all categories)
 * @returns {Promise<Array>} - Promise resolving to an array of window objects formatted for FullCalendar
 * @throws {Error} - If the request fails
 */
export const getHiveWindows = async (
  start = null,
  end = null,
  categoryId = null
) => {
  let url = `${apiUrl}/hive`;

  // Add query parameters if they exist
  const params = new URLSearchParams();
  if (start) params.append("start", start);
  if (end) params.append("end", end);
  if (categoryId && categoryId !== "all")
    params.append("categoryId", categoryId);

  // Add the query string if we have parameters
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
    throw new Error(`Failed to fetch hive windows: ${response.status}`);
  }

  return await response.json();
};
