import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authServices";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faSignInAlt,
} from "@fortawesome/free-solid-svg-icons";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
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
    <div className="mx-auto w-screen h-screen">
      <div className="flex flex-col items-center justify-center h-screen">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full px-4"
        >
          <motion.form
            className="p-6 bg-dark/80 text-primary border border-primary shadow-md shadow-primary rounded-md"
            onSubmit={handleSubmit}
            onKeyPress={handleKeyPress}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="text-2xl font-bold mb-6 text-center"
              variants={itemVariants}
            >
              Welcome Back to Hyv
            </motion.h1>

            <motion.div className="mb-4" variants={itemVariants}>
              <div className="flex items-center mb-2">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="text-primary mr-2"
                />
                <label className="text-sm">Email</label>
              </div>
              <input
                className="block w-full p-2 bg-dark border border-primary/50 text-primary rounded-md focus:border-primary focus:outline-none"
                type="email"
                value={email}
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </motion.div>

            <motion.div className="mb-6" variants={itemVariants}>
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faLock} className="text-primary mr-2" />
                <label className="text-sm">Password</label>
              </div>
              <input
                className="block w-full p-2 bg-dark border border-primary/50 text-primary rounded-md focus:border-primary focus:outline-none"
                type="password"
                value={password}
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </motion.div>

            <motion.button
              className="flex items-center justify-center w-full bg-primary text-dark p-3 rounded-md hover:bg-primary/90 transition-colors font-semibold"
              type="submit"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
              Log In
            </motion.button>

            <motion.div className="mt-4 text-center" variants={itemVariants}>
              <Link
                className="text-secondary hover:text-primary/80 transition-colors"
                to="/register"
              >
                Don't have an account? <strong>Register</strong>
              </Link>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
