import React, { useState, useEffect } from "react";
import { Dialog, Checkbox } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createWindow } from "../../services/windowServices";
import { getAcceptedTagalongs } from "../../services/tagalongService";
import { getAllCategories } from "../../services/friendshipCategoryService";

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

  // New state variables for visibility settings
  const [limitVisibility, setLimitVisibility] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Fetch tagalong friends
  useEffect(() => {
    const fetchTagalongs = async () => {
      try {
        // Get all accepted tagalong friends (this now returns the friend information directly)
        const friends = await getAcceptedTagalongs();
        setTagalongFriends(
          friends.map((friend) => ({
            id: friend.userId,
            name: `${friend.firstName} ${friend.lastName}`,
            tagalongId: friend.tagalongId,
          }))
        );
      } catch (err) {
        console.error("Error fetching tagalong friends:", err);
        setTagalongFriends([]);
      }
    };

    // Fetch user's friendship categories
    const fetchCategories = async () => {
      try {
        const userCategories = await getAllCategories();
        setCategories(userCategories);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };

    if (isOpen) {
      fetchTagalongs();
      fetchCategories();
    }
  }, [isOpen]);

  // Set initial values when the modal opens - Fix timezone handling
  useEffect(() => {
    if (selectInfo && isOpen) {
      const start = new Date(selectInfo.startStr);
      const end = new Date(selectInfo.endStr);

      // Format dates for date inputs (YYYY-MM-DD) using local date components
      // to avoid timezone shifts
      const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      // Format times for time inputs (HH:MM) using local time components
      const formatLocalTime = (date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      // Set form values using local date/time
      setStartDate(formatLocalDate(start));
      setEndDate(formatLocalDate(end));
      setStartTime(formatLocalTime(start));
      setEndTime(formatLocalTime(end));
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

  // Handle category selection
  const handleCategorySelection = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(
        selectedCategories.filter((id) => id !== categoryId)
      );
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
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
      // Create local Date objects from the form inputs
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      // Convert to ISO strings for the backend (UTC)
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
          visibilities: limitVisibility
            ? selectedCategories.map((categoryId) => ({
                categoryId: categoryId,
              }))
            : [],
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
    <Dialog.Root open={isOpen} onOpenChange={() => onClose(false)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed border border-primary shadow-primary shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto z-50">
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-light mb-1">
                Window Title (optional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded border border-primary bg-dark text-light"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Window"
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
                      className="flex items-center py-2 border-b border-gray-700 last:border-b-0"
                    >
                      <Checkbox.Root
                        className="flex h-5 w-5 items-center justify-center rounded border border-primary bg-dark data-[state=checked]:bg-primary"
                        checked={selectedFriends.includes(friend.id)}
                        onCheckedChange={() => handleFriendSelection(friend.id)}
                        id={`friend-${friend.id}`}
                      >
                        <Checkbox.Indicator>
                          <FontAwesomeIcon
                            icon="check"
                            className="text-xs text-dark"
                          />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <label
                        className="text-light ml-2 text-sm cursor-pointer"
                        htmlFor={`friend-${friend.id}`}
                      >
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

            {/* Visibility Settings */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Checkbox.Root
                  className="flex h-5 w-5 items-center justify-center rounded border border-primary bg-dark data-[state=checked]:bg-primary"
                  checked={limitVisibility}
                  onCheckedChange={() => setLimitVisibility(!limitVisibility)}
                  id="limit-visibility"
                >
                  <Checkbox.Indicator>
                    <FontAwesomeIcon
                      icon="check"
                      className="text-xs text-dark"
                    />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <label
                  className="text-light ml-2 text-sm font-medium cursor-pointer"
                  htmlFor="limit-visibility"
                >
                  Limit Visibility
                </label>
              </div>

              {limitVisibility && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-2">
                    Select which friend categories can see this window:
                  </div>

                  {categories.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto border border-primary rounded p-2">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center py-2 border-b border-gray-700 last:border-b-0"
                        >
                          <Checkbox.Root
                            className="flex h-5 w-5 items-center justify-center rounded border border-primary bg-dark data-[state=checked]:bg-primary"
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={() =>
                              handleCategorySelection(category.id)
                            }
                            id={`category-${category.id}`}
                          >
                            <Checkbox.Indicator>
                              <FontAwesomeIcon
                                icon="check"
                                className="text-xs text-dark"
                              />
                            </Checkbox.Indicator>
                          </Checkbox.Root>
                          <label
                            className="text-light ml-2 text-sm cursor-pointer"
                            htmlFor={`category-${category.id}`}
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 border border-primary rounded p-3">
                      No categories available. Create categories in Friends
                      settings.
                    </div>
                  )}
                </div>
              )}

              {!limitVisibility && (
                <div className="text-xs text-gray-400">
                  By default, all tagalong friends can see your windows. Enable
                  this option to limit visibility to specific friend categories.
                </div>
              )}
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
            >
              <FontAwesomeIcon icon="times" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
