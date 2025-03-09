import React, { useState, useEffect } from "react";
import { Dialog } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createHangoutRequest } from "../../services/hangoutService";
import { getFriends } from "../../services/friendService";
import { getHiveWindows } from "../../services/windowServices";

export default function HangoutRequestModal({ isOpen, onClose, windowInfo }) {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isHangoutOpen, setIsHangoutOpen] = useState(false); // This is correct - fixed naming
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Recipients state - now storing full recipient objects, not just IDs
  const [hangoutRequestRecipients, setHangoutRequestRecipients] = useState([]);
  const [originalParticipantIds, setOriginalParticipantIds] = useState([]);

  // Friend search state
  const [availableFriends, setAvailableFriends] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [showAvailableFriendsPanel, setShowAvailableFriendsPanel] =
    useState(false);

  // Reset form and initialize with window data
  useEffect(() => {
    if (isOpen && windowInfo) {
      // Reset form
      setTitle(""); // Changed to always start with empty title
      setDescription("");

      // Initialize dates and times from the window
      const start = new Date(windowInfo.start || windowInfo.startStr);
      const end = new Date(windowInfo.end || windowInfo.endStr);

      // Format dates for date inputs (YYYY-MM-DD)
      const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      // Format times for time inputs (HH:MM)
      const formatLocalTime = (date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      setStartDate(formatLocalDate(start));
      setEndDate(formatLocalDate(end));
      setStartTime(formatLocalTime(start));
      setEndTime(formatLocalTime(end));

      // Get participants from the window and set them as initial recipients
      let participants = [];
      if (windowInfo.extendedProps?.participants) {
        // Extract participants with full details

        participants = windowInfo.extendedProps.participants.map((p) => {
          const userId = p.userId;

          // Better name extraction - prioritize fullName, then firstName + lastName
          let fullName = "Unknown";

          if (p.user) {
            if (p.user.fullName) {
              fullName = p.user.fullName;
            } else if (p.user.firstName || p.user.lastName) {
              fullName = `${p.user.firstName || ""} ${
                p.user.lastName || ""
              }`.trim();
            } else if (p.user.userName) {
              fullName = p.user.userName;
            }
          } else if (p.name) {
            fullName = p.name;
          }

          // Create recipient object with id and name
          return {
            id: userId,
            fullName: fullName || userId, // Fallback to ID if no name found
          };
        });

        console.log("Extracted participants:", participants);

        setOriginalParticipantIds(participants.map((p) => p.id));
        setHangoutRequestRecipients(participants);
      }

      // Reset other states
      setIsHangoutOpen(false);
      setError(null);
    }
  }, [isOpen, windowInfo]);

  // Add effect to update available friends when dates/times change
  useEffect(() => {
    fetchAvailableFriends();
  }, [startDate, startTime, endDate, endTime]);

  // Handle search for friends
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const results = await getFriends(searchQuery);

      // Filter out users who are already recipients
      const filteredResults = results.filter(
        (result) =>
          !hangoutRequestRecipients.some(
            (recipient) => recipient.id === result.id
          )
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching friends:", error);
      setError("Failed to search for friends");
    } finally {
      setIsSearching(false);
    }
  };

  // Toggle friend selection in the modal
  const toggleFriendSelection = (friend) => {
    if (selectedFriends.some((f) => f.id === friend.id)) {
      setSelectedFriends(selectedFriends.filter((f) => f.id !== friend.id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  // Add selected friends to recipients
  const addSelectedFriends = () => {
    // Add all selected friends to recipients
    const newRecipients = [...hangoutRequestRecipients];

    selectedFriends.forEach((friend) => {
      if (!newRecipients.some((r) => r.id === friend.id)) {
        newRecipients.push({
          id: friend.id,
          fullName:
            friend.fullName ||
            `${friend.firstName || ""} ${friend.lastName || ""}`.trim() ||
            friend.userName ||
            friend.id,
        });
      }
    });

    setHangoutRequestRecipients(newRecipients);

    // Close modal and reset selection
    setShowFriendSearchModal(false);
    setSelectedFriends([]);
    setSearchResults([]);
    setSearchQuery("");
  };

  // Handle modal cancel/close
  const handleFriendModalClose = () => {
    setShowFriendSearchModal(false);
    setSelectedFriends([]);
    setSearchResults([]);
    setSearchQuery("");
  };

  // Add a friend to recipients
  const handleAddRecipient = (user) => {
    if (
      !hangoutRequestRecipients.some((recipient) => recipient.id === user.id)
    ) {
      // Make sure we're capturing the full name
      const newRecipient = {
        id: user.id,
        fullName:
          user.fullName ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.userName ||
          user.id,
      };

      console.log("Adding recipient:", newRecipient);

      setHangoutRequestRecipients([...hangoutRequestRecipients, newRecipient]);

      // Clear search results after adding
      setSearchResults(searchResults.filter((result) => result.id !== user.id));
    }
  };

  // Remove a friend from recipients (only if they weren't original participants)
  const handleRemoveRecipient = (userId) => {
    if (!originalParticipantIds.includes(userId)) {
      setHangoutRequestRecipients(
        hangoutRequestRecipients.filter((recipient) => recipient.id !== userId)
      );
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create local Date objects from the form inputs
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      const hangoutRequestData = {
        title,
        description,
        proposedStart: startDateTime.toISOString(),
        proposedEnd: endDateTime.toISOString(),
        isOpen: isHangoutOpen,
        // Extract just the IDs for the API call
        recipientUserIds: hangoutRequestRecipients.map(
          (recipient) => recipient.id
        ),
      };

      await createHangoutRequest(hangoutRequestData);
      onClose(true); // Close modal and indicate success
    } catch (err) {
      console.error("Error creating hangout request:", err);
      setError("Failed to create hangout request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this function to fetch available friends
  const fetchAvailableFriends = async () => {
    // Skip if we don't have valid date/time values
    if (!startDate || !startTime || !endDate || !endTime) return;

    setIsLoadingFriends(true);
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      // Use existing getHiveWindows function to get friends with open windows
      const windows = await getHiveWindows(
        startDateTime.toISOString(),
        endDateTime.toISOString()
      );

      // Extract unique friend data from windows
      const friendsMap = new Map();
      windows.forEach((window) => {
        window.extendedProps.participants?.forEach((participant) => {
          // Skip if it's already in our original participants list
          if (
            participant.userId &&
            !friendsMap.has(participant.userId) &&
            !originalParticipantIds.includes(participant.userId)
          ) {
            friendsMap.set(participant.userId, {
              id: participant.userId,
              fullName: participant.user?.fullName || "Unknown User",
              isAdded: hangoutRequestRecipients.some(
                (r) => r.id === participant.userId
              ),
            });
          }
        });
      });

      setAvailableFriends(Array.from(friendsMap.values()));
    } catch (error) {
      console.error("Error fetching available friends:", error);
      setError("Failed to load available friends");
    } finally {
      setIsLoadingFriends(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={() => onClose(false)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed border border-primary shadow-primary shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="text-xl font-bold text-primary mb-4">
            Send Hangout Request
          </Dialog.Title>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-light mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded border border-primary bg-dark text-light"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Hangout Title"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-light mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 rounded border border-primary bg-dark text-light"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's the plan?"
                rows="3"
                required
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

            {/* Open to Others Toggle */}
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="isHangoutOpen"
                className="mr-2"
                checked={isHangoutOpen}
                onChange={(e) => setIsHangoutOpen(e.target.checked)}
              />
              <label htmlFor="isHangoutOpen" className="text-light">
                Open to other participants
              </label>
            </div>

            {/* Recipients Section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-light">
                  Recipients
                </label>
                <button
                  type="button"
                  className="text-primary hover:text-primary/80"
                  onClick={() => {
                    fetchAvailableFriends(); // Refresh the list right before opening
                    setShowAvailableFriendsPanel(true);
                  }}
                >
                  <FontAwesomeIcon icon="plus" className="mr-1" />
                  Add Available Friends
                </button>
              </div>

              {/* Recipient List */}
              <div className="border border-primary rounded p-2 max-h-40 overflow-y-auto">
                {hangoutRequestRecipients.length === 0 ? (
                  <p className="text-gray-400 text-center text-sm py-2">
                    No recipients selected
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-700">
                    {hangoutRequestRecipients.map((recipient) => {
                      // Determine if this recipient is an original participant
                      const isOriginalParticipant =
                        originalParticipantIds.includes(recipient.id);

                      // Make sure we display the full name - with debug logging
                      const displayName = recipient.fullName || recipient.id;

                      return (
                        <li
                          key={recipient.id}
                          className="py-2 flex justify-between items-center"
                        >
                          <span className="text-light text-sm">
                            {displayName}
                          </span>
                          {!isOriginalParticipant && (
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-400"
                              onClick={() =>
                                handleRemoveRecipient(recipient.id)
                              }
                            >
                              <FontAwesomeIcon icon="times" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
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
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-dark"
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
                    Sending...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-primary"
              aria-label="Close"
            >
              <FontAwesomeIcon icon="times" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Friend Selection Modal */}
      <Dialog.Root
        open={showAvailableFriendsPanel}
        onOpenChange={() => setShowAvailableFriendsPanel(false)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />
          <Dialog.Content className="fixed border border-primary shadow-primary shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto z-[60]">
            <Dialog.Title className="text-xl font-bold text-primary mb-4">
              Available Friends
            </Dialog.Title>

            <div className="mb-4 text-sm text-light">
              These friends have open windows during your proposed hangout time:
            </div>

            {/* Available Friends List */}
            <div className="border border-primary rounded p-2 max-h-60 overflow-y-auto mb-4">
              {isLoadingFriends ? (
                <div className="flex justify-center items-center py-6">
                  <FontAwesomeIcon
                    icon="spinner"
                    spin
                    className="text-primary text-xl"
                  />
                </div>
              ) : availableFriends.length === 0 ? (
                <p className="text-gray-400 text-center text-sm py-2">
                  No friends available during this time
                </p>
              ) : (
                <ul className="divide-y divide-gray-700">
                  {availableFriends.map((friend) => {
                    const isAdded = hangoutRequestRecipients.some(
                      (recipient) => recipient.id === friend.id
                    );

                    return (
                      <li
                        key={friend.id}
                        className="py-2 px-2 flex justify-between items-center"
                      >
                        <span className="text-light">{friend.fullName}</span>
                        <button
                          type="button"
                          onClick={() =>
                            isAdded
                              ? handleRemoveRecipient(friend.id)
                              : handleAddRecipient(friend)
                          }
                          className={`px-2 py-1 rounded ${
                            isAdded
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={isAdded ? "times" : "plus"}
                            className="text-light"
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 border border-gray-600 rounded text-light hover:bg-gray-800"
                onClick={() => setShowAvailableFriendsPanel(false)}
              >
                Done
              </button>
            </div>

            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-primary"
                aria-label="Close"
              >
                <FontAwesomeIcon icon="times" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Dialog.Root>
  );
}
