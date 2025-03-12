import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Toast } from "radix-ui";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faUser,
  faLock,
  faIdCard,
  faUserPlus,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";

import { registerUser } from "../services/authServices";

const Register = () => {
  const navigate = useNavigate();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    userName: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Check if passwords match when either password field changes
    if (name === "password" || name === "confirmPassword") {
      if (name === "password") {
        setPasswordsMatch(
          value === formData.confirmPassword || formData.confirmPassword === ""
        );
      } else {
        setPasswordsMatch(value === formData.password);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match before submitting
    if (formData.password !== formData.confirmPassword) {
      setToastMessage(
        <ul className="list-disc list-inside">
          <li>Passwords do not match</li>
        </ul>
      );
      setToastOpen(true);
      return;
    }

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...submissionData } = formData;
    const result = await registerUser(submissionData);

    if (!result.success) {
      let messages = [];

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
            <li key={index}>{err.trim()}</li>
          ))}
        </ul>
      );

      setToastOpen(true);
      return;
    }

    navigate("/login");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-screen min-h-screen flex flex-col items-center justify-center">
      <Toast.Provider>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full px-4"
        >
          <motion.form
            className="p-6 bg-dark/80 text-primary border border-primary shadow-md shadow-primary rounded-md"
            onSubmit={handleSubmit}
            onKeyDown={handleKeyPress}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="text-2xl font-bold mb-6 text-center"
              variants={itemVariants}
            >
              Join the Hyv Community
            </motion.h1>

            <motion.div className="mb-3" variants={itemVariants}>
              <div className="flex items-center mb-1">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="text-primary mr-2"
                />
                <label className="text-sm">Email</label>
              </div>
              <input
                className="block w-full p-2 bg-dark border border-primary/50 text-primary rounded-md focus:border-primary focus:outline-none"
                type="email"
                name="email"
                placeholder="Your email"
                onChange={handleChange}
              />
            </motion.div>

            <motion.div className="mb-3" variants={itemVariants}>
              <div className="flex items-center mb-1">
                <FontAwesomeIcon icon={faUser} className="text-primary mr-2" />
                <label className="text-sm">Username</label>
              </div>
              <input
                className="block w-full p-2 bg-dark border border-primary/50 text-primary rounded-md focus:border-primary focus:outline-none"
                type="text"
                name="userName"
                placeholder="Choose a username"
                onChange={handleChange}
              />
            </motion.div>

            <motion.div className="mb-3" variants={itemVariants}>
              <div className="flex items-center mb-1">
                <FontAwesomeIcon icon={faLock} className="text-primary mr-2" />
                <label className="text-sm">Password</label>
              </div>
              <input
                className="block w-full p-2 bg-dark border border-primary/50 text-primary rounded-md focus:border-primary focus:outline-none"
                type="password"
                name="password"
                placeholder="Create a password"
                onChange={handleChange}
              />
            </motion.div>

            <motion.div className="mb-3" variants={itemVariants}>
              <div className="flex items-center mb-1">
                <FontAwesomeIcon
                  icon={faShieldAlt}
                  className="text-primary mr-2"
                />
                <label className="text-sm">Confirm Password</label>
              </div>
              <input
                className={`block w-full p-2 bg-dark border ${
                  !passwordsMatch && formData.confirmPassword
                    ? "border-red-500"
                    : "border-primary/50"
                } text-primary rounded-md focus:border-primary focus:outline-none`}
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                onChange={handleChange}
              />
              {!passwordsMatch && formData.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  Passwords do not match
                </p>
              )}
            </motion.div>

            <motion.div className="mb-3" variants={itemVariants}>
              <div className="flex items-center mb-1">
                <FontAwesomeIcon
                  icon={faIdCard}
                  className="text-primary mr-2"
                />
                <label className="text-sm">First Name</label>
              </div>
              <input
                className="block w-full p-2 bg-dark border border-primary/50 text-primary rounded-md focus:border-primary focus:outline-none"
                type="text"
                name="firstName"
                placeholder="Your first name"
                onChange={handleChange}
              />
            </motion.div>

            <motion.div className="mb-5" variants={itemVariants}>
              <div className="flex items-center mb-1">
                <FontAwesomeIcon
                  icon={faIdCard}
                  className="text-primary mr-2"
                />
                <label className="text-sm">Last Name</label>
              </div>
              <input
                className="block w-full p-2 bg-dark border border-primary/50 text-primary rounded-md focus:border-primary focus:outline-none"
                type="text"
                name="lastName"
                placeholder="Your last name"
                onChange={handleChange}
              />
            </motion.div>

            <motion.button
              className="flex items-center justify-center w-full bg-primary text-dark p-3 rounded-md hover:bg-primary/90 transition-colors font-semibold"
              type="submit"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              disabled={!passwordsMatch}
            >
              <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
              Create Account
            </motion.button>

            <motion.div className="mt-4 text-center" variants={itemVariants}>
              <Link
                className="text-secondary hover:text-primary/80 transition-colors"
                to="/login"
              >
                Already registered? <strong>Log In</strong>
              </Link>
            </motion.div>
          </motion.form>
        </motion.div>

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
};

export default Register;
