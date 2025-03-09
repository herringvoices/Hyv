import React, { useState } from "react";
import { Dialog } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { deletePreset } from "../../services/presetService";

export default function DeletePresetModal({ isOpen, onClose, preset }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!preset) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await deletePreset(preset.id);
      onClose(true); // Close and trigger refresh
    } catch (err) {
      console.error("Error deleting preset:", err);
      setError("Failed to delete preset. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!preset) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={() => onClose(false)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed border border-primary shadow-primary shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md z-50">
          <Dialog.Title className="text-xl font-bold text-primary mb-4">
            Delete Preset
          </Dialog.Title>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-light mb-2">Are you sure you want to delete this preset?</p>
            <p className="text-light font-medium">{preset.title}</p>
            <p className="text-gray-400 text-sm mt-1">This action cannot be undone.</p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 border border-gray-600 rounded text-light hover:bg-gray-800"
              onClick={() => onClose(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>

            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-primary"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}