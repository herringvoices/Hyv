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
