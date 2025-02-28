import React from "react";
import { Dialog } from "radix-ui";

function DeleteCategoryModal({ isOpen, onOpenChange, category, onDelete }) {
  if (!category) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 border border-primary shadow-lg shadow-primary transform -translate-x-1/2 -translate-y-1/2 bg-dark/90 p-6 rounded-lg w-96">
          <Dialog.Title className="text-xl font-bold text-primary mb-4">
            Confirm Deletion
          </Dialog.Title>
          <p className="text-light mb-6">
            Are you sure you want to delete the category "{category?.name}"?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-3 py-1 bg-dark text-light border border-light rounded hover:bg-dark/80"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default DeleteCategoryModal;
