import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getUserById } from "../services/userServices";
import {
  getSentPendingHangoutRequests,
  getPastHangoutsWithUser,
  getUpcomingHangoutsWithUser,
} from "../services/hangoutService";
import Spinner from "../components/misc/Spinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Accordion } from "radix-ui";
import { motion, AnimatePresence } from "framer-motion";
import MainFriendDetails from "../components/friendsComponents/FriendsDetails/MainFriendDetails";
import SentPendingHangoutRequestItem from "../components/friendsComponents/SentPendingHangoutRequestItem";
import SharedUpcomingHangoutItem from "../components/friendsComponents/SharedUpcomingHangoutItem";
import SharedPastHangoutItem from "../components/friendsComponents/SharedPastHangoutItem";

function FriendDetails() {
  const { friendId } = useParams();
  const [friend, setFriend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openItem, setOpenItem] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [upcomingHangouts, setUpcomingHangouts] = useState([]);
  const [pastHangouts, setPastHangouts] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [loadingPast, setLoadingPast] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [upcomingError, setUpcomingError] = useState(null);
  const [pastError, setPastError] = useState(null);

  useEffect(() => {
    const fetchFriendDetails = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(friendId);
        setFriend(userData);
        setError(null);
      } catch (err) {
        console.error("Error fetching friend details:", err);
        setError("Failed to load friend details");
      } finally {
        setLoading(false);
      }
    };

    if (friendId) {
      fetchFriendDetails();
    }
  }, [friendId]);

  // Fetch pending hangout requests when accordion opens
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (openItem === "pending-requests" && friendId) {
        try {
          setLoadingRequests(true);
          setRequestError(null);
          const requests = await getSentPendingHangoutRequests(friendId);
          setPendingRequests(requests);
        } catch (err) {
          console.error("Error fetching pending hangout requests:", err);
          setRequestError("Failed to load pending hangout requests");
        } finally {
          setLoadingRequests(false);
        }
      }
    };

    fetchPendingRequests();
  }, [openItem, friendId]);

  // Fetch upcoming shared hangouts when accordion opens
  useEffect(() => {
    if (openItem === "upcoming-hangouts" && friendId) {
      const fetchUpcomingHangouts = async () => {
        try {
          setLoadingUpcoming(true);
          setUpcomingError(null);
          const data = await getUpcomingHangoutsWithUser(friendId);
          setUpcomingHangouts(data);
        } catch (error) {
          console.error("Error fetching upcoming hangouts:", error);
          setUpcomingError("Failed to load upcoming hangouts");
        } finally {
          setLoadingUpcoming(false);
        }
      };
      fetchUpcomingHangouts();
    }
  }, [openItem, friendId]);

  // Fetch past shared hangouts when accordion opens
  useEffect(() => {
    if (openItem === "past-hangouts" && friendId) {
      const fetchPastHangouts = async () => {
        try {
          setLoadingPast(true);
          setPastError(null);
          const data = await getPastHangoutsWithUser(friendId);
          setPastHangouts(data);
        } catch (error) {
          console.error("Error fetching past hangouts:", error);
          setPastError("Failed to load past hangouts");
        } finally {
          setLoadingPast(false);
        }
      };
      fetchPastHangouts();
    }
  }, [openItem, friendId]);

  const handleAccordionValueChange = (value) => {
    setOpenItem(value);
  };

  // Function to refresh data after actions
  const handleActionComplete = () => {
    if (openItem === "upcoming-hangouts") {
      // Refresh upcoming hangouts
      setLoadingUpcoming(true);
      getUpcomingHangoutsWithUser(friendId)
        .then((data) => setUpcomingHangouts(data))
        .catch((err) => setUpcomingError("Failed to refresh upcoming hangouts"))
        .finally(() => setLoadingUpcoming(false));
    }
  };

  // Chevron animation variants
  const chevronVariants = {
    open: { rotate: 180 },
    closed: { rotate: 0 },
  };

  // Improved animation variants to eliminate the hitch
  const contentVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      overflow: "hidden",
      transition: {
        duration: 0.2,
        ease: "easeInOut",
        // Using a single unified transition for all properties
        when: "afterChildren", // Important: animate parent after children are hidden
      },
    },
    visible: {
      opacity: 1,
      height: "auto",
      overflow: "hidden",
      transition: {
        duration: 0.3,
        ease: "easeOut", // More consistent easing
        when: "beforeChildren", // Important: animate parent before showing children
        staggerChildren: 0.05, // Stagger children animations slightly
      },
    },
  };

  // Animation for the content inside
  const contentChildrenVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-dark/70 justify-center items-center h-full">
        <div className="text-light">{error}</div>
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="flex bg-dark/70 justify-center items-center h-full">
        <div className="text-light">Friend not found.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-full">
      {/* Main Content */}
      <MainFriendDetails friend={friend} />

      {/* Hangouts Content */}
      <div className="w-full md:w-2/3 text-center h-auto md:h-screen py-4 md:py-0">
        <Accordion.Root
          className="w-11/12 md:w-4/5 mx-auto"
          type="single"
          collapsible
          onValueChange={handleAccordionValueChange}
        >
          <Accordion.Item
            className="bg-dark/70 border w-full rounded-md border-primary mt-3 md:mt-5 shadow-md shadow-primary"
            value="pending-requests"
          >
            <Accordion.Trigger className="w-full flex items-center justify-between px-3 md:px-4">
              <h3 className="text-2xl md:text-4xl my-2 md:my-3 text-primary">
                Pending Hangout Requests
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
            <AnimatePresence initial={false}>
              {openItem === "pending-requests" && (
                <motion.div
                  key="pending-content"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={contentVariants}
                  className="overflow-hidden"
                >
                  <motion.div
                    className="px-2 py-4"
                    variants={contentChildrenVariants}
                  >
                    {loadingRequests ? (
                      <div className="flex justify-center items-center">
                        <Spinner size="sm" />
                      </div>
                    ) : requestError ? (
                      <div className="text-red-400">{requestError}</div>
                    ) : pendingRequests.length === 0 ? (
                      <p className="text-light">
                        No pending hangout requests found.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {pendingRequests.map((request) => (
                          <SentPendingHangoutRequestItem
                            key={request.id}
                            request={request}
                          />
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </Accordion.Item>

          {/* Upcoming Hangouts Accordion Item */}
          <Accordion.Item
            className="bg-dark/70 border w-full rounded-md border-primary mt-3 md:mt-5 shadow-md shadow-primary"
            value="upcoming-hangouts"
          >
            <Accordion.Trigger className="w-full flex items-center justify-between px-3 md:px-4">
              <h3 className="text-2xl md:text-4xl my-2 md:my-3 text-primary">
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
            <AnimatePresence initial={false}>
              {openItem === "upcoming-hangouts" && (
                <motion.div
                  key="upcoming-content"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={contentVariants}
                  className="overflow-hidden"
                >
                  <motion.div
                    className="px-2 py-4"
                    variants={contentChildrenVariants}
                  >
                    {loadingUpcoming ? (
                      <div className="flex justify-center items-center">
                        <Spinner size="sm" />
                      </div>
                    ) : upcomingError ? (
                      <div className="text-red-400">{upcomingError}</div>
                    ) : upcomingHangouts.length === 0 ? (
                      <p className="text-light">
                        No upcoming hangouts with {friend.fullName}.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {upcomingHangouts.map((hangout) => (
                          <motion.li
                            key={hangout.id}
                            variants={contentChildrenVariants}
                            className="mb-2"
                          >
                            <SharedUpcomingHangoutItem
                              hangout={hangout}
                              onActionComplete={handleActionComplete}
                            />
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </Accordion.Item>

          {/* Past Hangouts Accordion Item */}
          <Accordion.Item
            className="bg-dark/70 border w-full rounded-md border-primary mt-3 md:mt-5 shadow-md shadow-primary"
            value="past-hangouts"
          >
            <Accordion.Trigger className="w-full flex items-center justify-between px-3 md:px-4">
              <h3 className="text-2xl md:text-4xl my-2 md:my-3 text-primary">
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
            <AnimatePresence initial={false}>
              {openItem === "past-hangouts" && (
                <motion.div
                  key="past-content"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={contentVariants}
                  className="overflow-hidden"
                >
                  <motion.div
                    className="px-2 py-4"
                    variants={contentChildrenVariants}
                  >
                    {loadingPast ? (
                      <div className="flex justify-center items-center">
                        <Spinner size="sm" />
                      </div>
                    ) : pastError ? (
                      <div className="text-red-400">{pastError}</div>
                    ) : pastHangouts.length === 0 ? (
                      <p className="text-light">
                        No past hangouts with {friend.fullName}.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {pastHangouts.map((hangout) => (
                          <motion.li
                            key={hangout.id}
                            variants={contentChildrenVariants}
                            className="mb-2"
                          >
                            <SharedPastHangoutItem hangout={hangout} />
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </Accordion.Item>
        </Accordion.Root>
      </div>
    </div>
  );
}

export default FriendDetails;
