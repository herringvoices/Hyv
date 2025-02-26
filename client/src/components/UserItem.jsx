import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendFriendRequest } from "../services/friendRequestService";

// Accept "pending" prop to control plus button availability.
function UserItem({ user, pending, refreshPending }) {
  const [showModal, setShowModal] = useState(false);

  const handlePlusClick = () => {
    if (!pending) {
      setShowModal(true);
    }
  };

  const handleConfirm = async () => {
    try {
      await sendFriendRequest(user.id);
      setShowModal(false);
      refreshPending();
    } catch (error) {
      console.error(error);
      setShowModal(false);
    }
  };

  const handleCancel = () => setShowModal(false);

  return (
    <li className="flex justify-between items-center p-2 text-dark bg-primary rounded-md text-xl">
      <div className="flex items-center">
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={`${user.fullName}'s profile`}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <FontAwesomeIcon className="ms-2 size-12" icon="fa-solid fa-user" />
        )}
        <div className="mx-2 text-left">
          <div>{user.fullName}</div>
          <div className="text-sm">{user.userName}</div>
        </div>
      </div>
      <div className="me-2">
        <button
          onClick={handlePlusClick}
          disabled={pending}
          className="focus:outline-none disabled:opacity-70" // updated class to add disabled opacity
        >
          <FontAwesomeIcon className="size-10" icon="fa-solid fa-square-plus" />
        </button>
      </div>

      {/* Modal Confirmation */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-primary p-4 rounded-md font-bold">
            <p>
              Are you sure you want to send a friend request to {user.fullName}?
            </p>
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

export default UserItem;
