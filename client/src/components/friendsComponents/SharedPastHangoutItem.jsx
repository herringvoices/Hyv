import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function SharedPastHangoutItem({ hangout }) {
  // Format dates consistently
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <li className="flex flex-col my-3 text-dark bg-primary rounded-md">
      {/* Host/Guest info */}
      <div className="flex items-center mb-2 bg-dark border border-primary rounded-tl-md rounded-tr-md text-primary">
        <div className="m-2">
          {hangout.extendedProps?.user?.profilePicture ? (
            <img
              src={hangout.extendedProps.user.profilePicture}
              alt={`${hangout.extendedProps.user.fullName}'s profile`}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <FontAwesomeIcon className="size-10" icon="fa-solid fa-user" />
          )}
        </div>
        <div className="text-left">
          <div className="">
            Hangout hosted by{" "}
            <strong>{hangout.extendedProps?.user?.fullName || "Unknown"}</strong>
          </div>
        </div>
      </div>

      {/* Hangout details */}
      <div className="mb-2 m-2 ms-3">
        <h3 className="text-xl font-bold">{hangout.title}</h3>
        <p className="text-sm mb-1">{hangout.extendedProps?.description}</p>
        <p className="text-sm">
          <strong>When:</strong> {formatDate(hangout.start)} to{" "}
          {formatDate(hangout.end)}
        </p>
        {hangout.extendedProps?.guests && hangout.extendedProps.guests.length > 0 && (
          <p className="text-sm mt-1">
            <strong>With:</strong>{" "}
            {hangout.extendedProps.guests
              .map((guest) => guest.fullName)
              .join(", ")}
          </p>
        )}
      </div>

      {/* No action buttons for past hangouts */}
    </li>
  );
}

SharedPastHangoutItem.propTypes = {
  hangout: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired,
    extendedProps: PropTypes.shape({
      description: PropTypes.string,
      user: PropTypes.shape({
        fullName: PropTypes.string,
        profilePicture: PropTypes.string,
      }),
      guests: PropTypes.arrayOf(
        PropTypes.shape({
          fullName: PropTypes.string,
        })
      ),
    }),
  }).isRequired,
};

export default SharedPastHangoutItem;