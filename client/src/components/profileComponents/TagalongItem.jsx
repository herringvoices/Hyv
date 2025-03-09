import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function TagalongItem({ friend, onRemove }) {
  return (
    <li className="flex justify-between w-3/4 items-center p-3 text-dark bg-primary rounded-md">
      <div className="flex items-center">
        {friend.profilePicture ? (
          <img
            src={friend.profilePicture}
            alt={`${friend.fullName}'s profile`}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <FontAwesomeIcon
            className="text-dark size-8"
            icon="fa-solid fa-user"
          />
        )}
        <div className="ml-3 text-left">
          <div className="font-semibold text-xl">{friend.fullName}</div>
          <div className="text-lg">{friend.userName}</div>
        </div>
      </div>
      
      <button
        className="text-light bg-dark w-[2rem] rounded-lg aspect-square hover:opacity-90 transition-colors"
        size="lg"
        onClick={() => onRemove(friend)}
        
        >
        <FontAwesomeIcon icon="fa-solid fa-trash-can" />
      </button>
    </li>
  );
}

export default TagalongItem;
