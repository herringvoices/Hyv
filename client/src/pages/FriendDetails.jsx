import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getUserById } from "../services/userServices";
import Spinner from "../components/misc/Spinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Accordion } from "radix-ui";
import { motion } from "framer-motion";
import MainFriendDetails from "../components/friendsComponents/FriendsDetails/MainFriendDetails";

function FriendDetails() {
  const { friendId } = useParams();
  const [friend, setFriend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openItem, setOpenItem] = useState(null);

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

  const handleAccordionValueChange = (value) => {
    setOpenItem(value);
  };

  // Chevron animation variants
  const chevronVariants = {
    open: { rotate: 180 },
    closed: { rotate: 0 },
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
    <div className="flex w-full h-full">
      {/* Main Content */}
      <MainFriendDetails friend={friend} />

      {/* Hangouts Content (To be implemented later) */}
      <div className="w-2/3 text-center h-screen">
        <Accordion.Root
          className="w-4/5 mx-auto"
          type="single"
          collapsible
          onValueChange={handleAccordionValueChange}
        >
          <Accordion.Item
            className="bg-dark/70 border w-full border-primary mt-5 shadow-md shadow-primary"
            value="pending-requests"
          >
            <Accordion.Trigger className="w-full flex items-center justify-between px-4">
              <h3 className="text-4xl my-3 text-primary">Pending Requests</h3>
              <motion.div
                animate={openItem === "pending-requests" ? "open" : "closed"}
                variants={chevronVariants}
                transition={{ duration: 0.3 }}
              >
                <FontAwesomeIcon
                  icon="fa-solid fa-circle-chevron-down"
                  className="text-primary text-2xl"
                />
              </motion.div>
            </Accordion.Trigger>
            <Accordion.Content>
              <p>This feature has yet to be implemented</p>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item
            className="bg-dark/70 border w-full border-primary mt-5 shadow-md shadow-primary"
            value="upcoming-hangouts"
          >
            <Accordion.Trigger className="w-full flex items-center justify-between px-4">
              <h3 className="text-4xl my-3 text-primary">Upcoming Hangouts</h3>
              <motion.div
                animate={openItem === "upcoming-hangouts" ? "open" : "closed"}
                variants={chevronVariants}
                transition={{ duration: 0.3 }}
              >
                <FontAwesomeIcon
                  icon="fa-solid fa-circle-chevron-down"
                  className="text-primary text-2xl"
                />
              </motion.div>
            </Accordion.Trigger>
            <Accordion.Content>
              <p>This feature has yet to be implemented</p>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item
            className="bg-dark/70 border w-full border-primary mt-5 shadow-md shadow-primary"
            value="past-hangouts"
          >
            <Accordion.Trigger className="w-full flex items-center justify-between px-4">
              <h3 className="text-4xl my-3 text-primary">Past Hangouts</h3>
              <motion.div
                animate={openItem === "past-hangouts" ? "open" : "closed"}
                variants={chevronVariants}
                transition={{ duration: 0.3 }}
              >
                <FontAwesomeIcon
                  icon="fa-solid fa-circle-chevron-down"
                  className="text-primary text-2xl"
                />
              </motion.div>
            </Accordion.Trigger>
            <Accordion.Content>
              <p>This feature has yet to be implemented</p>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </div>
    </div>
  );
}

export default FriendDetails;
