import React, { useState } from "react";
import { Dialog } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getFriends } from "../../../services/friendService";
import { addUserToCategory } from "../../../services/categoryMemberService";

function AddFriendToCategoryModal({
  isOpen,
  onClose,
  selectedCategory,
  existingFriends,
  onSuccess,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      // Use a space character if searchQuery is empty
      const queryToUse = searchQuery.trim() === "" ? " " : searchQuery;
      const results = await getFriends(queryToUse);

      // Filter out users who are already in the category
      const existingFriendIds = new Set(
        existingFriends.map((friend) => friend.id)
      );

      const filteredResults = results.filter(
        (result) => !existingFriendIds.has(result.id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching friends:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriendToCategory = async (friendId) => {
    if (!selectedCategory) return;

    try {
      await addUserToCategory(selectedCategory.id, friendId);
      onClose();
      setSearchQuery("");
      setSearchResults([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding friend to category:", error);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed border border-primary shadow-primary shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md z-50">
          <Dialog.Title className="text-xl font-bold text-primary mb-4">
            Add Friend to {selectedCategory?.name}
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
              {isSearching ? (
                <FontAwesomeIcon icon="fa-solid fa-search" beat />
              ) : (
                <FontAwesomeIcon icon="fa-solid fa-search" />
              )}
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-light text-center py-4">
                Search for friends to add to this category.
              </p>
            ) : (
              <ul className="space-y-2">
                {searchResults.map((result) => (
                  <li
                    key={result.id}
                    className="flex justify-between items-center p-3 hover:bg-light/10 rounded"
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
                      className="bg-primary text-dark px-3 py-1 rounded hover:bg-primary/90"
                      onClick={() => handleAddFriendToCategory(result.id)}
                    >
                      <FontAwesomeIcon icon="fa-solid fa-plus" />
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
  );
}

export default AddFriendToCategoryModal;
