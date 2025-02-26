import { useState, useEffect, useContext } from "react";
import { getPendingFriendRequests } from "../../services/friendRequestService";
import PendingItem from "./PendingItem";
import { UserContext } from "../../context/UserContext";

function Pending() {
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
  const { loggedInUser } = useContext(UserContext);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const result = await getPendingFriendRequests(false);
        setPendingFriendRequests(result);
      } catch (error) {
        console.error(error);
      }
    };

    fetchPendingRequests();
  }, [loggedInUser]);

  return (
    <ul>
      {pendingFriendRequests.map((request) => (
        <PendingItem key={request.id} request={request} />
      ))}
    </ul>
  );
}

export default Pending;
