import { useState, useEffect, useContext } from "react";
import { Tabs } from "radix-ui";
import AddFriends from "../components/friendsComponents/AddFriends";
import MyFriends from "../components/friendsComponents/MyFriends";
import Pending from "../components/friendsComponents/Pending";
import { getPendingFriendRequests } from "../services/friendRequestService";
import { UserContext } from "../context/UserContext";

function Friends() {
  const { loggedInUser } = useContext(UserContext);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Function to refresh pending friend requests
  const refreshPending = async () => {
    try {
      const pending = await getPendingFriendRequests();
      setPendingRequests(pending);
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
    <div className="mt-2 w-full h-full   flex justify-center">
      <Tabs.Root
        defaultValue="add"
        className="mt-2 bg-dark w-1/3 border border-primary shadow-md shadow-primary text-primary rounded-md "
      >
        <Tabs.List className="flex gap-2 bg-dark p-2 rounded-md">
          <Tabs.Trigger
            value="add"
            className="flex px-4 py-2 rounded-md transition-colors duration-200 
               bg-primary text-dark 
               data-[state=active]:bg-dark data-[state=active]:text-primary 
               focus:outline-none"
          >
            Add Friends
          </Tabs.Trigger>
          <Tabs.Trigger
            value="myfriends"
            className="flex px-4 py-2 rounded-md transition-colors duration-200 
               bg-primary text-dark 
               data-[state=active]:bg-dark data-[state=active]:text-primary 
               focus:outline-none"
          >
            My Friends
          </Tabs.Trigger>
          <Tabs.Trigger
            value="pending"
            className="flex px-4 py-2 rounded-md transition-colors duration-200 
               bg-primary text-dark 
               data-[state=active]:bg-dark data-[state=active]:text-primary 
               focus:outline-none"
          >
            Pending
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="add" className="p-4">
          <AddFriends
            pendingRequests={pendingRequests}
            refreshPending={refreshPending}
          />
        </Tabs.Content>
        <Tabs.Content value="myfriends" className="p-4">
          <MyFriends />
        </Tabs.Content>
        <Tabs.Content value="pending" className="p-4">
          <Pending />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

export default Friends;
