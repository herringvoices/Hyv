import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authServices";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await loginUser(email, password);
    if (result.success) {
      navigate("/");
    } else {
      alert(result.message || "Login failed.");
    }
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  }

  return (
    <div className="mx-auto w-screen h-screen bg-dark">
      <div className="flex flex-col items-center justify-center h-screen">
        <form
          className="p-4 bg-primary text-dark rounded-md"
          onSubmit={handleSubmit}
          onKeyPress={handleKeyPress}
        >
          <h1 className="text-2xl mb-4">Login</h1>
          <input
            className="block mb-2 p-2 text-dark"
            type="email"
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="block mb-4 p-2 text-dark"
            type="password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-dark text-light p-2 rounded" type="submit">
            Log In
          </button>
          <div className="mt-2">
            <Link className="text-secondary" to="/register">
              Don't have an account? <strong>Register</strong>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
