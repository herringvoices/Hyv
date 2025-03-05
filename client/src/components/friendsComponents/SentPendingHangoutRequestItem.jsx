import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function SentPendingHangoutRequestItem({ request }) {
  // Format dates consistently with PendingHangoutItem
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Get the data from the correct nesting level
  const hangoutRequest = request.hangoutRequest;
  const title = hangoutRequest.title;
  const description = hangoutRequest.description;
  const proposedStart = hangoutRequest.proposedStart;
  const proposedEnd = hangoutRequest.proposedEnd;

  // Get the recipient, which should be the first person in recipients
  const recipient = request.user

  return (
    <li className="flex flex-col my-3 text-dark bg-primary rounded-md">
      {/* Recipient info */}
      <div className="flex items-center mb-2 bg-dark border border-primary rounded-tl-md rounded-tr-md text-primary">
        <div className="m-2">
          {recipient?.profilePicture ? (
            <img
              src={recipient.profilePicture}
              alt={`${recipient.fullName}'s profile`}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <FontAwesomeIcon className="size-10" icon="fa-solid fa-user" />
          )}
        </div>
        <div className="text-left">
          <div className="">
            You sent a hangout request to <strong>{recipient?.fullName}</strong>
          </div>
        </div>
      </div>

      {/* Hangout details */}
      <div className="mb-2 m-2 ms-3">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm mb-1">{description}</p>
        <p className="text-sm">
          <strong>When:</strong> {formatDate(proposedStart)} to{" "}
          {formatDate(proposedEnd)}
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex justify-end m-2">
        <span className="px-3 py-1 bg-dark text-light rounded-md text-sm">
          Awaiting Response
        </span>
      </div>
    </li>
  );
}

SentPendingHangoutRequestItem.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.number.isRequired,
    hangoutRequestId: PropTypes.number.isRequired,
    userId: PropTypes.string.isRequired,
    recipientStatus: PropTypes.string.isRequired,
    invitedAt: PropTypes.string.isRequired,
    hangoutRequest: PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      proposedStart: PropTypes.string.isRequired,
      proposedEnd: PropTypes.string.isRequired,
      isOpen: PropTypes.bool,
      recipients: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          fullName: PropTypes.string.isRequired,
          profilePicture: PropTypes.string,
        })
      ).isRequired,
    }).isRequired,
  }).isRequired,
};

export default SentPendingHangoutRequestItem;
