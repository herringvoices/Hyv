import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authServices";
import * as Toast from "@radix-ui/react-toast";

export default function Register() {
  const navigate = useNavigate();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await registerUser(formData);

    if (!result.success) {
      let messages = [];

      // Check if result.message is a string that includes multiple errors
      if (typeof result.message === "string" && result.message.includes(",")) {
        messages = result.message
          .replace("Registration failed: ", "")
          .split(", ");
      } else {
        messages = [result.message];
      }

      setToastMessage(
        <ul className="list-disc list-inside">
          {messages.map((err, index) => (
            <li key={index}>{err.trim()}</li> // Trim to clean up extra spaces
          ))}
        </ul>
      );

      setToastOpen(true);
      return;
    }

    navigate("/login");
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  }

  return (
    <div className="w-screen min-h-screen flex flex-col items-center justify-center bg-dark">
      <Toast.Provider>
        <form
          className="p-6 bg-primary text-dark rounded-md shadow-lg w-80"
          onSubmit={handleSubmit}
          onKeyPress={handleKeyPress}
        >
          <h1 className="text-2xl mb-4 text-center">Register</h1>
          <input
            className="block w-full mb-2 p-2 text-dark rounded"
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
          />
          <input
            className="block w-full mb-2 p-2 text-dark rounded"
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
          />
          <input
            className="block w-full mb-2 p-2 text-dark rounded"
            type="text"
            name="firstName"
            placeholder="First Name"
            onChange={handleChange}
          />
          <input
            className="block w-full mb-4 p-2 text-dark rounded"
            type="text"
            name="lastName"
            placeholder="Last Name"
            onChange={handleChange}
          />
          <button
            className="bg-dark text-light p-2 w-full rounded hover:bg-secondary"
            type="submit"
          >
            Register
          </button>
          <div className="mt-2 text-center">
            <Link
              className="text-secondary underline hover:text-dark"
              to="/login"
            >
              Already registered? Log In
            </Link>
          </div>
        </form>

        {/* Toast Notification */}
        <Toast.Root
          className="bg-light text-dark px-4 py-2 rounded-md shadow-md max-w-sm"
          open={toastOpen}
          onOpenChange={setToastOpen}
          duration={5000}
        >
          <Toast.Title className="font-bold">Registration Error</Toast.Title>
          <Toast.Description>{toastMessage}</Toast.Description>
        </Toast.Root>
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 p-4" />
      </Toast.Provider>
    </div>
  );
}
