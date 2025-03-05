import React, { useState, useEffect } from "react";
import { Accordion } from "radix-ui";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getPendingHangoutRequests } from "../../services/hangoutService";
import PendingHangoutItem from "../hangoutComponents/PendingHangoutItem";
import Spinner from "../misc/Spinner";

function HangoutsTab() {
  const [openItem, setOpenItem] = useState(null);
  const [pendingHangouts, setPendingHangouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Chevron animation variants
  const chevronVariants = {
    open: { rotate: 180 },
    closed: { rotate: 0 },
  };

  const fetchPendingHangouts = async () => {
    try {
      setIsLoading(true);
      const data = await getPendingHangoutRequests();
      setPendingHangouts(data);
    } catch (error) {
      console.error("Error fetching pending hangouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingHangouts();
  }, []);

  const handleAccordionValueChange = (value) => {
    setOpenItem(value);
  };

  return (
    <div className="bg-dark/70 rounded-md p-4 text-light">
      <h2 className="text-primary text-2xl md:text-3xl font-bold mb-4">
        Hangouts
      </h2>

      <Accordion.Root
        className="w-full mx-auto"
        type="single"
        collapsible
        onValueChange={handleAccordionValueChange}
      >
        <Accordion.Item
          className="border w-full rounded-md border-primary mt-3 shadow-md shadow-primary"
          value="pending-requests"
        >
          <Accordion.Trigger className="w-full flex items-center justify-between px-3 md:px-4">
            <h3 className="text-xl md:text-2xl my-2 md:my-3 text-primary">
              Pending Hangout Requests
              {pendingHangouts.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingHangouts.length}
                </span>
              )}
            </h3>
            <motion.div
              animate={openItem === "pending-requests" ? "open" : "closed"}
              variants={chevronVariants}
              transition={{ duration: 0.3 }}
            >
              <FontAwesomeIcon
                icon="fa-solid fa-circle-chevron-down"
                className="text-primary text-xl md:text-2xl"
              />
            </motion.div>
          </Accordion.Trigger>
          <Accordion.Content className="px-2 py-2">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            ) : pendingHangouts.length === 0 ? (
              <p className="text-light p-2">No pending hangout requests</p>
            ) : (
              <ul className="space-y-2">
                {pendingHangouts.map((request) => (
                  <PendingHangoutItem
                    key={request.id}
                    request={request}
                    refreshRequests={fetchPendingHangouts}
                  />
                ))}
              </ul>
            )}
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item
          className="border w-full rounded-md border-primary mt-3 shadow-md shadow-primary"
          value="upcoming-hangouts"
        >
          <Accordion.Trigger className="w-full flex items-center justify-between px-3 md:px-4">
            <h3 className="text-xl md:text-2xl my-2 md:my-3 text-primary">
              Upcoming Hangouts
            </h3>
            <motion.div
              animate={openItem === "upcoming-hangouts" ? "open" : "closed"}
              variants={chevronVariants}
              transition={{ duration: 0.3 }}
            >
              <FontAwesomeIcon
                icon="fa-solid fa-circle-chevron-down"
                className="text-primary text-xl md:text-2xl"
              />
            </motion.div>
          </Accordion.Trigger>
          <Accordion.Content className="px-2 py-2">
            <p className="text-light p-2">
              This feature has yet to be implemented
            </p>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item
          className="border w-full rounded-md border-primary mt-3 shadow-md shadow-primary"
          value="past-hangouts"
        >
          <Accordion.Trigger className="w-full flex items-center justify-between px-3 md:px-4">
            <h3 className="text-xl md:text-2xl my-2 md:my-3 text-primary">
              Past Hangouts
            </h3>
            <motion.div
              animate={openItem === "past-hangouts" ? "open" : "closed"}
              variants={chevronVariants}
              transition={{ duration: 0.3 }}
            >
              <FontAwesomeIcon
                icon="fa-solid fa-circle-chevron-down"
                className="text-primary text-xl md:text-2xl"
              />
            </motion.div>
          </Accordion.Trigger>
          <Accordion.Content className="px-2 py-2">
            <p className="text-light p-2">
              This feature has yet to be implemented
            </p>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}

export default HangoutsTab;
