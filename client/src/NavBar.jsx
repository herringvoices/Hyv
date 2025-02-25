import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, DropdownMenu } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { UserContext } from "./context/UserContext";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedInUser } = useContext(UserContext);

  return (
    <nav className="bg-dark text-primary px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="flex items-center">
        <img src="/images/hyv-logo.svg" alt="Hyv Logo" className="h-12 w-12" />
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden w-full text-lg md:flex justify-start ms-5 gap-6">
        {["Windows", "Hive", "Friends", "Hangouts"].map((item) => (
          <motion.div
            key={item}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={`/${item.toLowerCase()}`} className="hover:text-light">
              {item}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-primary text-xl"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-16 left-0 w-full bg-dark shadow-lg flex flex-col gap-2 p-4 md:hidden"
        >
          {["Windows", "Hive", "Friends", "Hangouts"].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              className="text-primary hover:text-secondary py-2"
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </Link>
          ))}
        </motion.div>
      )}

      {/* Profile and Logout */}
      <div className="flex items-center gap-4">
        <Link to="/logout" className="hover:text-secondary">
          Logout
        </Link>

        {/* LoggedInUser Profile Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 text-primary hover:text-secondary">
              <Avatar.Root className="w-8 h-8 rounded-full bg-secondary">
                <Avatar.Image
                  className="w-full h-full rounded-full"
                  src={
                    loggedInUser?.profilePicture || "/path-to-default-pic.jpg"
                  } // Use loggedInUser profile image
                  alt="Profile"
                />
                <Avatar.Fallback className="text-light">?</Avatar.Fallback>
              </Avatar.Root>
              <span className="text-light">
                <span className="block">{loggedInUser?.firstName}</span>
                <span className="block text-xs text-secondary">
                  {loggedInUser?.userName}
                </span>
              </span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content className="bg-dark text-primary shadow-lg rounded-md p-2">
            <DropdownMenu.Item asChild>
              <Link
                to="/profile"
                className="block px-3 py-2 hover:bg-secondary hover:text-light rounded-md"
              >
                Profile
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </nav>
  );
};

export default NavBar;
