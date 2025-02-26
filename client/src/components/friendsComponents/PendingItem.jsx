import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function PendingItem({ request }) {
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");

  const handleAcceptClick = () => {
    setModalText(
      `Are you sure you want to accept this friend request from ${request.sender.fullName}?`
    );
    setShowModal(true);
  };

  const handleRejectClick = () => {
    setModalText(
      `Are you sure you want to reject this friend request from ${request.sender.fullName}?`
    );
    setShowModal(true);
  };

  const handleConfirm = async () => {
    // Placeholder for accept/reject logic
    setShowModal(false);
  };

  const handleCancel = () => setShowModal(false);

  return (
    <li className="flex justify-between my-3 items-center p-2 text-dark bg-primary rounded-md text-xl">
      <div className="flex items-center">
        {request.sender.profilePicture ? (
          <img
            src={request.sender.profilePicture}
            alt={`${request.sender.fullName}'s profile`}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <FontAwesomeIcon className="ms-2 size-12 " icon="fa-solid fa-user" />
        )}
        <div className="mx-2 text-left">
          <div>{request.sender.fullName}</div>
          <div className="text-sm">{request.sender.userName}</div>
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
                className="px-4 py-2 bg-dark text-white rounded-md hover:opacity-90"
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
