import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, Checkbox } from "radix-ui";

function CategoryManagementModal({
  isOpen,
  onOpenChange,
  categories,
  isCategoryActive,
  handleCategoryToggle,
  onNewCategory,
  onEditCategory,
  onDeleteCategory,
}) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 border border-primary shadow-lg shadow-primary transform -translate-x-1/2 -translate-y-3/4 bg-dark/90 p-6 rounded-lg w-150">
          <Dialog.Title className="text-2xl font-bold text-primary mb-4 flex items-center">
            Edit Categories
            <FontAwesomeIcon
              icon="fa-solid fa-square-plus"
              className="ms-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity duration-300"
              onClick={onNewCategory}
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
                  {category.name}
                  <FontAwesomeIcon
                    icon="fa-solid fa-pen-to-square"
                    className="ms-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity duration-300"
                    onClick={() => onEditCategory(category)}
                  />
                  <FontAwesomeIcon
                    icon="fa-solid fa-trash-can"
                    className="ms-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity duration-300"
                    onClick={() => onDeleteCategory(category)}
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-primary text-dark rounded hover:bg-primary/80"
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CategoryManagementModal;
