import React, { useState, useRef, useEffect } from "react";
import { getHiveWindows } from "../services/windowServices";

// Import the FullCalendar packages
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Import Radix components correctly based on your package.json
import { Select } from "radix-ui";

export default function Hive() {
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [isMobile, setIsMobile] = useState(false);

  // Category state
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

  // Add a ref to access the calendar API
  const calendarRef = useRef(null);

  // Fetch categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Typically you would fetch categories from an API
        // For now we'll use placeholder data
        const fetchedCategories = [
          { id: 1, name: "Close Friends" },
          { id: 2, name: "Family" },
          { id: 3, name: "Work" },
          { id: 4, name: "School" },
        ];
        setCategories(fetchedCategories);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    loadCategories();
  }, []);

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

      console.log(`Fetching hive windows from ${startStr} to ${endStr}`);

      const fetchedWindows = await getHiveWindows(
        startStr,
        endStr,
        selectedCategoryId
      );
      setWindows(fetchedWindows);
      console.log("Hive windows fetched:", fetchedWindows);

      // Scroll to current time in timeGrid views
      if (
        dateInfo.view.type === "timeGridWeek" ||
        dateInfo.view.type === "timeGridDay"
      ) {
        const currentHour = new Date().getHours();
        dateInfo.view.calendar.setOption("scrollTime", currentHour + ":00:00");
      }
    } catch (err) {
      console.error("Error fetching hive windows:", err);
      setError("Failed to load hive windows. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection change
  const handleCategoryChange = async (categoryId) => {
    setSelectedCategoryId(categoryId);

    // Refresh the calendar with the selected category
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;

      try {
        setLoading(true);
        const fetchedWindows = await getHiveWindows(
          view.activeStart.toISOString(),
          view.activeEnd.toISOString(),
          categoryId
        );
        setWindows(fetchedWindows);
      } catch (err) {
        console.error("Error filtering windows by category:", err);
        setError("Failed to filter windows by category. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mx-auto px-2 sm:px-5 mt-2 sm:mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl">Hive View</h2>

        {/* Category filter dropdown using proper Radix structure */}
        <div className="ml-auto">
          <Select.Root
            value={selectedCategoryId}
            onValueChange={handleCategoryChange}
          >
            <Select.Trigger className="inline-flex items-center justify-between px-3 py-2 border rounded shadow">
              <Select.Value placeholder="All categories" />
              <Select.Icon className="ml-2" />
            </Select.Trigger>

            <Select.Portal>
              <Select.Content className="bg-white p-2 rounded shadow-lg z-50">
                <Select.Viewport>
                  <Select.Item
                    value="all"
                    className="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
                  >
                    <Select.ItemText>All categories</Select.ItemText>
                    <Select.ItemIndicator className="ml-2">
                      ✓
                    </Select.ItemIndicator>
                  </Select.Item>
                  {categories.map((category) => (
                    <Select.Item
                      key={category.id}
                      value={category.id.toString()}
                      className="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
                    >
                      <Select.ItemText>{category.name}</Select.ItemText>
                      <Select.ItemIndicator className="ml-2">
                        ✓
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>

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
            editable={false} // Read-only
            selectable={false} // No selection allowed
            dayMaxEvents={isMobile ? 2 : true}
            weekends={true}
            events={windows}
            datesSet={handleDatesSet}
            height={isMobile ? "auto" : "auto"}
            contentHeight="auto"
            aspectRatio={isMobile ? 0.8 : 1.35}
            eventOverlap={true}
            eventDisplay="block"
            nowIndicator={true}
            scrollTime={new Date().getHours() + ":00:00"}
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
    </div>
  );
}
