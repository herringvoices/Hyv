import React, { useState } from "react";
import { Dialog } from "radix-ui";
import { createCategory } from "../../../services/friendshipCategoryService";

function AddCategoryModal({ isOpen, onClose, onSuccess }) {
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await createCategory(newCategoryName);
      setNewCategoryName("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 border border-primary shadow-primary shadow-lg transform -translate-x-1/2 -translate-y-1/2 bg-dark/90 p-6 rounded-lg w-11/12 max-w-md">
          <Dialog.Title className="text-2xl font-bold text-primary mb-4">
            Create New Category
          </Dialog.Title>
          <form onSubmit={handleCreateCategory}>
            <input
              type="text"
              placeholder="Category name"
              className="w-full px-3 py-2 rounded border text-secondary border-primary mb-4"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-dark rounded hover:bg-primary/80"
              >
                Create
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default AddCategoryModal;
