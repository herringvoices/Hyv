import React from "react";
import { Dialog } from "radix-ui";
import { removeUserFromCategory } from "../../../services/categoryMemberService";

function RemoveFriendModal({ isOpen, onClose, friend, categoryId, onSuccess }) {
  const handleRemoveUser = async () => {
    try {
      await removeUserFromCategory(categoryId, friend.id);
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error removing user from category:", error);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md z-50">
          <Dialog.Title className="text-xl font-bold text-primary mb-4">
            Remove Friend from Category
          </Dialog.Title>

          <p className="text-light mb-6">
            Are you sure you want to remove {friend?.fullName} from this
            category?
          </p>

          <div className="flex justify-end space-x-3">
            <Dialog.Close className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Cancel
            </Dialog.Close>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={handleRemoveUser}
            >
              Remove
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default RemoveFriendModal;
