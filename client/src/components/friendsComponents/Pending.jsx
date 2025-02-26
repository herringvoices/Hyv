import { useState, useEffect, useContext } from "react";
import PendingItem from "./PendingItem";
import {
  getPendingFriendRequests,
  respondToFriendRequest,
} from "../../services/friendRequestService";
import {
  getPendingTagalongs,
  respondToTagalongRequest,
} from "../../services/tagalongService";
import { UserContext } from "../../context/UserContext";

function Pending({ refreshNotifications }) {
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
  const [pendingTagalongs, setPendingTagalongs] = useState([]);
  const { relationshipNotifications } = useContext(UserContext);

  const fetchPendingRequests = async () => {
    try {
      const friendRequests = await getPendingFriendRequests(false);
      setPendingFriendRequests(friendRequests);

      const tagalongs = await getPendingTagalongs(false); // false = user is recipient
      setPendingTagalongs(tagalongs);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pending Requests</h2>

      {relationshipNotifications.total === 0 ? (
        <p className="text-light">No pending requests</p>
      ) : (
        <>
          {/* Friend Requests Section */}
          {relationshipNotifications.friendRequestCount > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Friend Requests</h3>
              <ul className="space-y-2">
                {pendingFriendRequests.map((request) => (
                  <PendingItem
                    key={request.id}
                    request={request}
                    fetchPendingRequests={fetchPendingRequests}
                    refreshNotifications={refreshNotifications}
                    isTagalong={false}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Tagalong Requests Section */}
          {relationshipNotifications.tagalongRequestCount > 0 && (
            <div>
              <h3 className="text-md font-medium mb-2">Tagalong Requests</h3>
              <ul className="space-y-2">
                {pendingTagalongs.map((request) => (
                  <PendingItem
                    key={request.id}
                    request={request}
                    fetchPendingRequests={fetchPendingRequests}
                    refreshNotifications={refreshNotifications}
                    isTagalong={true}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Pending;
