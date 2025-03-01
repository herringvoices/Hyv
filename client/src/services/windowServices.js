const apiUrl = "/api/window";

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
