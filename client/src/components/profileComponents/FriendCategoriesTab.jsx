import React, { useState } from "react";
import TagalongFriends from "./TagalongFriends";
import Categories from "./Categories";

function FriendCategoriesTab({ user, onUpdate }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <div className="space-y-6">
      <div className="bg-dark/70 shadow-md shadow-primary border-primary border rounded-md p-4 text-light">
        <TagalongFriends user={user} onUpdate={onUpdate} />
      </div>

      <div className="bg-dark/70 shadow-md shadow-primary border-primary border rounded-md p-4 text-light">
        <Categories
          user={user}
          onUpdate={onUpdate}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>
    </div>
  );
}

export default FriendCategoriesTab;
