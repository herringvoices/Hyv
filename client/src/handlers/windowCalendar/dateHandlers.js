import { getWindowsByDateRange } from "../../services/windowServices";
import { getUserHangoutsInRange } from "../../services/hangoutService";

// Handle date range change in FullCalendar
export const handleDatesSet = async (dateInfo, setters) => {
  const { setLoading, setError, setCurrentView, setWindows, setHangouts } =
    setters;

  try {
    setLoading(true);
    setError(null);

    // Update the current view type
    setCurrentView(dateInfo.view.type);

    const startStr = dateInfo.startStr;
    const endStr = dateInfo.endStr;

    // Fetch both windows and hangouts in parallel
    const [fetchedWindows, fetchedHangouts] = await Promise.all([
      getWindowsByDateRange(startStr, endStr),
      getUserHangoutsInRange(new Date(startStr), new Date(endStr)),
    ]);

    setWindows(fetchedWindows);
    setHangouts(fetchedHangouts);

    // Set scroll time if in week or day view
    if (
      dateInfo.view.type === "timeGridWeek" ||
      dateInfo.view.type === "timeGridDay"
    ) {
      const currentHour = new Date().getHours();
      dateInfo.view.calendar.setOption("scrollTime", currentHour + ":00:00");
    }
  } catch (err) {
    console.error("Error fetching calendar data:", err);
    setError("Failed to load calendar data. Please try again.");
  } finally {
    setLoading(false);
  }
};

export const handleDateClick = (dateClickInfo, currentView, setters) => {
  const { setSelectedDateInfo, setIsModalOpen } = setters;

  // Only process clicks in month view
  if (currentView !== "dayGridMonth") return;

  // Get the clicked date
  const clickedDate = new Date(dateClickInfo.date);

  // Set default times (2:00 PM to 3:00 PM)
  const startDate = new Date(clickedDate);
  startDate.setHours(14, 0, 0); // 2:00 PM

  const endDate = new Date(clickedDate);
  endDate.setHours(15, 0, 0); // 3:00 PM

  // Create a dateInfo object similar to what select would provide
  const dateInfo = {
    start: startDate,
    end: endDate,
    startStr: startDate.toISOString(),
    endStr: endDate.toISOString(),
    allDay: false,
    view: dateClickInfo.view,
    jsEvent: dateClickInfo.jsEvent,
  };

  // Open modal with this info
  setSelectedDateInfo(dateInfo);
  setIsModalOpen(true);
};

export const handleDateSelect = (selectInfo, currentView, setters) => {
  const { setSelectedDateInfo, setIsModalOpen } = setters;

  // Only process selections in timeGrid views
  if (!currentView.includes("timeGrid")) return;

  setSelectedDateInfo(selectInfo);
  setIsModalOpen(true);
  // Clear the selection to allow reselection of the same date range
  selectInfo.view.calendar.unselect();
};
