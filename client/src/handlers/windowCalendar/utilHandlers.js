import { getWindowsByDateRange } from "../../services/windowServices";
import { getUserHangoutsInRange } from "../../services/hangoutService";

// Function to refresh calendar data
export const refreshCalendarData = (calendarRef, setters) => {
  const { setWindows, setHangouts } = setters;

  if (calendarRef.current) {
    const calendarApi = calendarRef.current.getApi();
    const view = calendarApi.view;

    // Get date range from current view
    const start = view.activeStart.toISOString();
    const end = view.activeEnd.toISOString();

    // Re-fetch both windows and hangouts
    return Promise.all([
      getWindowsByDateRange(start, end),
      getUserHangoutsInRange(new Date(start), new Date(end)),
    ])
      .then(([fetchedWindows, fetchedHangouts]) => {
        setWindows(fetchedWindows);
        setHangouts(fetchedHangouts);
      })
      .catch((err) => {
        console.error("Error refreshing calendar data:", err);
      });
  }

  return Promise.resolve();
};
