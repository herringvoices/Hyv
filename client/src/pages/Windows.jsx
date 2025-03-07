import React, { useState, useRef, useEffect } from "react";
import {
  getWindowsByDateRange,
  updateWindow,
} from "../services/windowServices";
import { getUserHangoutsInRange } from "../services/hangoutService";

// Import the FullCalendar packages correctly
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Import the modal components
import WindowFormModal from "../components/windows/WindowFormModal";
import HangoutFormModal from "../components/hangouts/HangoutFormModal"; // Add this import

export default function Windows() {
  const [windows, setWindows] = useState([]);
  const [hangouts, setHangouts] = useState([]); // Add this new state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [isMobile, setIsMobile] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  // Hangout modal state - add these
  const [isHangoutModalOpen, setIsHangoutModalOpen] = useState(false);
  const [selectedHangout, setSelectedHangout] = useState(null);

  // Add a ref to access the calendar API
  const calendarRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIsMobile();

    // Listen for resize events
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Handle date range change in FullCalendar
  const handleDatesSet = async (dateInfo) => {
    try {
      setLoading(true);
      setError(null);

      // Update the current view type
      setCurrentView(dateInfo.view.type);

      const startStr = dateInfo.startStr;
      const endStr = dateInfo.endStr;

      console.log(`Fetching calendar data from ${startStr} to ${endStr}`);

      // Fetch both windows and hangouts in parallel
      const [fetchedWindows, fetchedHangouts] = await Promise.all([
        getWindowsByDateRange(startStr, endStr),
        getUserHangoutsInRange(new Date(startStr), new Date(endStr)),
      ]);

      setWindows(fetchedWindows);
      setHangouts(fetchedHangouts);

      console.log("Windows fetched:", fetchedWindows);
      console.log("Hangouts fetched:", fetchedHangouts);

      // Rest of the function remains the same
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

  // Handle date click for month view
  const handleDateClick = (dateClickInfo) => {
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

  // Handle date selection for week/day views
  const handleDateSelect = (selectInfo) => {
    // Only process selections in timeGrid views
    if (!currentView.includes("timeGrid")) return;

    setSelectedDateInfo(selectInfo);
    setIsModalOpen(true);
    // Clear the selection to allow reselection of the same date range
    selectInfo.view.calendar.unselect();
  };

  // Handle modal close
  const handleModalClose = (refresh = false) => {
    setIsModalOpen(false);
    setSelectedDateInfo(null);

    // If a window was created, refresh the calendar data
    if (refresh && calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;

      // Get date range from current view
      const start = view.activeStart.toISOString();
      const end = view.activeEnd.toISOString();

      // Re-fetch both windows and hangouts
      Promise.all([
        getWindowsByDateRange(start, end),
        getUserHangoutsInRange(new Date(start), new Date(end)),
      ])
        .then(([fetchedWindows, fetchedHangouts]) => {
          setWindows(fetchedWindows);
          setHangouts(fetchedHangouts);
          console.log("Calendar data refreshed after update");
        })
        .catch((err) => {
          console.error("Error refreshing calendar data:", err);
        });
    }
  };

  // Handle event resize (when dragging the handles)
  const handleEventResize = async (resizeInfo) => {
    // Check if this is a hangout event - ignore hangouts
    if (
      resizeInfo.event.extendedProps.eventType === "hangout" ||
      resizeInfo.event.eventType === "hangout" ||
      resizeInfo.event.extendedProps.hasOwnProperty("description")
    ) {
      resizeInfo.revert();
      return;
    }

    try {
      // Prepare window data for update
      const windowData = {
        start: resizeInfo.event.start.toISOString(),
        end: resizeInfo.event.end.toISOString(),
        extendedProps: resizeInfo.event.extendedProps,
      };

      // Call the API to update the window
      await updateWindow(parseInt(resizeInfo.event.id), windowData);
      console.log("Window updated after resize");
    } catch (err) {
      console.error("Error updating window after resize:", err);
      // Revert the change if the update failed
      resizeInfo.revert();
      setError("Failed to update window. Please try again.");
    }
  };

  // Handle event drop (when dragging the entire event)
  const handleEventDrop = async (dropInfo) => {
    // Check if this is a hangout event - ignore hangouts
    if (
      dropInfo.event.extendedProps.eventType === "hangout" ||
      dropInfo.event.eventType === "hangout" ||
      dropInfo.event.extendedProps.hasOwnProperty("description")
    ) {
      dropInfo.revert();
      return;
    }

    try {
      // Prepare window data for update
      const windowData = {
        start: dropInfo.event.start.toISOString(),
        end: dropInfo.event.end.toISOString(),
        extendedProps: dropInfo.event.extendedProps,
      };

      // Call the API to update the window
      await updateWindow(parseInt(dropInfo.event.id), windowData);
      console.log("Window updated after drop");
    } catch (err) {
      console.error("Error updating window after drop:", err);
      // Revert the change if the update failed
      dropInfo.revert();
      setError("Failed to update window. Please try again.");
    }
  };

  // Handle event click to edit
  const handleEventClick = (clickInfo) => {
    const eventId = clickInfo.event.id;

    // Check if this is a hangout event using the explicit type
    if (
      clickInfo.event.extendedProps.eventType === "hangout" ||
      clickInfo.event.eventType === "hangout" ||
      clickInfo.event.extendedProps.hasOwnProperty("description")
    ) {
      // Handle hangout click - open hangout modal

      const hangoutData = {
        id: eventId,
        title: clickInfo.event.title,
        start: clickInfo.event.start,
        end: clickInfo.event.end,
        extendedProps: clickInfo.event.extendedProps,
      };

      setSelectedHangout(hangoutData);
      setIsHangoutModalOpen(true);
      return;
    }

    // This is a window event, handle as before
    const id = parseInt(eventId);
    const windowData = {
      id: id,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      extendedProps: clickInfo.event.extendedProps,
    };

    setSelectedDateInfo(windowData);
    setIsModalOpen(true);
  };

  // Add this before the return statement
  const combinedEvents = [
    ...windows,
    ...hangouts.map((hangout) => ({
      ...hangout,
      // Add additional properties to differentiate hangouts from windows
      classNames: "hangout-event",
      editable: false, // Hangouts shouldn't be directly editable through drag/drop
      eventType: "hangout", // Explicit type property for clearer identification
    })),
  ];

  // Add a new function to handle hangout modal close
  const handleHangoutModalClose = (refresh = false) => {
    setIsHangoutModalOpen(false);
    setSelectedHangout(null);

    // Refresh calendar data if needed
    if (refresh && calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;

      // Get date range from current view
      const start = view.activeStart.toISOString();
      const end = view.activeEnd.toISOString();

      // Re-fetch both windows and hangouts
      Promise.all([
        getWindowsByDateRange(start, end),
        getUserHangoutsInRange(new Date(start), new Date(end)),
      ])
        .then(([fetchedWindows, fetchedHangouts]) => {
          setWindows(fetchedWindows);
          setHangouts(fetchedHangouts);
          console.log("Calendar data refreshed after hangout update");
        })
        .catch((err) => {
          console.error("Error refreshing calendar data:", err);
        });
    }
  };

  return (
    <div className="mx-auto px-2 sm:px-5 mt-2 sm:mt-4">
      <h2 className="mb-2 sm:mb-4 text-xl sm:text-2xl">My Windows</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card shadow">
        <div className="mx-auto card-body p-1 sm:p-3 md:pb-5">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={isMobile ? "listWeek" : "dayGridMonth"}
            headerToolbar={{
              left: isMobile ? "prev,next" : "prev,next today",
              center: "title",
              right: isMobile
                ? "dayGridMonth,listWeek"
                : "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={combinedEvents}
            allDaySlot={false}
            defaultAllDay={false}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={isMobile ? 2 : true}
            weekends={true}
            datesSet={handleDatesSet}
            height={isMobile ? "auto" : "auto"}
            contentHeight="auto"
            aspectRatio={isMobile ? 0.8 : 1.35}
            select={handleDateSelect}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventResize={handleEventResize}
            eventDrop={handleEventDrop}
            eventOverlap={false}
            selectOverlap={(event) => {
              if (currentView === "dayGridMonth") {
                return true;
              } else {
                return false;
              }
            }}
            forceEventDuration={true}
            defaultTimedEventDuration="01:00"
            eventDisplay="block"
            nowIndicator={true}
            scrollTime={new Date().getHours() + ":00:00"}
            // Mobile-specific options
            stickyHeaderDates={true}
            expandRows={!isMobile}
            views={{
              dayGridMonth: {
                titleFormat: {
                  month: isMobile ? "short" : "long",
                  year: "numeric",
                },
              },
              timeGridWeek: {
                titleFormat: {
                  month: isMobile ? "short" : "long",
                  year: "numeric",
                },
              },
              listWeek: {
                listDayFormat: { weekday: "short" },
                listDaySideFormat: { month: "short", day: "numeric" },
              },
            }}
          />
        </div>
      </div>

      {loading && (
        <div className="d-flex justify-content-center mt-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Window Creation/Edit Modal */}
      <WindowFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectInfo={selectedDateInfo}
        editWindowId={selectedDateInfo?.id}
      />

      {/* Hangout Modal - Add this */}
      <HangoutFormModal
        isOpen={isHangoutModalOpen}
        onClose={handleHangoutModalClose}
        hangoutData={selectedHangout}
      />
    </div>
  );
}
