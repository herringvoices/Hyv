#!/usr/bin/env bash
set -e

#######################################
# 1) CREATE THE REACT + VITE PROJECT
#######################################
echo "=== Creating React+Vite project in ./client ==="
cd client

# Initialize a fresh Vite React app in the current directory (which is empty).
npm create vite@latest . -- --template react

echo "=== Installing dependencies ==="
# React Router, Radix UI, Radix Themes, Tailwind CSS, PostCSS, autoprefixer,
# FullCalendar, React-Bootstrap (optional), etc.
npm install react-router-dom \
  @radix-ui/react-dropdown-menu \
  @radix-ui/themes \
  tailwindcss postcss autoprefixer \
  fullcalendar react-bootstrap bootstrap

# (Optional) If you want other libraries (Font Awesome, etc.), install them here:
# npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome

#######################################
# 2) SET UP TAILWIND CSS
#######################################
echo "=== Setting up Tailwind CSS ==="
npx tailwindcss init -p

# Overwrite the generated tailwind.config.js with the recommended content:
cat <<EOF > tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Inject Tailwind imports into src/index.css (Vite’s default entry point)
# The “@tailwind base;” lines are needed by Tailwind
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* You can add your custom css below this line */
EOF

#######################################
# 3) CREATE BASIC APP STRUCTURE
#######################################
echo "=== Creating a simple App structure ==="

# Overwrite src/App.jsx with a minimal example using React Router.
cat <<'EOF' > src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <nav className="p-4 border-b mb-4">
        <Link to="/" className="mr-4 text-blue-600">Home</Link>
        <Link to="/login" className="text-blue-600">Login</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
EOF

# Create a simple Home.jsx
mkdir -p src/pages
cat <<'EOF' > src/pages/Home.jsx
function Home() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Home</h1>
      <p>Welcome to the home page!</p>
    </div>
  );
}

export default Home;
EOF

# Create a simple Login.jsx that uses Fetch for authentication.
cat <<'EOF' > src/pages/Login.jsx
import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errMessage = await response.text();
        alert("Login failed: " + errMessage);
        return;
      }

      // If login succeeds, the server will return an AuthResultDto with .token
      const data = await response.json();
      localStorage.setItem("token", data.token);
      alert("Login successful!");
      // Navigate or do something next...
    } catch (error) {
      console.error(error);
      alert("An error occurred while logging in.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="p-4 border rounded flex flex-col gap-3">
        <h2 className="text-xl font-bold">Login</h2>
        <input
          type="text"
          placeholder="Email"
          value={email}
          className="border p-2"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          className="border p-2"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}

export default Login;
EOF

#######################################
# 4) CREATE .env FOR API URL
#######################################
echo "=== Creating .env file for Vite environment variables ==="
cat <<EOF > .env
VITE_API_URL=http://localhost:5000/api
EOF

#######################################
# 5) FINISH
#######################################
echo "=== Setup Complete ==="
echo "You can now run:"
echo "    npm install    # (to ensure all deps are installed)"
echo "    npm run dev    # to start the development server"
