import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, Checkbox } from "radix-ui";
import { getAllCategories } from "../../../services/friendshipCategoryService";
import {
  addUserToCategory,
  removeUserFromCategory,
} from "../../../services/categoryMemberService";

function MainFriendDetails({ friend }) {
  const [categories, setCategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch all categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const allCategories = await getAllCategories();
        setCategories(allCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Initialize activeCategories with friend's categories
  useEffect(() => {
    if (friend && friend.friendshipCategories) {
      setActiveCategories(friend.friendshipCategories);
    }
  }, [friend]);

  // Check if a category is active
  const isCategoryActive = (categoryId) => {
    return activeCategories.some((cat) => cat.id === categoryId);
  };

  // Handle checkbox change
  const handleCategoryToggle = async (categoryId, isChecked) => {
    try {
      if (isChecked) {
        // Add user to category
        await addUserToCategory(categoryId, friend.id);

        // Find the category in all categories and add it to activeCategories
        const categoryToAdd = categories.find((cat) => cat.id === categoryId);
        if (categoryToAdd) {
          setActiveCategories((prev) => [...prev, categoryToAdd]);
        }
      } else {
        // Remove user from category
        await removeUserFromCategory(categoryId, friend.id);

        // Remove category from activeCategories
        setActiveCategories((prev) =>
          prev.filter((cat) => cat.id !== categoryId)
        );
      }
    } catch (error) {
      console.error("Error updating category membership:", error);
    }
  };

  return (
    <div className="w-1/3 h-screen bg-primary">
      <div className="w-full flex flex-col">
        {friend.profilePicture ? (
          <img
            src={friend.profilePicture}
            alt={`${friend.fullName}'s profile`}
            className="w-1/3 rounded-full mx-auto mt-8"
          />
        ) : (
          <FontAwesomeIcon
            className="mx-auto text-dark mt-8 size-56"
            icon="fa-solid fa-user"
          />
        )}
      </div>
      <div className="text-start text-dark font-bold text-5xl mt-4 ms-5">
        {friend.fullName}
      </div>
      <div className="text-start text-secondary text-3xl ms-5">
        {friend.userName}
      </div>
      <div className="mt-8 text-dark text-xl font-bold ms-5">
        Categories
        <FontAwesomeIcon
          className="ms-2 cursor-pointer"
          icon="fa-solid fa-pen-to-square"
          onClick={() => setModalOpen(true)}
        />
      </div>
      <div className="ms-5 mt-2">
        {activeCategories.map((cat) => (
          <span
            key={cat.id}
            className="px-2 py-1 mx-2 bg-dark rounded-lg text-light"
          >
            {cat.name}
          </span>
        ))}
      </div>

      {/* Categories Edit Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 border border-primary shadow-md shadow-primary transform -translate-x-1/2 -translate-y-1/2 bg-dark/80 p-6 rounded-lg shadow-lg w-96">
            <Dialog.Title className="text-2xl font-bold text-primary mb-4">
              Edit Categories
            </Dialog.Title>
            <div className="max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center mb-3">
                  <Checkbox.Root
                    className="flex h-5 w-5 items-center justify-center rounded bg-primary mr-3"
                    checked={isCategoryActive(category.id)}
                    onCheckedChange={(checked) =>
                      handleCategoryToggle(category.id, checked)
                    }
                    id={`category-${category.id}`}
                  >
                    <Checkbox.Indicator>
                      <FontAwesomeIcon
                        icon="fa-solid fa-check"
                        className="text-dark drop-shadow"
                      />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-light cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-primary text-dark rounded hover:bg-primary/80"
              >
                Close
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default MainFriendDetails;
