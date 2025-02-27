import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, Checkbox } from "radix-ui";
import {
  getAllCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from "../../../services/friendshipCategoryService";
import {
  addUserToCategory,
  removeUserFromCategory,
} from "../../../services/categoryMemberService";

function MainFriendDetails({ friend }) {
  const [categories, setCategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // New states for additional modals
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");

  // Fetch all categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const allCategories = await getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

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

  // Create new category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await createCategory(newCategoryName);
      setNewCategoryName("");
      setNewCategoryModalOpen(false);
      await fetchCategories(); // Refresh categories
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  // Delete category
  const handleDeleteCategory = async () => {
    try {
      await deleteCategory(categoryToDelete.id);
      setDeleteCategoryModalOpen(false);
      setCategoryToDelete(null);
      await fetchCategories(); // Refresh categories
      setActiveCategories((prev) =>
        prev.filter((cat) => cat.id !== categoryToDelete.id)
      );
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  // Edit category
  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      await updateCategory(categoryToEdit.id, editCategoryName);
      setEditCategoryModalOpen(false);
      setCategoryToEdit(null);
      setEditCategoryName("");
      await fetchCategories(); // Refresh categories

      // Update the name in activeCategories if the category is active
      setActiveCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryToEdit.id
            ? { ...cat, name: editCategoryName }
            : cat
        )
      );
    } catch (error) {
      console.error("Error updating category:", error);
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

      {/* Main Categories Edit Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 border border-primary shadow-lg shadow-primary transform -translate-x-1/2 -translate-y-3/4 bg-dark/90 p-6 rounded-lg w-150">
            <Dialog.Title className="text-2xl font-bold text-primary mb-4 flex items-center">
              Edit Categories
              <FontAwesomeIcon
                icon="fa-solid fa-square-plus"
                className="ms-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity duration-300"
                onClick={() => setNewCategoryModalOpen(true)}
              />
            </Dialog.Title>
            <Dialog.Description className="mb-2">
              Select the categories you'd like to apply to this friend.
            </Dialog.Description>
            <div className="max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center mb-3">
                  <Checkbox.Root
                    className="flex h-5 w-5 items-center justify-center rounded-sm border-sm border-dark bg-light mr-3"
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
                    className="text-light font-bold cursor-pointer"
                  >
                    {category.name}<FontAwesomeIcon
                      icon="fa-solid fa-pen-to-square"
                      className="ms-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity duration-300"
                      onClick={() => {
                        setCategoryToEdit(category);
                        setEditCategoryName(category.name);
                        setEditCategoryModalOpen(true);
                      }}
                    />
                    <FontAwesomeIcon
                      icon="fa-solid fa-trash-can"
                      className="ms-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity duration-300"
                      onClick={() => {
                        setCategoryToDelete(category);
                        setDeleteCategoryModalOpen(true);
                      }}
                    />
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

      {/* New Category Modal */}
      <Dialog.Root
        open={newCategoryModalOpen}
        onOpenChange={setNewCategoryModalOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 border border-primary shadow-lg shadow-primary transform -translate-x-1/2 -translate-y-1/2 bg-dark/90 p-6 rounded-lg w-96">
            <Dialog.Title className="text-xl font-bold text-primary mb-4">
              Create New Category
            </Dialog.Title>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label htmlFor="categoryName" className="block text-light mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-2 rounded bg-light text-dark"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewCategoryModalOpen(false)}
                  className="px-3 py-1 bg-dark text-light border border-light rounded hover:bg-dark/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-primary text-dark rounded hover:bg-primary/80"
                  disabled={!newCategoryName.trim()}
                >
                  Create
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Category Confirmation Modal */}
      <Dialog.Root
        open={deleteCategoryModalOpen}
        onOpenChange={setDeleteCategoryModalOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 border border-primary shadow-lg shadow-primary transform -translate-x-1/2 -translate-y-1/2 bg-dark/90 p-6 rounded-lg w-96">
            <Dialog.Title className="text-xl font-bold text-primary mb-4">
              Confirm Deletion
            </Dialog.Title>
            <p className="text-light mb-6">
              Are you sure you want to delete the category "
              {categoryToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteCategoryModalOpen(false)}
                className="px-3 py-1 bg-dark text-light border border-light rounded hover:bg-dark/80"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Category Modal */}
      <Dialog.Root
        open={editCategoryModalOpen}
        onOpenChange={setEditCategoryModalOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 border border-primary shadow-lg shadow-primary transform -translate-x-1/2 -translate-y-1/2 bg-dark/90 p-6 rounded-lg w-96">
            <Dialog.Title className="text-xl font-bold text-primary mb-4">
              Edit Category
            </Dialog.Title>
            <form onSubmit={handleEditCategory}>
              <div className="mb-4">
                <label
                  htmlFor="editCategoryName"
                  className="block text-light mb-2"
                >
                  Category Name
                </label>
                <input
                  type="text"
                  id="editCategoryName"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full p-2 rounded bg-light text-dark"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCategoryModalOpen(false)}
                  className="px-3 py-1 bg-dark text-light border border-light rounded hover:bg-dark/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-primary text-dark rounded hover:bg-primary/80"
                  disabled={!editCategoryName.trim()}
                >
                  Update
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default MainFriendDetails;
