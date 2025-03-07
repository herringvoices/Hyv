import React, { useState } from "react";
import { Dialog } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendJoinRequest } from "../../services/hangoutService";

export default function JoinRequestModal({ isOpen, onClose, windowInfo }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get hangoutId from windowInfo extended props
      const hangoutId = windowInfo.extendedProps.hangoutId;

      // Send join request
      await sendJoinRequest(hangoutId);

      // Close modal with success
      onClose(true);
    } catch (err) {
      console.error("Error sending join request:", err);
      setError("Failed to send join request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!windowInfo) return null;

  // Extract information about the hangout and participants
  const hangoutId = windowInfo.extendedProps.hangoutId;
  const title = windowInfo.title;
  const start = new Date(windowInfo.start);
  const end = new Date(windowInfo.end);
  const participants = windowInfo.extendedProps.participants || [];

  // Format date and time for display
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed border border-primary shadow-primary shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="text-xl font-bold text-primary mb-4">
            Join Hangout
          </Dialog.Title>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-medium text-light">{title}</h3>
            <p className="text-gray-400">
              {formatDate(start)} from {formatTime(start)} to {formatTime(end)}
            </p>
          </div>

          <div className="mb-4">
            <h4 className="font-medium mb-2 text-light">Current Participants:</h4>
            {participants.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-300">
                {participants.map((participant) => (
                  <li key={participant.userId}>
                    {participant.user
                      ? participant.user.fullName
                      : "Unknown User"}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">
                No participants information available
              </p>
            )}
          </div>

          <p className="mb-4 text-light">
            Would you like to send a request to join this hangout?
          </p>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="px-4 py-2 border border-gray-600 rounded text-light hover:bg-gray-800"
              onClick={() => onClose(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-primary text-dark rounded hover:bg-primary/90 flex items-center"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-dark"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </>
              ) : (
                "Send Join Request"
              )}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-primary"
              aria-label="Close"
            >
              <FontAwesomeIcon icon="times" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
