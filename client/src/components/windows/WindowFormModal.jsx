import React, { useState, useEffect } from "react";
import { Dialog } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createWindow } from "../../services/windowServices";
import { getPendingTagalongs } from "../../services/tagalongService";

export default function WindowFormModal({ isOpen, onClose, selectInfo }) {
  // Form state
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [daysOfNotice, setDaysOfNotice] = useState(1);
  const [activityType, setActivityType] = useState("open");
  const [activityDescription, setActivityDescription] = useState("");
  const [tagalongFriends, setTagalongFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tagalong friends
  useEffect(() => {
    const fetchTagalongs = async () => {
      try {
        // Only fetch tagalong friends where the user is the recipient (true = sender)
        const tagalongs = await getPendingTagalongs(false);
        setTagalongFriends(
          tagalongs.map((t) => ({
            id: t.sender.id,
            name: `${t.sender.firstName} ${t.sender.lastName}`,
          }))
        );
      } catch (err) {
        console.error("Error fetching tagalong friends:", err);
      }
    };

    if (isOpen) {
      fetchTagalongs();
    }
  }, [isOpen]);

  // Set initial values when the modal opens
  useEffect(() => {
    if (selectInfo && isOpen) {
      const start = new Date(selectInfo.startStr);
      const end = new Date(selectInfo.endStr);

      // Format dates for date inputs (YYYY-MM-DD)
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);

      // Format times for time inputs (HH:MM)
      const startTimeStr = start.toTimeString().substring(0, 5);
      const endTimeStr = end.toTimeString().substring(0, 5);
      setStartTime(startTimeStr);
      setEndTime(endTimeStr);
    }
  }, [selectInfo, isOpen]);

  // Handle friend selection
  const handleFriendSelection = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const getPreferredActivity = () => {
    switch (activityType) {
      case "like":
        return `I'd like to be ${activityDescription}`;
      case "will":
        return `I will be ${activityDescription}`;
      default:
        return "I'm open!";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      // Create window data object with FullCalendar-compatible format
      const windowData = {
        title: title || "Window",
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        extendedProps: {
          preferredActivity: getPreferredActivity(),
          daysOfNoticeNeeded: parseInt(daysOfNotice),
          active: true,
          participants: selectedFriends.map((friendId) => ({
            userId: friendId,
          })),
          visibilities: [], // Will be implemented later
        },
      };

      const createdWindow = await createWindow(windowData);
      console.log("Window created:", createdWindow);
      onClose(true); // Close modal and indicate success
    } catch (err) {
      console.error("Error creating window:", err);
      setError("Failed to create window. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed border border-primary  shadow-primary shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="text-xl font-bold text-primary mb-4">
            Create New Window
          </Dialog.Title>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Window Title */}

            {/* Start Date & Time */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-light mb-1">
                Start
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded border border-primary bg-dark text-light"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <input
                  type="time"
                  className="w-full px-3 py-2 rounded border border-primary bg-dark text-light"
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
                  className="w-full px-3 py-2 rounded border border-primary bg-dark text-light"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
                <input
                  type="time"
                  className="w-full px-3 py-2 rounded border border-primary bg-dark text-light"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Days of Notice */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-light mb-1">
                Days of Notice Needed
                <span className="text-xs text-gray-400 ml-1">
                  (Window will be hidden this many days before the event)
                </span>
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded border border-primary bg-dark text-light"
                value={daysOfNotice}
                onChange={(e) => setDaysOfNotice(e.target.value)}
                min="0"
                max="30"
                required
              />
            </div>

            {/* Preferred Activity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-light mb-1">
                Preferred Activity
              </label>
              <select
                className="w-full px-3 py-2 rounded border border-primary bg-dark text-light mb-2"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              >
                <option value="open">I'm open!</option>
                <option value="like">I'd like to be...</option>
                <option value="will">I will be...</option>
              </select>

              {(activityType === "like" || activityType === "will") && (
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded border border-primary bg-dark text-light"
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder={
                    activityType === "like"
                      ? "What would you like to be doing?"
                      : "What will you be doing?"
                  }
                  required
                />
              )}
            </div>

            {/* Tagalong Friends */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-light mb-2">
                Include Friends (Tagalongs)
              </label>
              {tagalongFriends.length > 0 ? (
                <div className="max-h-40 overflow-y-auto border border-primary rounded p-2">
                  {tagalongFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center mb-2 text-light"
                    >
                      <input
                        type="checkbox"
                        id={`friend-${friend.id}`}
                        checked={selectedFriends.includes(friend.id)}
                        onChange={() => handleFriendSelection(friend.id)}
                        className="mr-2 accent-primary"
                      />
                      <label htmlFor={`friend-${friend.id}`}>
                        {friend.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 border border-primary rounded p-3">
                  No tagalong friends available
                </div>
              )}
            </div>

            {/* Visibility will be implemented later */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-400">
                Visibility Settings (Coming Soon)
              </label>
              <div className="text-xs text-gray-400">
                This feature will allow you to limit who can see this window.
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 border border-gray-600 rounded text-light hover:bg-gray-800"
                onClick={() => onClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-dark rounded hover:bg-primary/90 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon="spinner" spin className="mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Window"
                )}
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-primary"
              aria-label="Close"
              onClick={() => onClose(false)}
            >
              <FontAwesomeIcon icon="times" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
