import { applyPreset } from "../../services/presetService";

// Handle receiving of dragged preset events
export const handleEventReceive = async (
  info,
  setError,
  refreshCalendarData
) => {
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
