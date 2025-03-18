import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Collapsible } from "radix-ui";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserFriends,
  faCalendarAlt,
  faUsers,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

const Welcome = () => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-dark/80 text-primary border border-primary shadow-md shadow-primary p-6 rounded-md mb-6"
      >
        <h1 className="text-4xl font-bold mb-3 text-center">Welcome to Hyv!</h1>
        <h2 className="text-xl mb-4 text-center">
          Find Friends. Make Plans. Hang Out.
        </h2>
        <p className="mb-6 text-lg text-center">
          Hyv makes it easy to coordinate last-minute plans with your friends by
          sharing availability, filtering connections, and sending hangout
          requests.
        </p>
        <div className="flex justify-center">
          <motion.div
            variants={buttonVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            <Link
              to="/windows"
              className="px-6 py-3 bg-primary text-dark font-semibold rounded-md hover:bg-primary/90 transition-colors"
            >
              View Your Windows
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Start Guide */}
      <h2 className="text-2xl font-bold mb-4 text-primary">
        Quick Start Guide
      </h2>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Step 1: Add Friends */}
        <motion.div
          className="bg-dark/80 text-primary border border-primary shadow-md shadow-primary p-5 rounded-md"
          variants={itemVariants}
        >
          <div className="flex items-center mb-3">
            <FontAwesomeIcon icon={faUserFriends} className="text-2xl mr-3" />
            <h3 className="text-xl font-semibold">Step 1: Add Friends</h3>
          </div>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Search for friends by username and send a request</li>
            <li>Organize friends into custom categories for easier planning</li>
          </ul>
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Link
              to="/friends"
              className="inline-block px-4 py-2 bg-primary text-dark rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Find Friends
            </Link>
          </motion.div>
        </motion.div>

        {/* Step 2: Set Your Availability */}
        <motion.div
          className="bg-dark/80 text-primary border border-primary shadow-md shadow-primary p-5 rounded-md"
          variants={itemVariants}
        >
          <div className="flex items-center mb-3">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-2xl mr-3" />
            <h3 className="text-xl font-semibold">
              Step 2: Set Your Availability
            </h3>
          </div>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Create a Window to let friends know when you're free</li>
            <li>Set preferred activities and customize visibility</li>
            <li>Use Presets for recurring availability patterns</li>
          </ul>
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Link
              to="/windows"
              className="inline-block px-4 py-2 bg-primary text-dark rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Create a Window
            </Link>
          </motion.div>
        </motion.div>

        {/* Step 3: See Who's Free */}
        <motion.div
          className="bg-dark/80 text-primary border border-primary shadow-md shadow-primary p-5 rounded-md"
          variants={itemVariants}
        >
          <div className="flex items-center mb-3">
            <FontAwesomeIcon icon={faUsers} className="text-2xl mr-3" />
            <h3 className="text-xl font-semibold">
              Step 3: See Who's Free and When
            </h3>
          </div>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>
              Check your Hyv view to see which friends have availability that
              matches yours.
            </li>
            <li>Send a Hangout Request for a specific time and activity</li>
            <li>Filter by categories to find the right group</li>
          </ul>
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Link
              to="/hive"
              className="inline-block px-4 py-2 bg-primary text-dark rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              View Available Friends
            </Link>
          </motion.div>
        </motion.div>

        {/* Step 4: Manage Hangouts */}
        <motion.div
          className="bg-dark/80 text-primary border border-primary shadow-md shadow-primary p-5 rounded-md"
          variants={itemVariants}
        >
          <div className="flex items-center mb-3">
            <FontAwesomeIcon icon={faCheckCircle} className="text-2xl mr-3" />
            <h3 className="text-xl font-semibold">Step 4: Manage Hangouts</h3>
          </div>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Accept or decline Hangout Requests</li>
            <li>See Open Hangouts and request to join</li>
            <li>View your upcoming and past hangouts</li>
          </ul>
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Link
              to="/hangouts"
              className="inline-block px-4 py-2 bg-primary text-dark rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Manage Hangouts
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Advanced Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Collapsible.Root
          open={isAdvancedOpen}
          onOpenChange={setIsAdvancedOpen}
          className="bg-dark/80 text-primary border border-primary shadow-md shadow-primary rounded-md mb-6"
        >
          <div className="p-5">
            <Collapsible.Trigger asChild>
              <button className="flex justify-between w-full items-center font-semibold text-xl">
                <span>Advanced Features</span>
                <FontAwesomeIcon
                  icon={isAdvancedOpen ? faChevronUp : faChevronDown}
                />
              </button>
            </Collapsible.Trigger>
          </div>
          <Collapsible.Content>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-5 pb-5 space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Organizing Your Friends
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Create Categories to filter friends by groups (work, close
                    friends, etc.)
                  </li>
                  <li>Use categories to limit who sees your Windows</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Filtering & Customization
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Filter by category to only see relevant availability</li>
                  <li>
                    Adjust your notice period to control when others can request
                    to hang out
                  </li>
                </ul>
              </div>
            </motion.div>
          </Collapsible.Content>
        </Collapsible.Root>
      </motion.div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-dark/80 text-primary border border-primary shadow-md shadow-primary p-6 rounded-md text-center"
      >
        <h2 className="text-2xl font-semibold mb-4">
          Ready to make plans easier?
        </h2>
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="inline-block"
        >
          <Link
            to="/windows"
            className="inline-block px-6 py-3 bg-primary text-dark font-semibold rounded-md hover:bg-primary/90 transition-colors"
          >
            Create Your First Window
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Welcome;
