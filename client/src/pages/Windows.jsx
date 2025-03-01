import React, { useState, useRef, useEffect } from "react";
import { getWindowsByDateRange } from "../services/windowServices";

// Import the FullCalendar packages correctly
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Import the WindowFormModal component
import WindowFormModal from "../components/windows/WindowFormModal";

export default function Windows() {
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [isMobile, setIsMobile] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

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

      console.log(`Fetching windows from ${startStr} to ${endStr}`);

      const fetchedWindows = await getWindowsByDateRange(startStr, endStr);
      setWindows(fetchedWindows);
      console.log("Windows fetched:", fetchedWindows);

      // Optionally, also scroll to current time in timeGrid views:
      if (
        dateInfo.view.type === "timeGridWeek" ||
        dateInfo.view.type === "timeGridDay"
      ) {
        const currentHour = new Date().getHours();
        dateInfo.view.calendar.setOption("scrollTime", currentHour + ":00:00");
      }
    } catch (err) {
      console.error("Error fetching windows:", err);
      setError("Failed to load windows. Please try again.");
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

      // Re-fetch windows for the current date range
      getWindowsByDateRange(
        view.activeStart.toISOString(),
        view.activeEnd.toISOString()
      )
        .then((fetchedWindows) => {
          setWindows(fetchedWindows);
          console.log("Windows refreshed after creation:", fetchedWindows);
        })
        .catch((err) => {
          console.error("Error refreshing windows:", err);
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
            footerToolbar={
              isMobile
                ? {
                    center: "today",
                  }
                : null
            }
            allDaySlot={false}
            defaultAllDay={false}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={isMobile ? 2 : true}
            weekends={true}
            events={windows}
            datesSet={handleDatesSet}
            height={isMobile ? "auto" : "auto"}
            contentHeight="auto"
            aspectRatio={isMobile ? 0.8 : 1.35}
            select={handleDateSelect}
            dateClick={handleDateClick}
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

      {/* Window Creation Modal */}
      <WindowFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectInfo={selectedDateInfo}
      />
    </div>
  );
}
