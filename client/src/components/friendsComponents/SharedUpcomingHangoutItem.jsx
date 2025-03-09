import { useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog } from "radix-ui";
import HangoutFormModal from "../hangouts/HangoutFormModal";
import { deleteHangout, leaveHangout } from "../../services/hangoutService";

function SharedUpcomingHangoutItem({ hangout, onActionComplete }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Format dates consistently
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const handleLeave = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await leaveHangout(hangout.id);
      setShowLeaveModal(false);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setError(`Failed to leave hangout: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await deleteHangout(hangout.id);
      setShowDeleteModal(false);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setError(`Failed to delete hangout: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditComplete = (refreshNeeded) => {
    setShowEditModal(false);
    if (refreshNeeded && onActionComplete) onActionComplete();
  };

  return (
    <li className="flex flex-col my-3 text-dark bg-primary rounded-md">
      {/* Hangout details */}
      <div className="mb-2 m-2 ms-3">
        <h3 className="text-xl font-bold">{hangout.title}</h3>
        <p className="text-sm mb-1">{hangout.extendedProps?.description}</p>
        <p className="text-sm">
          <strong>When:</strong> {formatDate(hangout.start)} to{" "}
          {formatDate(hangout.end)}
        </p>
        {hangout.extendedProps?.guests &&
          hangout.extendedProps.guests.length > 0 && (
            <p className="text-sm mt-1">
              <strong>With:</strong>{" "}
              {hangout.extendedProps.guests
                .map((guest) => guest.fullName)
                .join(", ")}
            </p>
          )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-2 m-2">
        <button
          onClick={() => setShowLeaveModal(true)}
          className="px-3 py-1 bg-dark text-light rounded-md text-sm hover:bg-gray-700"
        >
          Leave
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
        >
          Delete
        </button>
        <button
          onClick={() => setShowEditModal(true)}
          className="px-3 py-1 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-500"
        >
          Edit
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg border border-red-500 w-11/12 max-w-md z-50">
            <Dialog.Title className="text-xl font-bold text-red-500 mb-4">
              Delete Hangout
            </Dialog.Title>
            <Dialog.Description className="text-light mb-6">
              Are you sure you want to delete this hangout? This action cannot
              be undone.
            </Dialog.Description>

            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-gray-600 rounded text-light hover:bg-gray-800"
                onClick={() => setShowDeleteModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                onClick={handleDelete}
                disabled={isProcessing}
              >
                {isProcessing ? (
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
                    Processing...
                  </>
                ) : (
                  "Delete Hangout"
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Leave Confirmation Modal */}
      <Dialog.Root open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg border border-yellow-500 w-11/12 max-w-md z-50">
            <Dialog.Title className="text-xl font-bold text-yellow-500 mb-4">
              Leave Hangout
            </Dialog.Title>
            <Dialog.Description className="text-light mb-6">
              Are you sure you want to leave this hangout? You can be invited
              again later.
            </Dialog.Description>

            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-gray-600 rounded text-light hover:bg-gray-800"
                onClick={() => setShowLeaveModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 flex items-center"
                onClick={handleLeave}
                disabled={isProcessing}
              >
                {isProcessing ? (
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
                    Processing...
                  </>
                ) : (
                  "Leave Hangout"
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Modal */}
      <HangoutFormModal
        isOpen={showEditModal}
        onClose={handleEditComplete}
        hangoutData={hangout}
      />
    </li>
  );
}

SharedUpcomingHangoutItem.propTypes = {
  hangout: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired,
    extendedProps: PropTypes.shape({
      description: PropTypes.string,
      user: PropTypes.shape({
        fullName: PropTypes.string,
        profilePicture: PropTypes.string,
      }),
      guests: PropTypes.arrayOf(
        PropTypes.shape({
          fullName: PropTypes.string,
        })
      ),
    }),
  }).isRequired,
  onActionComplete: PropTypes.func,
};

export default SharedUpcomingHangoutItem;
