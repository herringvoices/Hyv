import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RemoveFriendModal from "./CategoryModals/RemoveFriendModal";

function CategoryItem({ friend, categoryId, onRemove }) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between bg-primary font-bold text-dark p-2 rounded">
        <div className="flex items-center">
          {friend.profilePicture ? (
            <img
              src={friend.profilePicture}
              alt={`${friend.fullName}`}
              className="w-10 h-10 rounded-full mr-2"
            />
          ) : (
            <FontAwesomeIcon
              icon="fa-solid fa-user"
              className="w-10 h-10 mr-2"
            />
          )}
          <span>{friend.fullName}</span>
        </div>
        <button
          className="text-light bg-dark w-[2rem] rounded-lg aspect-square hover:opacity-90 transition-colors"
          onClick={() => setConfirmModalOpen(true)}
          title="Remove from category"
        >
          <FontAwesomeIcon icon="fa-solid fa-trash-can" />
        </button>
      </div>

      <RemoveFriendModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        friend={friend}
        categoryId={categoryId}
        onSuccess={onRemove}
      />
    </>
  );
}

export default CategoryItem;
