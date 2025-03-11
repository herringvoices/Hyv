const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/Auth`;

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  const data = await response.json();

  return data;
}

export async function registerUser(userData) {
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    let message;
    try {
      const data = await response.clone().json();
      message = data.message || "Registration failed.";
    } catch (error) {
      message = await response.text();
    }
    return {
      success: false,
      message,
    };
  }

  return response.json();
}

export async function getMe() {
  try {
    const response = await fetch(`${API_BASE}/Me`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching auth status:", error);
    return { success: false };
  }
}

export async function logout() {
  try {
    const response = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, message: "Logout failed" };
  }
}
