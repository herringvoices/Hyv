import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getAllCategories } from "../../services/friendshipCategoryService";
import { getUsersByCategory } from "../../services/userServices";
import CategoryItem from "./CategoryItem";
import AddCategoryModal from "./CategoryModals/AddCategoryModal";
import AddFriendToCategoryModal from "./CategoryModals/AddFriendToCategoryModal";

function Categories({ user, onUpdate, selectedCategory, onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [categoryFriends, setCategoryFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchFriendsInCategory(selectedCategory.id);
    } else {
      setCategoryFriends([]);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const allCategories = await getAllCategories();
      setCategories(allCategories);

      // If we have categories but none selected, select the first one
      if (allCategories.length > 0 && !selectedCategory) {
        onSelectCategory(allCategories[0]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchFriendsInCategory = async (categoryId) => {
    setLoading(true);
    try {
      const friends = await getUsersByCategory(categoryId);
      setCategoryFriends(friends);
    } catch (error) {
      console.error("Error fetching friends in category:", error);
      setCategoryFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySuccess = async () => {
    await fetchCategories();
    if (onUpdate) onUpdate();
  };

  const handleAddFriendSuccess = async () => {
    if (selectedCategory) {
      await fetchFriendsInCategory(selectedCategory.id);
    }
    if (onUpdate) onUpdate();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-primary text-xl md:text-2xl font-bold">
          Categories
        </h2>
        <button
          className="bg-primary text-dark px-3 py-1 rounded-md flex items-center"
          onClick={() => setNewCategoryModalOpen(true)}
        >
          <FontAwesomeIcon icon="fa-solid fa-plus" className="mr-2" />
          Add New Category
        </button>
      </div>
      <div className="mb-4">
        <select
          className="w-full p-2 bg-dark border border-primary rounded text-light"
          value={selectedCategory?.id || ""}
          onChange={(e) => {
            const category = categories.find(
              (c) => c.id === parseInt(e.target.value)
            );
            onSelectCategory(category || null);
          }}
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-primary text-lg font-semibold">
            Friends in {selectedCategory?.name || "selected category"}
          </h3>
          {selectedCategory && (
            <button
              className="bg-primary text-dark px-3 py-1 rounded-md flex items-center"
              onClick={() => setAddFriendModalOpen(true)}
            >
              <FontAwesomeIcon icon="fa-solid fa-user-plus" className="mr-2" />
              Add Friends to Category
            </button>
          )}
        </div>
        {loading ? (
          <p>Loading friends...</p>
        ) : categoryFriends.length === 0 ? (
          <p>No friends in this category.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoryFriends.map((friend) => (
              <CategoryItem
                key={friend.id}
                friend={friend}
                categoryId={selectedCategory?.id}
                onRemove={() => fetchFriendsInCategory(selectedCategory.id)}
              />
            ))}
          </div>
        )}
      </div>

      <AddCategoryModal
        isOpen={newCategoryModalOpen}
        onClose={() => setNewCategoryModalOpen(false)}
        onSuccess={handleCategorySuccess}
      />

      <AddFriendToCategoryModal
        isOpen={addFriendModalOpen}
        onClose={() => setAddFriendModalOpen(false)}
        selectedCategory={selectedCategory}
        existingFriends={categoryFriends}
        onSuccess={handleAddFriendSuccess}
      />
    </>
  );
}

export default Categories;
