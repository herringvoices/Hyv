import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { removeFriend, blockUser } from "../services/friendService";

function FriendItem({ friend, setFriends }) {
  const [showModal, setShowModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  const handleBlockClick = () => {
    setShowModal(true);
  };

  const handleBlockConfirm = async () => {
    try {
      setActionInProgress(true);
      await blockUser(friend.id);
      setFriends([]);
      setShowModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRemoveConfirm = async () => {
    try {
      setActionInProgress(true);
      await removeFriend(friend.id);
      setFriends([]);
      setShowModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCancel = () => setShowModal(false);

  return (
    <li className="flex justify-between items-center my-3 p-2 text-dark bg-primary rounded-md text-xl">
      <div className="flex items-center">
        {friend.profilePicture ? (
          <img
            src={friend.profilePicture}
            alt={`${friend.fullName}'s profile`}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <FontAwesomeIcon className="ms-2 size-12" icon="fa-solid fa-user" />
        )}
        <div className="mx-2 text-left">
          <div>{friend.fullName}</div>
          <div className="text-sm">{friend.userName}</div>
        </div>
      </div>
      <div className="me-2">
        <button onClick={handleBlockClick} className="focus:outline-none">
          <FontAwesomeIcon
            className="size-10"
            icon="fa-solid fa-square-xmark"
          />
        </button>
      </div>

      {/* Modal Confirmation */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-primary p-4 rounded-md font-bold">
            <p>Are you sure you want to block or remove {friend.fullName}?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-secondary text-light rounded-md hover:opacity-90"
                disabled={actionInProgress}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConfirm}
                className="px-4 py-2 bg-dark text-white rounded-md hover:opacity-90"
                disabled={actionInProgress}
              >
                Remove
              </button>
              <button
                onClick={handleBlockConfirm}
                className="px-4 py-2 bg-dark text-white rounded-md hover:opacity-90"
                disabled={actionInProgress}
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export default FriendItem;
