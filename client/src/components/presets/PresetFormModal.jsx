import React, { useState, useEffect } from "react";
import { Dialog, Checkbox, Select } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createPreset, updatePreset } from "../../services/presetService";
import { getAcceptedTagalongs } from "../../services/tagalongService";
import { getAllCategories } from "../../services/friendshipCategoryService";

export default function PresetFormModal({ isOpen, onClose, editingPreset }) {
  // Form state
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("15:00");
  const [daysOfNotice, setDaysOfNotice] = useState(1);
  const [activityType, setActivityType] = useState("open");
  const [activityDescription, setActivityDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Participant selection
  const [tagalongFriends, setTagalongFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Visibility settings
  const [limitVisibility, setLimitVisibility] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Reset form fields
  const resetForm = () => {
    setTitle("");
    setStartTime("14:00");
    setEndTime("15:00");
    setDaysOfNotice(0);
    setActivityType("open");
    setActivityDescription("");
    setSelectedFriends([]);
    setLimitVisibility(false);
    setSelectedCategories([]);
    setError(null);
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Fetch tagalong friends and categories when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      try {
        const [friends, userCategories] = await Promise.all([
          getAcceptedTagalongs(),
          getAllCategories(),
        ]);
        setTagalongFriends(
          friends.map((friend) => ({
            id: friend.userId,
            name: `${friend.firstName} ${friend.lastName}`,
            tagalongId: friend.tagalongId,
          }))
        );
        setCategories(userCategories);
      } catch (err) {
        console.error("Error fetching form data:", err);
        setError("Failed to load required data. Please try again.");
      }
    };
    fetchData();
  }, [isOpen]);

  // Populate form fields when editing an existing preset
  useEffect(() => {
    if (isOpen && editingPreset) {
      setTitle(editingPreset.title || "");
      if (editingPreset.start) {
        const startDate = new Date(editingPreset.start);
        setStartTime(
          startDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        );
      }
      if (editingPreset.end) {
        const endDate = new Date(editingPreset.end);
        setEndTime(
          endDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        );
      }
      // Determine activity type and description
      const preferredActivity =
        editingPreset.extendedProps?.preferredActivity || "";
      let actType = "open";
      let actDesc = "";
      if (preferredActivity.startsWith("I'd like to be ")) {
        actType = "like";
        actDesc = preferredActivity.replace("I'd like to be ", "");
      } else if (preferredActivity.startsWith("I will be ")) {
        actType = "will";
        actDesc = preferredActivity.replace("I will be ", "");
      }
      setActivityType(actType);
      setActivityDescription(actDesc);
      setDaysOfNotice(editingPreset.extendedProps?.daysOfNoticeNeeded || 0);
      // Set participants (exclude owner)
      if (editingPreset.extendedProps?.participants) {
        setSelectedFriends(
          editingPreset.extendedProps.participants
            .filter((p) => p.userId)
            .map((p) => p.userId)
        );
      }
      // Set visibility settings
      const hasVisibilities =
        editingPreset.extendedProps?.visibilities &&
        editingPreset.extendedProps.visibilities.length > 0;
      setLimitVisibility(hasVisibilities);
      if (hasVisibilities) {
        setSelectedCategories(
          editingPreset.extendedProps.visibilities.map((v) => v.categoryId)
        );
      }
    }
  }, [isOpen, editingPreset]);

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

  // Format preferred activity string
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Use today's date as a placeholder for the preset's date portion
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();

      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const startDateTime = new Date(year, month, day, startHour, startMinute);
      const endDateTime = new Date(year, month, day, endHour, endMinute);

      // If end time is before or equal to start time, assume it's for the next day
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      // Build preset data to send to the backend
      const presetData = {
        title,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        extendedProps: {
          preferredActivity: getPreferredActivity(),
          daysOfNoticeNeeded: parseInt(daysOfNotice),
          participants: selectedFriends.map((friendId) => ({
            userId: friendId,
          })),
          visibilities: limitVisibility
            ? selectedCategories.map((categoryId) => ({ categoryId }))
            : [],
        },
      };

      if (editingPreset) {
        await updatePreset(editingPreset.id, presetData);
      } else {
        await createPreset(presetData);
      }
      onClose(true); // Close modal and signal a refresh
    } catch (err) {
      console.error("Error submitting preset:", err);
      setError(
        `Failed to ${
          editingPreset ? "update" : "create"
        } preset. Please try again.`
      );
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
            {editingPreset ? "Edit Preset" : "Create New Preset"}
          </Dialog.Title>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Preset Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-light mb-1">
                Preset Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded border border-primary bg-dark text-light"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this preset"
                required
              />
            </div>

            {/* Time Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-light mb-1">
                Time Range
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="time"
                  className="flex-1 px-3 py-2 rounded border border-primary bg-dark text-light"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
                <span className="text-light">to</span>
                <input
                  type="time"
                  className="flex-1 px-3 py-2 rounded border border-primary bg-dark text-light"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Set the time range for your preset. When applied, the preset
                will use the date you drop it on.
              </p>
            </div>

            {/* Days of Notice */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-light mb-1">
                Days of Notice Needed
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
              <p className="text-xs text-gray-400 mt-1">
                Window will be hidden this many days before the event.
              </p>
            </div>

            {/* Preferred Activity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-light mb-1">
                Preferred Activity
              </label>
              <Select.Root value={activityType} onValueChange={setActivityType}>
                <Select.Trigger
                  className="w-full px-3 py-2 rounded border border-primary bg-dark text-light flex justify-between items-center"
                  aria-label="Preferred Activity"
                >
                  <Select.Value placeholder="Select activity type" />
                  <Select.Icon>
                    <FontAwesomeIcon icon="chevron-down" />
                  </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                  <Select.Content
                    position="popper"
                    sideOffset={5}
                    side="bottom"
                    align="end"
                    className="bg-dark border border-primary rounded shadow-lg z-50"
                  >
                    <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-dark text-light cursor-default">
                      <FontAwesomeIcon icon="chevron-up" />
                    </Select.ScrollUpButton>
                    <Select.Viewport className="p-1">
                      <Select.Item
                        value="open"
                        className="px-3 py-2 hover:bg-primary hover:text-dark cursor-pointer rounded flex items-center h-8"
                      >
                        <Select.ItemText>I'm open!</Select.ItemText>
                        <Select.ItemIndicator className="ml-auto">
                          <FontAwesomeIcon icon="check" className="text-xs" />
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item
                        value="like"
                        className="px-3 py-2 hover:bg-primary hover:text-dark cursor-pointer rounded flex items-center h-8"
                      >
                        <Select.ItemText>I'd like to be...</Select.ItemText>
                        <Select.ItemIndicator className="ml-auto">
                          <FontAwesomeIcon icon="check" className="text-xs" />
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item
                        value="will"
                        className="px-3 py-2 hover:bg-primary hover:text-dark cursor-pointer rounded flex items-center h-8"
                      >
                        <Select.ItemText>I will be...</Select.ItemText>
                        <Select.ItemIndicator className="ml-auto">
                          <FontAwesomeIcon icon="check" className="text-xs" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    </Select.Viewport>
                    <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-dark text-light cursor-default">
                      <FontAwesomeIcon icon="chevron-down" />
                    </Select.ScrollDownButton>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
              {(activityType === "like" || activityType === "will") && (
                <input
                  type="text"
                  className="mt-2 w-full px-3 py-2 rounded border border-primary bg-dark text-light"
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
              {limitVisibility ? (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-2">
                    Select which friend categories can see windows created from
                    this preset:
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
              ) : (
                <div className="text-xs text-gray-400">
                  By default, all tagalong friends can see your windows. Enable
                  this option to limit visibility.
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
                    {editingPreset ? "Updating..." : "Creating..."}
                  </>
                ) : editingPreset ? (
                  "Update Preset"
                ) : (
                  "Create Preset"
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
