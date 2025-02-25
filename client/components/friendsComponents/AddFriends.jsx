import { useState } from "react";
import { getUsersByUsername } from "../../services/userServices";
import UserItem from "../UserItem";
import { Avatar } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function AddFriends() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);

  const handleSearch = async () => {
    try {
      const result = await getUsersByUsername(query);
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

  return (
    <>
      <div className="flex justify-center px-2 py-2">
        <input
          className="!px-2 py-1 w-2/3 mx-2 rounded-md"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Search username..."
        />
        <button
          className=" bg-primary text-dark rounded-md"
          onClick={handleSearch}
        >
          <FontAwesomeIcon className="p-2 mx-auto my-auto" icon="fa-solid fa-magnifying-glass" />{" "}
        </button>
      </div>
      <ul>
        {users.map((user) => (
          <UserItem key={user.id} user={user} />
        ))}
      </ul>
    </>
  );
}

export default AddFriends;
