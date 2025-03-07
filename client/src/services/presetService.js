const apiUrl = "/api/preset";

/**
 * Create a new preset
 * @param {Object} presetData - The preset data
 * @param {string} presetData.title - Title of the preset
 * @param {Date} presetData.start - Start time
 * @param {Date} presetData.end - End time
 * @param {Object} presetData.extendedProps - Additional properties
 * @param {string} presetData.extendedProps.preferredActivity - Preferred activity
 * @param {number} presetData.extendedProps.daysOfNoticeNeeded - Days of notice needed
 * @param {Array} presetData.extendedProps.participants - Array of participant objects
 * @param {Array} presetData.extendedProps.visibilities - Array of visibility objects
 * @returns {Promise<Object>} - Promise resolving to the created preset
 */
export const createPreset = async (presetData) => {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(presetData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create preset: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating preset:", error);
    throw error;
  }
};

/**
 * Get all presets for the current user
 * @returns {Promise<Array>} - Promise resolving to an array of preset objects
 */
export const getUserPresets = async () => {
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch presets: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching presets:", error);
    throw error;
  }
};

/**
 * Get a specific preset by ID
 * @param {number} presetId - ID of the preset to retrieve
 * @returns {Promise<Object>} - Promise resolving to the preset object
 */
export const getPresetById = async (presetId) => {
  try {
    const response = await fetch(`${apiUrl}/${presetId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch preset: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching preset:", error);
    throw error;
  }
};

/**
 * Update an existing preset
 * @param {number} presetId - ID of the preset to update
 * @param {Object} presetData - The updated preset data
 * @returns {Promise<Object>} - Promise resolving to the updated preset
 */
export const updatePreset = async (presetId, presetData) => {
  try {
    const response = await fetch(`${apiUrl}/${presetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(presetData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update preset: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating preset:", error);
    throw error;
  }
};

/**
 * Delete a preset
 * @param {number} presetId - ID of the preset to delete
 * @returns {Promise<Object>} - Promise resolving to success message
 */
export const deletePreset = async (presetId) => {
  try {
    const response = await fetch(`${apiUrl}/${presetId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete preset: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting preset:", error);
    throw error;
  }
};

/**
 * Apply a preset to create a window at the target date
 * @param {number} presetId - ID of the preset to apply
 * @param {Date} targetDate - The target date for the window
 * @returns {Promise<Object>} - Promise resolving to the created window
 */
export const applyPreset = async (presetId, targetDate) => {
  try {
    const response = await fetch(`${apiUrl}/${presetId}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ targetDate }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to apply preset: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error applying preset:", error);
    throw error;
  }
};