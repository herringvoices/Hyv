import { useState, useContext } from "react";
import { getUsersByUsername } from "../../services/userServices";
import UserItem from "../UserItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UserContext } from "../../context/UserContext";

function AddFriends({ pendingRequests, refreshPending }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const { loggedInUser } = useContext(UserContext);

  const handleSearch = async () => {
    try {
      const result = await getUsersByUsername(query, { nonFriends: true });
      setUsers(result);
    } catch (error) {
      console.error(error);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  // Helper: checks if user has a pending friend request from or to them.
  const isPending = (userId) => {
    if (!loggedInUser) return false;
    return pendingRequests?.some(
      (req) =>
        (req.sender &&
          req.senderId === loggedInUser.id &&
          req.recipient &&
          req.recipientId === userId) ||
        (req.recipient &&
          req.recipientId === loggedInUser.id &&
          req.sender &&
          req.senderId === userId)
    );
  };

  return (
    <>
      <div className="flex justify-center px-2 py-2">
        <input
          className="block me-2 p-2 w-full bg-dark border border-primary/50 text-primary rounded-md focus:border-primary focus:outline-none"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Search username..."
        />
        <button onClick={handleSearch}>
          <FontAwesomeIcon
            className="p-2 mx-auto bg-primary hover:bg-primary/80 text-dark  rounded-md my-auto"
            size="lg"
            icon="fa-solid fa-magnifying-glass"
          />
        </button>
      </div>
      <ul>
        {users.map((user) => (
          <UserItem
            key={user.id}
            user={user}
            pending={isPending(user.id)}
            refreshPending={refreshPending}
          />
        ))}
      </ul>
    </>
  );
}

export default AddFriends;
