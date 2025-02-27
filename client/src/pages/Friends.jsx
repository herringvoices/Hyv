import { useState, useEffect, useContext } from "react";
import { Tabs } from "radix-ui";
import AddFriends from "../components/friendsComponents/AddFriends";
import MyFriends from "../components/friendsComponents/MyFriends";
import Pending from "../components/friendsComponents/Pending";
import { getPendingFriendRequests } from "../services/friendRequestService";
import { UserContext } from "../context/UserContext";

function Friends() {
  const { loggedInUser, relationshipNotifications, refreshNotifications } =
    useContext(UserContext);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Function to refresh pending friend requests and notifications
  const refreshPending = async () => {
    try {
      const pending = await getPendingFriendRequests();
      setPendingRequests(pending);
      await refreshNotifications(); // Also refresh notification counts
    } catch (error) {
      console.error(error);
    }
  };

  // Refresh pending requests on mount and when loggedInUser changes
  useEffect(() => {
    if (loggedInUser) {
      refreshPending();
    }
  }, [loggedInUser]);

  return (
    <div className="mt-2 w-full h-full flex justify-center px-4 sm:px-6">
      <Tabs.Root
        defaultValue="add"
        className="mt-2 bg-dark w-full sm:w-full md:w-2/3 lg:w-1/2 xl:w-1/3 border border-primary shadow-md shadow-primary text-primary rounded-md"
      >
        <Tabs.List className="flex flex-wrap gap-2 bg-dark p-2 rounded-md">
          <Tabs.Trigger
            value="add"
            className="flex px-3 py-2 sm:px-4 text-sm sm:text-base rounded-md transition-colors duration-200 
               bg-primary text-dark 
               data-[state=active]:bg-dark data-[state=active]:text-primary 
               focus:outline-none"
          >
            Add Friends
          </Tabs.Trigger>
          <Tabs.Trigger
            value="myfriends"
            className="flex px-3 py-2 sm:px-4 text-sm sm:text-base rounded-md transition-colors duration-200 
               bg-primary text-dark 
               data-[state=active]:bg-dark data-[state=active]:text-primary 
               focus:outline-none"
          >
            My Friends
          </Tabs.Trigger>
          <Tabs.Trigger
            value="pending"
            className="relative flex px-3 py-2 sm:px-4 text-sm sm:text-base rounded-md transition-colors duration-200 
               bg-primary text-dark 
               data-[state=active]:bg-dark data-[state=active]:text-primary 
               focus:outline-none"
          >
            Pending
            {relationshipNotifications.total > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {relationshipNotifications.total}
              </span>
            )}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="add" className="p-2 sm:p-4">
          <AddFriends
            pendingRequests={pendingRequests}
            refreshPending={refreshPending}
          />
        </Tabs.Content>
        <Tabs.Content value="myfriends" className="p-2 sm:p-4">
          <MyFriends />
        </Tabs.Content>
        <Tabs.Content value="pending" className="p-2 sm:p-4">
          <Pending refreshNotifications={refreshNotifications} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

export default Friends;
