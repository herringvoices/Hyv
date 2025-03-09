import { useState, useEffect } from "react";
import PendingHangoutItem from "./PendingHangoutItem";
import PendingJoinRequestItem from "./PendingJoinRequestItem";
import { getPendingJoinRequests } from "../../services/hangoutService";

function PendingHangouts({ pendingHangouts, fetchPendingHangouts, isLoading }) {
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);

  const fetchPendingJoinRequests = async () => {
    setJoinRequestsLoading(true);
    try {
      const requests = await getPendingJoinRequests();
      setPendingJoinRequests(requests);
    } catch (error) {
      console.error("Error fetching pending join requests:", error);
    } finally {
      setJoinRequestsLoading(false);
    }
  };

  // Fetch join requests when the component mounts
  useEffect(() => {
    fetchPendingJoinRequests();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pending Hangout Requests</h2>

      {isLoading ? (
        <p className="text-light">Loading pending hangout requests...</p>
      ) : pendingHangouts.length === 0 ? (
        <p className="text-light">No pending hangout requests</p>
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

      <h2 className="text-lg font-semibold">Pending Join Requests</h2>

      {joinRequestsLoading ? (
        <p className="text-light">Loading pending join requests...</p>
      ) : pendingJoinRequests.length === 0 ? (
        <p className="text-light">No pending join requests</p>
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
    </div>
  );
}

export default PendingHangouts;
