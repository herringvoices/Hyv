import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function UserItem({ user }) {
  return (
    <li className="flex justify-between items-center p-2 text-dark bg-primary rounded-md text-xl">
      <div className="flex items-center">
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={`${user.fullName}'s profile`}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <FontAwesomeIcon
            className="ms-2 size-12"
            icon="fa-solid fa-user"
          />
        )}
        <div className="mx-2 text-left">
          <div>{user.fullName}</div>
          <div className="text-sm">{user.userName}</div>
        </div>
      </div>
      <div className="me-2">
        <FontAwesomeIcon className="size-10" icon="fa-solid fa-square-plus" />
      </div>
    </li>
  );
}

export default UserItem;
