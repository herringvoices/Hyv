import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, DropdownMenu } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { UserContext } from "./context/UserContext";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedInUser, relationshipNotifications, hangoutNotifications } =
    useContext(UserContext);

  // Navigation items with notification badges
  const navItems = [
    { name: "Windows", path: "/windows" },
    { name: "Hyv", path: "/hive" },
    {
      name: "Friends",
      path: "/friends",
      badge:
        relationshipNotifications?.total > 0
          ? relationshipNotifications.total
          : null,
    },
    {
      name: "Hangouts",
      path: "/hangouts",
      badge:
        hangoutNotifications?.total > 0 ? hangoutNotifications.total : null,
    },
  ];

  return (
    <nav className="bg-dark/70 text-primary  border-b-primary border-solid px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="flex items-center">
        <img src="/images/hyv-logo.svg" alt="Hyv Logo" className="h-12 w-12" />
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden w-full text-lg md:flex justify-start ms-5 gap-6">
        {navItems.map((item) => (
          <motion.div
            key={item.name}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Link to={item.path} className="hover:text-light">
              {item.name}
            </Link>
            {item.badge && (
              <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
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
          className="absolute top-16 left-0 w-full bg-dark shadow-lg flex flex-col gap-2 p-4 md:hidden z-50"
        >
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-primary hover:text-secondary py-2 relative"
              onClick={() => setMenuOpen(false)}
            >
              {item.name}
              {item.badge && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </motion.div>
      )}

      {/* Profile and Logout */}
      <div className="flex items-center">
        {/* LoggedInUser Profile Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 text-primary hover:text-secondary">
              <Avatar.Root className="w-8 h-8 rounded-full bg-primary">
                <Avatar.Image
                  className="w-full h-full rounded-full"
                  src={loggedInUser?.profilePicture || ""}
                  alt="Profile"
                />
                <Avatar.Fallback className="text-dark">
                  <FontAwesomeIcon icon="fa-solid fa-user" />
                </Avatar.Fallback>
              </Avatar.Root>
              <span className="text-light">
                <span className="block">{loggedInUser?.firstName}</span>
                <span className="block text-xs text-primary">
                  {loggedInUser?.userName}
                </span>
              </span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content className="bg-dark text-primary shadow-lg rounded-md p-2 z-50">
            <DropdownMenu.Item asChild>
              <Link
                to="/profile"
                className="block px-3 py-2 hover:bg-primary hover:text-dark rounded-md"
              >
                Profile
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                to="/logout"
                className="block px-3 py-2 hover:bg-primary hover:text-dark rounded-md"
              >
                Logout
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </nav>
  );
};

export default NavBar;
