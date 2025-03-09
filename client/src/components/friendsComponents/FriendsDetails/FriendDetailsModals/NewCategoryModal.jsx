import React from "react";
import { Dialog } from "radix-ui";

function NewCategoryModal({
  isOpen,
  onOpenChange,
  categoryName,
  onCategoryNameChange,
  onSubmit,
}) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 border border-primary shadow-lg shadow-primary transform -translate-x-1/2 -translate-y-1/2 bg-dark/90 p-6 rounded-lg w-96">
          <Dialog.Title className="text-xl font-bold text-primary mb-4">
            Create New Category
          </Dialog.Title>
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label htmlFor="categoryName" className="block text-light mb-2">
                Category Name
              </label>
              <input
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={(e) => onCategoryNameChange(e.target.value)}
                className="w-full p-2 rounded bg-light text-dark"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3 py-1 bg-dark text-light border border-light rounded hover:bg-dark/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-primary text-dark rounded hover:bg-primary/80"
                disabled={!categoryName.trim()}
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

export default NewCategoryModal;
