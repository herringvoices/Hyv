import { useState, useEffect, useContext } from "react";
import { Tabs } from "radix-ui";
import PendingHangouts from "../components/hangoutComponents/PendingHangouts";
import { getPendingHangoutRequests } from "../services/hangoutService";
import { UserContext } from "../context/UserContext";

function Hangouts() {
  const { loggedInUser } = useContext(UserContext);
  const [pendingHangouts, setPendingHangouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingHangouts = async () => {
    try {
      setIsLoading(true);
      const data = await getPendingHangoutRequests();
      setPendingHangouts(data);
    } catch (error) {
      console.error("Error fetching pending hangouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pending hangouts when component mounts or user changes
  useEffect(() => {
    if (loggedInUser) {
      fetchPendingHangouts();
    }
  }, [loggedInUser]);

  return (
    <div className="mt-2 w-full h-full flex justify-center px-4 sm:px-6">
      <Tabs.Root
        defaultValue="pending"
        className="mt-2 bg-dark w-full sm:w-full md:w-2/3 lg:w-1/2 xl:w-1/3 border border-primary shadow-md shadow-primary text-primary rounded-md"
      >
        <Tabs.List className="flex flex-wrap gap-2 bg-dark p-2 rounded-md">
          <Tabs.Trigger
            value="pending"
            className="flex px-3 py-2 sm:px-4 text-sm sm:text-base rounded-md transition-colors duration-200 
               bg-primary text-dark 
               data-[state=active]:bg-dark data-[state=active]:text-primary 
               focus:outline-none"
          >
            Pending Hangouts
          </Tabs.Trigger>
          {/* More tabs will be added later as mentioned */}
        </Tabs.List>

        <Tabs.Content value="pending" className="p-2 sm:p-4">
          <PendingHangouts
            pendingHangouts={pendingHangouts}
            fetchPendingHangouts={fetchPendingHangouts}
            isLoading={isLoading}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

export default Hangouts;
