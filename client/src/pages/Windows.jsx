import React, { useState, useRef, useEffect } from "react";
import {
  getWindowsByDateRange,
  updateWindow,
} from "../services/windowServices";
import { getUserHangoutsInRange } from "../services/hangoutService";
import { applyPreset } from "../services/presetService";

// Import the FullCalendar packages correctly
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Import the modal components
import WindowFormModal from "../components/windows/WindowFormModal";
import HangoutFormModal from "../components/hangouts/HangoutFormModal";
import PresetSidebar from "../components/presets/PresetSidebar";

export default function Windows() {
  const [windows, setWindows] = useState([]);
  const [hangouts, setHangouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [isMobile, setIsMobile] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  // Hangout modal state
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

  // Handle receiving of dragged preset events
  const handleEventReceive = async (info) => {
    try {
      // Check if this is a dragged preset (has presetId in extendedProps)
      if (info.event.extendedProps?.presetId) {
        const presetId = info.event.extendedProps.presetId;

        // Use the actual dropped event start time instead of zeroing it out
        const dropDate = new Date(info.event.start);

        setError(null);

        // Apply the preset at the drop date
        await applyPreset(presetId, dropDate);

        // Remove the temporary event
        info.revert();

        // Refresh the calendar data
        refreshCalendarData();
      }
    } catch (err) {
      console.error("Error applying preset:", err);
      setError("Failed to apply preset. Please try again.");
      info.revert();
    }
  };

  // Function to refresh calendar data
  const refreshCalendarData = () => {
    if (calendarRef.current) {
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
        })
        .catch((err) => {
          console.error("Error refreshing calendar data:", err);
        });
    }
  };

  // Existing event handlers (dateClick, dateSelect, etc.)
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

  const handleDateSelect = (selectInfo) => {
    // Only process selections in timeGrid views
    if (!currentView.includes("timeGrid")) return;

    setSelectedDateInfo(selectInfo);
    setIsModalOpen(true);
    // Clear the selection to allow reselection of the same date range
    selectInfo.view.calendar.unselect();
  };

  const handleModalClose = (refresh = false) => {
    setIsModalOpen(false);
    setSelectedDateInfo(null);

    // If a window was created, refresh the calendar data
    if (refresh) {
      refreshCalendarData();
    }
  };

  const handleHangoutModalClose = (refresh = false) => {
    setIsHangoutModalOpen(false);
    setSelectedHangout(null);

    // Refresh calendar data if needed
    if (refresh) {
      refreshCalendarData();
    }
  };

  // Other existing event handlers (eventResize, eventDrop, eventClick)
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
    } catch (err) {
      console.error("Error updating window after resize:", err);
      // Revert the change if the update failed
      resizeInfo.revert();
      setError("Failed to update window. Please try again.");
    }
  };

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
    } catch (err) {
      console.error("Error updating window after drop:", err);
      // Revert the change if the update failed
      dropInfo.revert();
      setError("Failed to update window. Please try again.");
    }
  };

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

  return (
    <div className="mx-auto px-2 sm:px-5 mt-2 sm:mt-4">
      <h2 className="mb-2 sm:mb-4 text-xl sm:text-2xl">My Windows</h2>

      {error && (
        <div className="p-3 mb-3 bg-red-900/20 border border-red-500 text-red-400 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Preset Sidebar - add the sidebar in the first column on larger screens */}
        <div className="lg:col-span-1">
          <PresetSidebar onPresetApplied={refreshCalendarData} />
        </div>

        {/* Calendar - takes up full width on mobile, 3/4 on larger screens */}
        <div className="lg:col-span-3">
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
                eventReceive={handleEventReceive} // Add the eventReceive handler
                droppable={true} // Enable dropping external elements
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
                // Add custom event class names function to modify mirror appearance
                eventClassNames={(arg) => {
                  // Check if this is a mirror element
                  if (arg.isMirror) {
                    // If it's a preset being dragged, use preset-drag-mirror class
                    if (arg.event.extendedProps?.presetId) {
                      return ["preset-drag-mirror"];
                    }
                    // Otherwise use default mirror styling
                    return ["custom-mirror-event"];
                  }

                  // Check if this is a hangout event
                  if (arg.event.extendedProps.eventType === "hangout") {
                    return ["hangout-event"];
                  }

                  return [];
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center mt-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
        </div>
      )}

      {/* Window Creation/Edit Modal */}
      <WindowFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectInfo={selectedDateInfo}
        editWindowId={selectedDateInfo?.id}
      />

      {/* Hangout Modal */}
      <HangoutFormModal
        isOpen={isHangoutModalOpen}
        onClose={handleHangoutModalClose}
        hangoutData={selectedHangout}
      />
    </div>
  );
}
