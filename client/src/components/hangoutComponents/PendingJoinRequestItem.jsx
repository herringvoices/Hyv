import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  acceptJoinRequest,
  rejectJoinRequest,
} from "../../services/hangoutService";

function PendingJoinRequestItem({ request, refreshRequests }) {
  const [confirmModal, setConfirmModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [responseType, setResponseType] = useState(null);
  const [createWindow, setCreateWindow] = useState(false);

  const handleResponseClick = (response) => {
    if (response === "accept") {
      setModalText(
        `Are you sure you want to accept this join request from ${request.user.fullName}?`
      );
    } else {
      setModalText(
        `Are you sure you want to decline this join request from ${request.user.fullName}?`
      );
    }

    setResponseType(response);
    setConfirmModal(true);
  };

  const handleConfirm = async () => {
    setConfirmModal(false);

    try {
      if (responseType === "accept") {
        await acceptJoinRequest(request.id, createWindow);
      } else {
        await rejectJoinRequest(request.id);
      }
      await refreshRequests();
    } catch (error) {
      console.error(`Failed to ${responseType} join request:`, error);
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

  return (
    <li className="flex flex-col my-3 text-dark bg-primary rounded-md">
      {/* Requester info */}
      <div className="flex items-center mb-2 bg-dark border border-primary rounded-tl-md rounded-tr-md text-primary">
        <div className="m-2">
          {request.user.profilePicture ? (
            <img
              src={request.user.profilePicture}
              alt={`${request.user.fullName}'s profile`}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <FontAwesomeIcon className="size-10" icon="fa-solid fa-user" />
          )}
        </div>
        <div className="text-left">
          <div className="">
            <strong>{request.user.fullName}</strong> wants to join your hangout!
          </div>
        </div>
      </div>

      {/* Hangout details */}
      <div className="mb-2 m-2 ms-3">
        <h3 className="text-xl font-bold">{request.hangout.title}</h3>
        <p className="text-sm mb-1">{request.hangout.description}</p>
        <p className="text-sm">
          <strong>When:</strong> {formatDate(request.hangout.start)} to{" "}
          {formatDate(request.hangout.end)}
        </p>
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

export default PendingJoinRequestItem;
