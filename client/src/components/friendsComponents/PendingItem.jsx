import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { respondToFriendRequest } from "../../services/friendRequestService";
import { respondToTagalongRequest } from "../../services/tagalongService";

function PendingItem({
  request,
  fetchPendingRequests,
  refreshNotifications,
  isTagalong,
}) {
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [isAccepted, setIsAccepted] = useState(null);

  const requestType = isTagalong ? "tagalong" : "friend";
  const requestSender = request.sender;

  const handleAcceptClick = () => {
    setModalText(
      `Are you sure you want to accept this ${requestType} request from ${requestSender.fullName}?`
    );
    setIsAccepted(true);
    setShowModal(true);
  };

  const handleRejectClick = () => {
    setModalText(
      `Are you sure you want to reject this ${requestType} request from ${requestSender.fullName}?`
    );
    setIsAccepted(false);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    try {
      if (isTagalong) {
        await respondToTagalongRequest(request.id, isAccepted);
      } else {
        await respondToFriendRequest(request.id, isAccepted);
      }

      // Update both local state and global notification counts
      await fetchPendingRequests();
      await refreshNotifications();
    } catch (error) {
      console.error(`Failed to respond to ${requestType} request:`, error);
    }
    setShowModal(false);
  };

  const handleCancel = () => setShowModal(false);

  return (
    <li className="flex justify-between my-3 items-center p-2 text-dark bg-primary rounded-md text-xl">
      <div className="flex items-center">
        {requestSender.profilePicture ? (
          <img
            src={requestSender.profilePicture}
            alt={`${requestSender.fullName}'s profile`}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <FontAwesomeIcon className="ms-2 size-12 " icon="fa-solid fa-user" />
        )}
        <div className="mx-2 text-left">
          <div>{requestSender.fullName}</div>
          <div className="text-sm">{requestSender.userName}</div>
          {isTagalong && (
            <div className="text-sm font-semibold mt-1">
              Wants to tagalong with you
            </div>
          )}
        </div>
      </div>
      <div className="me-2 flex gap-2">
        <button onClick={handleRejectClick} className="focus:outline-none">
          <FontAwesomeIcon
            className="text-secondary size-10 hover:opacity-80"
            icon="fa-solid fa-square-xmark"
          />
        </button>
        <button onClick={handleAcceptClick} className="focus:outline-none">
          <FontAwesomeIcon
            className=" size-10 hover:opacity-80"
            icon="fa-solid fa-square-check"
          />
        </button>
      </div>

      {/* Modal Confirmation */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-primary p-4 rounded-md font-bold">
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

export default PendingItem;
