import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog } from "radix-ui";
import {
  sendTagalongRequest,
  removeTagalong,
} from "../../services/tagalongService";
import { getFriends } from "../../services/friendService";
import TagalongItem from "./TagalongItem";

function TagalongFriends({ user, onUpdate }) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [tagalongToRemove, setTagalongToRemove] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get all tagalong relationships
  const tagalongRelationships = user?.tagalongs || [];

  // Extract the friend from each tagalong relationship
  const tagalongFriends = tagalongRelationships.map((tagalong) => {
    const isSender = tagalong.senderId === user.id;
    const friend = isSender ? tagalong.recipient : tagalong.sender;
    return {
      ...friend,
      tagalongId: tagalong.id, // Store the tagalong ID for removal
      isSender: isSender, // Track relationship direction
    };
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      // Use getFriends instead of getUsersByUsername
      const results = await getFriends(searchQuery);

      // Filter out users who are already tagalongs
      const existingTagalongIds = new Set(
        tagalongRelationships.flatMap((tag) => [tag.senderId, tag.recipientId])
      );

      const filteredResults = results.filter(
        (result) => !existingTagalongIds.has(result.id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching friends:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTagalong = async (friendId) => {
    try {
      await sendTagalongRequest(friendId);
      setSearchModalOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error adding tagalong:", error);
    }
  };

  const handleRemoveTagalong = async () => {
    if (!tagalongToRemove) return;

    try {
      await removeTagalong(tagalongToRemove.tagalongId);
      setConfirmModalOpen(false);
      setTagalongToRemove(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error removing tagalong:", error);
    }
  };

  const handleRemoveInitiation = (friend) => {
    setTagalongToRemove(friend);
    setConfirmModalOpen(true);
  };

  return (
    <div className="bg-dark/10 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-primary text-xl font-bold">Tagalong Friends</h2>
        <button
          onClick={() => setSearchModalOpen(true)}
          className="bg-primary text-dark px-3 py-1 rounded-md flex items-center"
        >
          <FontAwesomeIcon icon="fa-solid fa-plus" className="mr-2" />
          Add
        </button>
      </div>

      {tagalongFriends.length === 0 ? (
        <p className="text-center py-4 text-gray-400">
          You don't have any tagalong friends yet.
        </p>
      ) : (
        <ul className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {tagalongFriends.map((friend) => (
            <TagalongItem
              key={friend.id}
              friend={friend}
              onRemove={handleRemoveInitiation}
            />
          ))}
        </ul>
      )}

      {/* Search Modal - Using Radix Dialog */}
      <Dialog.Root open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md z-50">
            <Dialog.Title className="text-xl font-bold text-primary mb-4">
              Add Tagalong Friend
            </Dialog.Title>

            <div className="flex mb-4">
              <input
                type="text"
                placeholder="Search for friends..."
                className="flex-1 px-3 py-2 rounded-l border border-primary bg-dark text-light"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                className="bg-primary text-dark px-4 py-2 rounded-r"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? "..." : "Search"}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {searchResults.length === 0 ? (
                <p className="text-light text-center py-4">
                  {searchQuery
                    ? "No results found."
                    : "Search for friends to add as tagalongs."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {searchResults.map((result) => (
                    <li
                      key={result.id}
                      className="flex justify-between items-center p-3 bg-dark/50 rounded"
                    >
                      <div className="flex items-center">
                        {result.profilePicture ? (
                          <img
                            src={result.profilePicture}
                            alt={`${result.fullName}`}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon="fa-solid fa-user"
                            className="text-light size-6"
                          />
                        )}
                        <div className="ml-2">
                          <div className="text-light">{result.fullName}</div>
                          <div className="text-xs text-gray-400">
                            {result.userName}
                          </div>
                        </div>
                      </div>
                      <button
                        className="bg-primary text-dark px-3 py-1 rounded"
                        onClick={() => handleAddTagalong(result.id)}
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Dialog.Close className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                Cancel
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Confirm Removal Modal - Using Radix Dialog */}
      <Dialog.Root open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary p-4 rounded-md w-11/12 max-w-sm z-50">
            <Dialog.Title className="text-xl font-bold text-dark mb-3">
              Remove Tagalong Friend
            </Dialog.Title>
            {tagalongToRemove && (
              <p className="text-dark">
                Are you sure you want to remove {tagalongToRemove.fullName} from
                your tagalong friends?
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close className="px-4 py-2 bg-secondary text-light rounded-md hover:opacity-90">
                Cancel
              </Dialog.Close>
              <button
                onClick={handleRemoveTagalong}
                className="px-4 py-2 bg-dark text-white rounded-md hover:opacity-90"
              >
                Remove
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default TagalongFriends;
