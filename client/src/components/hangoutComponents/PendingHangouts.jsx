import { useState } from "react";
import PendingHangoutItem from "./PendingHangoutItem";

function PendingHangouts({ pendingHangouts, fetchPendingHangouts, isLoading }) {
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
    </div>
  );
}

export default PendingHangouts;
