export async function loginUser(email, password) {
  console.log("Attempting to log in user with email:", email);
  const response = await fetch("/api/Auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include", // This is correct
  });

  console.log("Received response from login API:", response);

  // Add headers check
  console.log("Response headers:", [...response.headers.entries()]);
  console.log("Response cookies:", document.cookie);

  const data = await response.json();
  console.log("Parsed response data:", data);

  if (data.success) {
    // Verify we have what we need after login
    console.log("Login successful, checking cookies:", document.cookie);
  }

  return data;
}

export async function registerUser({ email, password, firstName, lastName }) {
  const response = await fetch("/api/Auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, firstName, lastName }),
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
    const response = await fetch("/api/Auth/Me", {
      method: "GET",
      credentials: "include", // Ensure cookies are sent with the request
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
