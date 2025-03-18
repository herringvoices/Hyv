import { createContext, useState, useCallback, useEffect } from "react";
import {
  getPendingNotificationCounts,
  getHangoutNotificationCounts,
} from "../services/notificationService";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [relationshipNotifications, setRelationshipNotifications] = useState({
    friendRequestCount: 0,
    tagalongRequestCount: 0,
    total: 0,
  });
  const [hangoutNotifications, setHangoutNotifications] = useState({
    hangoutRequestCount: 0,
    joinRequestCount: 0,
    total: 0,
  });

  const refreshNotifications = useCallback(async () => {
    try {
      if (loggedInUser) {
        // Fetch relationship notifications
        const relationshipCounts = await getPendingNotificationCounts();
        setRelationshipNotifications(relationshipCounts);

        // Fetch hangout notifications
        const hangoutCounts = await getHangoutNotificationCounts();
        setHangoutNotifications(hangoutCounts);
      }
    } catch (error) {
      console.error("Failed to fetch notification counts:", error);
    }
  }, [loggedInUser]);

  // Load notifications when user logs in
  useEffect(() => {
    if (loggedInUser) {
      refreshNotifications();
    }
  }, [loggedInUser, refreshNotifications]);

  return (
    <UserContext.Provider
      value={{
        loggedInUser,
        setLoggedInUser,
        relationshipNotifications,
        setRelationshipNotifications,
        hangoutNotifications,
        setHangoutNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
