import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  acceptHangoutRequest,
  rejectHangoutRequest,
} from "../../services/hangoutService";

function PendingHangoutItem({ request, refreshRequests }) {
  const [confirmModal, setConfirmModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [responseType, setResponseType] = useState(null);
  const [createWindow, setCreateWindow] = useState(false);

  const handleResponseClick = (response) => {
    if (response === "accept") {
      if (request.hangoutRequest.isOpen) {
        setModalText(
          `This will create a new open window in your calendar for this hangout time. Are you sure you want to accept this hangout request from ${request.hangoutRequest.sender.fullName}?`
        );
        setCreateWindow(true);
      } else {
        setModalText(
          `Are you sure you want to accept this hangout request from ${request.hangoutRequest.sender.fullName}?`
        );
        setCreateWindow(false);
      }
    } else {
      setModalText(
        `Are you sure you want to decline this hangout request from ${request.hangoutRequest.sender.fullName}?`
      );
    }

    setResponseType(response);
    setConfirmModal(true);
  };

  const handleConfirm = async () => {
    setConfirmModal(false);

    try {
      if (responseType === "accept") {
        await acceptHangoutRequest(request.id, createWindow);
      } else {
        await rejectHangoutRequest(request.id);
      }
      await refreshRequests();
    } catch (error) {
      console.error(`Failed to ${responseType} hangout request:`, error);
    }
  };

  const handleCancel = () => {
    setConfirmModal(false);
  };

  // Format dates for better display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Get the sender info and request details
  const sender = request.hangoutRequest.sender;
  const title = request.hangoutRequest.title;
  const description = request.hangoutRequest.description;
  const proposedStart = request.hangoutRequest.proposedStart;
  const proposedEnd = request.hangoutRequest.proposedEnd;

  // Get information about other invitees
  const otherInvitees = request.invitations || [];

  return (
    <li className="flex flex-col my-3 text-dark bg-primary rounded-md">
      {/* Sender info */}
      <div className="flex items-center mb-2 bg-dark border border-primary rounded-tl-md rounded-tr-md text-primary">
        <div className="m-2">
          {sender.profilePicture ? (
            <img
              src={sender.profilePicture}
              alt={`${sender.fullName}'s profile`}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <FontAwesomeIcon className="size-10" icon="fa-solid fa-user" />
          )}
        </div>
        <div className="text-left">
          <div className="">
            <strong>{sender.fullName}</strong> wants to hang out!
          </div>
        </div>
      </div>

      {/* Hangout details */}
      <div className="mb-2 m-2 ms-3">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm mb-1">{description}</p>
        <p className="text-sm">
          <strong>When:</strong> {formatDate(proposedStart)} to{" "}
          {formatDate(proposedEnd)}
        </p>

        {/* Display other invitees if present */}
        {otherInvitees.length > 0 && (
          <div className="text-sm mt-1">
            <strong>Also invited:</strong>{" "}
            {otherInvitees.map((invitee, index) => (
              <span key={index}>
                {invitee.recipientName} ({invitee.recipientStatus})
                {index < otherInvitees.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 m-2">
        <button
          onClick={() => handleResponseClick("decline")}
          className="px-4 py-2 bg-red-700 text-light rounded-md hover:opacity-90"
        >
          Decline
        </button>

        <button
          onClick={() => handleResponseClick("accept")}
          className="px-4 py-2 bg-green-700 text-light rounded-md hover:opacity-90"
        >
          Accept
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-primary p-4 rounded-md font-bold max-w-md">
            <p>{modalText}</p>
            {createWindow && responseType === "accept" && (
              <p className="text-sm mt-2 text-gray-700">
                Creating a window will block off this time in your calendar and
                help your friends see when you're available.
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-secondary text-light rounded-md hover:opacity-90"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-dark text-light rounded-md hover:opacity-90"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export default PendingHangoutItem;
