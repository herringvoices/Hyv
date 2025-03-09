import React, { useState, useEffect } from "react";
import { Accordion } from "radix-ui";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getPendingHangoutRequests,
  getUpcomingHangouts,
  getPastHangouts,
  getPendingJoinRequests,
} from "../../services/hangoutService";
import PendingHangoutItem from "../hangoutComponents/PendingHangoutItem";
import PendingJoinRequestItem from "../hangoutComponents/PendingJoinRequestItem";
import SharedUpcomingHangoutItem from "../friendsComponents/SharedUpcomingHangoutItem";
import SharedPastHangoutItem from "../friendsComponents/SharedPastHangoutItem";
import Spinner from "../misc/Spinner";

function HangoutsTab() {
  const [openItem, setOpenItem] = useState(null);
  const [pendingHangouts, setPendingHangouts] = useState([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]);
  const [upcomingHangouts, setUpcomingHangouts] = useState([]);
  const [pastHangouts, setPastHangouts] = useState([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingJoinRequests, setIsLoadingJoinRequests] = useState(true);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);
  const [isLoadingPast, setIsLoadingPast] = useState(false);
  const [upcomingError, setUpcomingError] = useState(null);
  const [pastError, setPastError] = useState(null);
  const [joinRequestsError, setJoinRequestsError] = useState(null);

  // Chevron animation variants
  const chevronVariants = {
    open: { rotate: 180 },
    closed: { rotate: 0 },
  };

  const fetchPendingHangouts = async () => {
    try {
      setIsLoadingPending(true);
      const data = await getPendingHangoutRequests();
      setPendingHangouts(data);
    } catch (error) {
      console.error("Error fetching pending hangouts:", error);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const fetchPendingJoinRequests = async () => {
    try {
      setIsLoadingJoinRequests(true);
      setJoinRequestsError(null);
      const data = await getPendingJoinRequests();
      setPendingJoinRequests(data);
    } catch (error) {
      console.error("Error fetching pending join requests:", error);
      setJoinRequestsError("Failed to load join requests");
    } finally {
      setIsLoadingJoinRequests(false);
    }
  };

  const fetchUpcomingHangouts = async () => {
    try {
      setIsLoadingUpcoming(true);
      setUpcomingError(null);
      const data = await getUpcomingHangouts();
      setUpcomingHangouts(data);
    } catch (error) {
      console.error("Error fetching upcoming hangouts:", error);
      setUpcomingError("Failed to load upcoming hangouts");
    } finally {
      setIsLoadingUpcoming(false);
    }
  };

  const fetchPastHangouts = async () => {
    try {
      setIsLoadingPast(true);
      setPastError(null);
      const data = await getPastHangouts();
      setPastHangouts(data);
    } catch (error) {
      console.error("Error fetching past hangouts:", error);
      setPastError("Failed to load past hangouts");
    } finally {
      setIsLoadingPast(false);
    }
  };

  // Initial load of pending hangouts and join requests
  useEffect(() => {
    fetchPendingHangouts();
    fetchPendingJoinRequests();
  }, []);

  // Load data when accordion sections are opened
  useEffect(() => {
    if (openItem === "upcoming-hangouts") {
      fetchUpcomingHangouts();
    } else if (openItem === "past-hangouts") {
      fetchPastHangouts();
    }
  }, [openItem]);

  const handleAccordionValueChange = (value) => {
    setOpenItem(value);
  };

  // Function to refresh data after an action (delete, leave, etc.)
  const handleActionComplete = () => {
    if (openItem === "upcoming-hangouts") {
      fetchUpcomingHangouts();
    } else if (openItem === "past-hangouts") {
      fetchPastHangouts();
    }
  };

  // Calculate total pending items for badge display
  const totalPendingItems = pendingHangouts.length + pendingJoinRequests.length;

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
              Pending Requests
              {totalPendingItems > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {totalPendingItems}
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
            {/* Hangout Requests Section */}
            <h4 className="text-lg font-semibold mb-2 text-primary">
              Hangout Invitations
            </h4>
            {isLoadingPending ? (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            ) : pendingHangouts.length === 0 ? (
              <p className="text-light p-2 mb-4">
                No pending hangout invitations
              </p>
            ) : (
              <ul className="space-y-2 mb-4">
                {pendingHangouts.map((request) => (
                  <PendingHangoutItem
                    key={request.id}
                    request={request}
                    refreshRequests={fetchPendingHangouts}
                  />
                ))}
              </ul>
            )}

            {/* Join Requests Section */}
            <h4 className="text-lg font-semibold mb-2 text-primary">
              Join Requests
            </h4>
            {isLoadingJoinRequests ? (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            ) : joinRequestsError ? (
              <p className="text-red-400 p-2">{joinRequestsError}</p>
            ) : pendingJoinRequests.length === 0 ? (
              <p className="text-light p-2">No pending join requests</p>
            ) : (
              <ul className="space-y-2">
                {pendingJoinRequests.map((request) => (
                  <PendingJoinRequestItem
                    key={request.id}
                    request={request}
                    refreshRequests={fetchPendingJoinRequests}
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
              {upcomingHangouts.length > 0 && (
                <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {upcomingHangouts.length}
                </span>
              )}
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
            {isLoadingUpcoming ? (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            ) : upcomingError ? (
              <p className="text-red-400 p-2">{upcomingError}</p>
            ) : upcomingHangouts.length === 0 ? (
              <p className="text-light p-2">No upcoming hangouts</p>
            ) : (
              <ul className="space-y-2">
                {upcomingHangouts.map((hangout) => (
                  <SharedUpcomingHangoutItem
                    key={hangout.id}
                    hangout={hangout}
                    onActionComplete={handleActionComplete}
                  />
                ))}
              </ul>
            )}
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
            {isLoadingPast ? (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            ) : pastError ? (
              <p className="text-red-400 p-2">{pastError}</p>
            ) : pastHangouts.length === 0 ? (
              <p className="text-light p-2">No past hangouts</p>
            ) : (
              <ul className="space-y-2">
                {pastHangouts.map((hangout) => (
                  <SharedPastHangoutItem key={hangout.id} hangout={hangout} />
                ))}
              </ul>
            )}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}

export default HangoutsTab;
