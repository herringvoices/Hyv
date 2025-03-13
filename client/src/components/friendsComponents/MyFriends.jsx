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
          className="block me-2 p-2 w-full bg-dark border border-primary/50 text-primary rounded-md focus:border-primary focus:outline-none"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Search a friend's name or username..."
        />
        <button className="" onClick={handleSearch}>
          <FontAwesomeIcon
            className="p-2 mx-auto bg-primary hover:bg-primary/80 text-dark  rounded-md my-auto"
            size="lg"
            icon="fa-solid fa-magnifying-glass"
          />
        </button>
      </div>
      {friends.length > 0 ? (
        <ul>
          {friends.map((friend) => (
            <FriendItem
              key={friend.id}
              friend={friend}
              setFriends={setFriends}
            />
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
