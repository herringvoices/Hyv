import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { updateUserProfile } from "../../services/userServices";

function ProfileHeader({ user, onUpdateUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");

  const handleSave = async () => {
    try {
      await updateUserProfile({
        id: user.id,
        firstName,
        lastName,
      });
      setIsEditing(false);
      if (onUpdateUser) {
        onUpdateUser();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {user.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={`${user.fullName}'s profile`}
          className="w-1/2 md:w-1/3 rounded-full mx-auto mt-4 md:mt-8"
        />
      ) : (
        <FontAwesomeIcon
          className="mx-auto text-dark mt-4 md:mt-8 size-32 md:size-56"
          icon="fa-solid fa-user"
        />
      )}

      {isEditing ? (
        <div className="mt-4 flex flex-col">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="px-2 py-1 text-secondary rounded border border-dark"
              placeholder="First Name"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="px-2 py-1 text-secondary rounded border border-dark"
              placeholder="Last Name"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="mt-2 px-3 py-1 bg-secondary text-light rounded hover:bg-secondary/80 w-fit"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="mt-2 px-3 py-1 bg-dark text-light rounded hover:bg-dark/80 w-fit"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="text-start text-dark font-bold text-3xl md:text-5xl mt-4 ms-2 md:ms-5 flex items-center">
          {user.fullName}
          <FontAwesomeIcon
            icon="fa-solid fa-pen-to-square"
            className="ms-2 text-xl md:text-3xl cursor-pointer"
            onClick={() => setIsEditing(true)}
          />
        </div>
      )}

      <div className="text-start text-secondary text-xl md:text-3xl ms-2 md:ms-5">
        {user.userName}
      </div>
    </div>
  );
}

export default ProfileHeader;
