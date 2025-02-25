import { Tabs } from "radix-ui";
import AddFriends from "../components/friendsComponents/AddFriends";
import MyFriends from "../components/friendsComponents/MyFriends";
import Pending from "../components/friendsComponents/Pending";

function Friends() {
  return (
    <div className="mt-2 w-full h-full  flex justify-center">
      <Tabs.Root
        defaultValue="add"
        className="mt-2 bg-dark w-1/3 text-primary rounded-md "
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
          <AddFriends />
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
