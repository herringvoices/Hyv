import React, { useState, useEffect, useContext } from "react";
import { getUserById } from "../services/userServices";
import { UserContext } from "../context/UserContext";
import Spinner from "../components/misc/Spinner";
import ProfileHeader from "../components/profileComponents/ProfileHeader";
import HangoutsTab from "../components/profileComponents/HangoutsTab";
import FriendCategoriesTab from "../components/profileComponents/FriendCategoriesTab";
import PresetsTab from "../components/profileComponents/PresetsTab";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("hangouts"); // Default to hangouts tab
  const { loggedInUser } = useContext(UserContext);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!loggedInUser) {
        setError("No logged in user found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userData = await getUserById(loggedInUser.id);
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [loggedInUser]);

  const refreshUser = async () => {
    if (!loggedInUser) {
      setError("No logged in user found");
      return;
    }

    try {
      setLoading(true);
      const userData = await getUserById(loggedInUser.id);
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error("Error refreshing user profile:", err);
      setError("Failed to refresh user profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-dark/70 justify-center items-center h-full">
        <div className="text-light">{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex bg-dark/70 justify-center items-center h-full">
        <div className="text-light">User not found.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-full">
      {/* Left Side - Profile Header */}
      <div className="w-full md:w-1/3 h-auto min-h-screen bg-primary p-4">
        <ProfileHeader user={user} onUpdateUser={refreshUser} />

        {/* Vertical Tabs */}
        <div className="mt-6 flex flex-col w-full">
          <button
            className={`text-start text-xl md:text-3xl w-full py-2 ps-2 md:ps-5 ${
              activeTab === "hangouts"
                ? "bg-dark text-light"
                : "bg-primary text-dark"
            }`}
            onClick={() => setActiveTab("hangouts")}
          >
            Hangouts
          </button>
          <button
            className={`text-start text-xl md:text-3xl w-full py-2 ps-2 md:ps-5 ${
              activeTab === "categories"
                ? "bg-dark text-light"
                : "bg-primary text-dark"
            }`}
            onClick={() => setActiveTab("categories")}
          >
            Friend Categories
          </button>
          <button
            className={`text-start text-xl md:text-3xl w-full py-2 ps-2 md:ps-5 ${
              activeTab === "presets"
                ? "bg-dark text-light"
                : "bg-primary text-dark"
            }`}
            onClick={() => setActiveTab("presets")}
          >
            Presets
          </button>
        </div>
      </div>

      {/* Right Side - Tab Content */}
      <div className="w-full md:w-2/3 p-4">
        {activeTab === "hangouts" && <HangoutsTab />}
        {activeTab === "categories" && (
          <FriendCategoriesTab user={user} onUpdate={refreshUser} />
        )}
        {activeTab === "presets" && <PresetsTab />}
      </div>
    </div>
  );
}

export default Profile;
