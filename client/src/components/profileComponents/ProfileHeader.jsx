import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  updateUserProfile,
  uploadProfilePicture,
} from "../../services/userServices";

function ProfileHeader({ user, onUpdateUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Create a reference to the hidden file input
  const fileInputRef = useRef(null);

  const handleSave = async () => {
    try {
      await updateUserProfile({
        id: user.id,
        firstName,
        lastName,
        profilePicture: user.profilePicture, // Include the current profile picture
      });
      setIsEditing(false);
      if (onUpdateUser) {
        onUpdateUser();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Handler for when the user clicks on the profile picture or the upload icon
  const handleProfilePictureClick = () => {
    fileInputRef.current.click();
  };

  // Handler for when a file is selected
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset error state
    setUploadError(null);

    try {
      setIsUploading(true);
      const result = await uploadProfilePicture(file);

      // Update the UI with the new photo URL
      if (onUpdateUser) {
        onUpdateUser();
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Profile picture section with upload capability */}
      <div
        className="relative w-fit mx-auto cursor-pointer"
        onClick={handleProfilePictureClick}
      >
        {isUploading ? (
          <div className="w-1/2 md:w-1/3 rounded-full mx-auto mt-4 md:mt-8 flex items-center justify-center">
            <FontAwesomeIcon
              icon="fa-solid fa-spinner"
              spin
              className="text-dark size-32 md:size-56"
            />
          </div>
        ) : user.profilePicture ? (
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

        {/* Camera icon overlay for upload */}
        <div className="absolute bottom-0 right-0 bg-dark text-light rounded-full p-2">
          <FontAwesomeIcon icon="fa-solid fa-camera" />
        </div>
      </div>

      {/* Display upload error if any */}
      {uploadError && (
        <div className="text-red-500 text-center mt-2">{uploadError}</div>
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
