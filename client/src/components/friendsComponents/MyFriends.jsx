import { useState, useContext } from "react";
import { getFriends } from "../../services/friendService";
import FriendItem from "../FriendItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UserContext } from "../../context/UserContext";

function MyFriends() {
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const { loggedInUser } = useContext(UserContext);

  const handleSearch = async () => {
    try {
      const result = await getFriends(query);
      setFriends(result);
    } catch (error) {
      console.error(error);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <div className="flex justify-center px-2 py-2">
        <input
          className="!px-2 py-1 w-2/3 mx-2 text-dark rounded-md"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Search a friend's name or username..."
        />
        <button
          className="bg-primary text-dark rounded-md"
          onClick={handleSearch}
        >
          <FontAwesomeIcon
            className="p-2 mx-auto my-auto"
            icon="fa-solid fa-magnifying-glass"
          />
        </button>
      </div>
      {friends.length > 0 ? (
        <ul>
          {friends.map((friend) => (
            <FriendItem key={friend.id} friend={friend} />
          ))}
        </ul>
      ) : (
        <p className="text-primary text-center">
          Enter a friend's name or username in the field above.
        </p>
      )}
    </>
  );
}

export default MyFriends;
