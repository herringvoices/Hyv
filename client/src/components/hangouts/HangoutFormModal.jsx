import React, { useState, useEffect } from "react";
import { Dialog } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { updateHangout, leaveHangout } from "../../services/hangoutService";

export default function HangoutFormModal({ isOpen, onClose, hangoutData }) {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [guests, setGuests] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Set initial values when the modal opens
  useEffect(() => {
    if (hangoutData && isOpen) {
      const start = new Date(hangoutData.start);
      const end = new Date(hangoutData.end);

      // Format dates and times for inputs
      const formatLocalDate = (date) => {
        return date.toISOString().split('T')[0];
      };

      const formatLocalTime = (date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      setTitle(hangoutData.title || "");
      setStartDate(formatLocalDate(start));
      setEndDate(formatLocalDate(end));
      setStartTime(formatLocalTime(start));
      setEndTime(formatLocalTime(end));
      
      // Set additional fields from hangout data
      if (hangoutData.extendedProps) {
        setDescription(hangoutData.extendedProps.description || "");
        setGuests(hangoutData.extendedProps.guests || []);
      }
    }
  }, [hangoutData, isOpen]);

  // Function to reset form fields
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setGuests([]);
    setError(null);
    setShowLeaveConfirm(false);
    setIsLeaving(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create local Date objects from the form inputs
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      const hangoutUpdateData = {
        id: parseInt(hangoutData.id),
        title: title,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        extendedProps: {
          description: description,
          active: true,
          guests: guests,
        },
      };

      // Update the hangout
      await updateHangout(parseInt(hangoutData.id), hangoutUpdateData);
      onClose(true); // Close modal and indicate success (to refresh calendar)
    } catch (err) {
      console.error("Error updating hangout:", err);
      setError("Failed to update hangout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle leave hangout click
  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
  };

  // Handle confirming leave hangout
  const handleLeaveConfirm = async () => {
    try {
      setIsLeaving(true);
      await leaveHangout(parseInt(hangoutData.id));
      setShowLeaveConfirm(false);
      onClose(true); // Close modal and refresh calendar
    } catch (err) {
      console.error("Error leaving hangout:", err);
      setError(`Failed to leave hangout: ${err.message}`);
    } finally {
      setIsLeaving(false);
    }
  };

  // Handle canceling leave hangout
  const handleLeaveCancel = () => {
    setShowLeaveConfirm(false);
  };

  // Handle closing the modal manually
  const handleClose = () => {
    onClose(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed border border-yellow-700 shadow-yellow-700 shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="text-xl font-bold text-yellow-500 mb-4">
            <span>Hangout Details</span>
          </Dialog.Title>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {showLeaveConfirm ? (
            <div className="p-4 border border-red-500 rounded mb-4 bg-red-900/20">
              <h3 className="text-lg font-semibold text-light mb-2">
                Leave this hangout?
              </h3>
              <p className="text-gray-300 mb-4">
                You won't be part of this hangout anymore.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-600 rounded text-light hover:bg-gray-800"
                  onClick={handleLeaveCancel}
                  disabled={isLeaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                  onClick={handleLeaveConfirm}
                  disabled={isLeaving}
                >
                  {isLeaving ? (
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
                      Leaving...
                    </>
                  ) : (
                    "Leave Hangout"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-light mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded border border-yellow-700 bg-dark text-light"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-light mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded border border-yellow-700 bg-dark text-light"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Start Date & Time */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-light mb-1">
                  Start
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded border border-yellow-700 bg-dark text-light"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded border border-yellow-700 bg-dark text-light"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-light mb-1">
                  End
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded border border-yellow-700 bg-dark text-light"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded border border-yellow-700 bg-dark text-light"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Guests List */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-light mb-2">
                  Guests
                </label>
                <div className="max-h-32 overflow-y-auto border border-yellow-700 rounded p-2">
                  {guests && guests.length > 0 ? (
                    guests.map((guest, index) => (
                      <div
                        key={index}
                        className="flex items-center py-2 border-b border-gray-700 last:border-b-0"
                      >
                        <span className="text-light text-sm">
                          {guest.firstName} {guest.lastName}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 p-2">No guests</div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-600 rounded text-light hover:bg-gray-800"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                {/* Leave Button */}
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={handleLeaveClick}
                  disabled={isSubmitting}
                >
                  Leave Hangout
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-700 text-yellow-50 rounded hover:bg-yellow-600 flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-50"
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
                      Updating...
                    </>
                  ) : (
                    "Update Hangout"
                  )}
                </button>
              </div>
            </form>
          )}

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-yellow-500"
              aria-label="Close"
            >
              <FontAwesomeIcon icon="times" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}