import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog } from "radix-ui";
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
import { sendTagalongRequest } from "../../../services/tagalongService";
import CategoryManagementModal from "./FriendDetailsModals/CategoryManagementModal";
import NewCategoryModal from "./FriendDetailsModals/NewCategoryModal";
import DeleteCategoryModal from "./FriendDetailsModals/DeleteCategoryModal";
import EditCategoryModal from "./FriendDetailsModals/EditCategoryModal";
import TagalongRequestModal from "./FriendDetailsModals/TagalongRequestModal";

function MainFriendDetails({ friend }) {
  const [categories, setCategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Modal states
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [tagalongModalOpen, setTagalongModalOpen] = useState(false);

  // Modal data
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

  // Handle tagalong request
  const handleTagalongRequest = async () => {
    try {
      await sendTagalongRequest(friend.id);
      setTagalongModalOpen(false);
      // You could add a success notification here
    } catch (error) {
      console.error("Error sending tagalong request:", error);
      // You could add an error notification here
    }
  };

  return (
    <div className="w-full md:w-1/3 h-auto min-h-screen bg-primary p-4">
      <div className="w-full flex flex-col">
        {friend.profilePicture ? (
          <img
            src={friend.profilePicture}
            alt={`${friend.fullName}'s profile`}
            className="w-1/2 md:w-1/3 rounded-full mx-auto mt-4 md:mt-8"
          />
        ) : (
          <FontAwesomeIcon
            className="mx-auto text-dark mt-4 md:mt-8 size-32 md:size-56"
            icon="fa-solid fa-user"
          />
        )}
      </div>
      <div className="text-start text-dark font-bold text-3xl md:text-5xl mt-4 ms-2 md:ms-5">
        {friend.fullName}
        {friend.tagalongs && friend.tagalongs.length > 0 && (
          <FontAwesomeIcon className="ms-2" icon="fa-solid fa-tags" />
        )}
      </div>
      <div className="text-start text-secondary text-xl md:text-3xl ms-2 md:ms-5">
        {friend.userName}
      </div>
      <div className="mt-4 md:mt-8 text-dark text-lg md:text-xl font-bold ms-2 md:ms-5">
        Categories
        <FontAwesomeIcon
          className="ms-2 cursor-pointer"
          icon="fa-solid fa-pen-to-square"
          onClick={() => setModalOpen(true)}
        />
      </div>
      <div className="ms-2 md:ms-5 mt-2 flex flex-wrap">
        {activeCategories.map((cat) => (
          <span
            key={cat.id}
            className="px-2 py-1 m-1 md:mx-2 bg-dark rounded-lg text-light text-sm md:text-base"
          >
            {cat.name}
          </span>
        ))}
      </div>

      {friend.tagalongs && friend.tagalongs.length === 0 && (
        <div className="ms-2 md:ms-5 mt-4">
          <button
            onClick={() => setTagalongModalOpen(true)}
            className="px-3 py-1 md:px-4 md:py-2 bg-dark text-light rounded hover:bg-dark/80 text-sm md:text-base"
          >
            Add as Tagalong
          </button>
        </div>
      )}

      {/* Modals - now using imported components */}
      <CategoryManagementModal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        categories={categories}
        isCategoryActive={isCategoryActive}
        handleCategoryToggle={handleCategoryToggle}
        onNewCategory={() => setNewCategoryModalOpen(true)}
        onEditCategory={(category) => {
          setCategoryToEdit(category);
          setEditCategoryName(category.name);
          setEditCategoryModalOpen(true);
        }}
        onDeleteCategory={(category) => {
          setCategoryToDelete(category);
          setDeleteCategoryModalOpen(true);
        }}
      />

      <NewCategoryModal
        isOpen={newCategoryModalOpen}
        onOpenChange={setNewCategoryModalOpen}
        categoryName={newCategoryName}
        onCategoryNameChange={setNewCategoryName}
        onSubmit={handleCreateCategory}
      />

      <DeleteCategoryModal
        isOpen={deleteCategoryModalOpen}
        onOpenChange={setDeleteCategoryModalOpen}
        category={categoryToDelete}
        onDelete={handleDeleteCategory}
      />

      <EditCategoryModal
        isOpen={editCategoryModalOpen}
        onOpenChange={setEditCategoryModalOpen}
        categoryName={editCategoryName}
        onCategoryNameChange={setEditCategoryName}
        onSubmit={handleEditCategory}
      />

      <TagalongRequestModal
        isOpen={tagalongModalOpen}
        onOpenChange={setTagalongModalOpen}
        friendName={friend.fullName}
        onConfirm={handleTagalongRequest}
      />
    </div>
  );
}

export default MainFriendDetails;
