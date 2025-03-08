import React, { useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { getUserPresets } from "../../services/presetService";
import { Draggable } from "@fullcalendar/interaction";
import PresetFormModal from "./PresetFormModal";
import DeletePresetModal from "./DeletePresetModal";

// Add this style tag
const styles = document.createElement("style");
styles.innerHTML = `
  .preset-drag-mirror {
    background-color: #64748b;
    border: 1px solid #475569;
    border-radius: 0.375rem;
    padding: 0.75rem;
    color: white;
    opacity: 0.8;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    z-index: 9999;
    width: 200px;
    font-family: sans-serif;
  }
`;
document.head.appendChild(styles);

const PresetSidebar = ({ onPresetApplied }) => {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const presetContainerRef = useRef(null);
  const draggableRef = useRef(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Function to fetch presets - extracted for reuse
  const fetchPresets = async () => {
    setLoading(true);
    try {
      const fetchedPresets = await getUserPresets();
      setPresets(fetchedPresets);
      setError(null);
    } catch (err) {
      console.error("Error fetching presets:", err);
      setError("Failed to load presets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  // Initialize draggable functionality when presets are loaded
  useEffect(() => {
    if (loading || !presetContainerRef.current) return;

    // Clean up previous draggable instance
    if (draggableRef.current) {
      draggableRef.current.destroy();
      draggableRef.current = null;
    }

    // Create new draggable instance with enhanced mirror styling
    draggableRef.current = new Draggable(presetContainerRef.current, {
      itemSelector: ".preset-item",
      mirrorSelector: ".fc-event-mirror", // Target mirror elements with this class
      appendTo: document.body,
      eventData: (eventEl) => {
        const presetId = Number(eventEl.dataset.presetId);
        const preset = presets.find((p) => p.id === presetId);

        return {
          id: `preset-${presetId}`,
          title: preset?.title || "Preset",
          create: true,
          presetId: presetId,
          backgroundColor: "#64748b",
          borderColor: "#475569",
        };
      },
    });

    return () => {
      if (draggableRef.current) {
        draggableRef.current.destroy();
        draggableRef.current = null;
      }
    };
  }, [presets, loading]);

  const handleAddPreset = () => {
    setSelectedPreset(null);
    setIsFormModalOpen(true);
  };

  const handleEditPreset = (preset, e) => {
    e.stopPropagation();
    setSelectedPreset(preset);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (preset, e) => {
    e.stopPropagation();
    setSelectedPreset(preset);
    setIsDeleteModalOpen(true);
  };

  // Handle modal close events
  const handleFormModalClose = (refresh = false) => {
    setIsFormModalOpen(false);
    if (refresh) {
      fetchPresets();
    }
  };

  const handleDeleteModalClose = (refresh = false) => {
    setIsDeleteModalOpen(false);
    if (refresh) {
      fetchPresets();
    }
  };

  // Format time for display (12-hour format)
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="bg-dark border border-gray-700 rounded-lg p-3 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-primary font-medium">My Presets</h3>
        <button
          onClick={handleAddPreset}
          className="p-2 bg-primary text-dark rounded-full hover:bg-primary/80"
          title="Add new preset"
        >
          <FontAwesomeIcon icon={faPlus} size="sm" />
        </button>
      </div>

      {error && (
        <div className="p-3 mb-3 bg-red-900/20 border border-red-500 text-red-400 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div
          ref={presetContainerRef}
          className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1"
        >
          {presets.length > 0 ? (
            presets.map((preset) => (
              <div
                key={preset.id}
                draggable="true"
                className="preset-item cursor-grab bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-md p-3 relative"
                data-preset-id={preset.id}
                onDragStart={(e) => {
                  // Set drag data
                  e.dataTransfer.setData("text/plain", preset.id);

                  // Create a custom drag image
                  const dragImage = document.createElement("div");
                  dragImage.innerHTML = `
                    <div style="
                      background-color: #64748b;
                      border: 1px solid #475569;
                      border-radius: 0.375rem;
                      padding: 0.75rem;
                      color: white;
                      width: 200px;
                      font-family: sans-serif;
                    ">
                      <div style="font-weight: bold;">${preset.title}</div>
                    </div>
                  `;
                  document.body.appendChild(dragImage);

                  // Set the drag image
                  try {
                    e.dataTransfer.setDragImage(dragImage, 10, 10);
                  } catch (err) {
                    console.error("Error setting drag image:", err);
                  }

                  // Clean up after a short delay
                  setTimeout(() => {
                    document.body.removeChild(dragImage);
                  }, 0);

                  console.log("Drag started for preset:", preset.id);
                }}
              >
                <div className="text-light font-medium">{preset.title}</div>
                <div className="text-gray-400 text-sm">
                  {formatTime(preset.start)} - {formatTime(preset.end)}
                </div>
                {preset.extendedProps?.preferredActivity && (
                  <div className="text-gray-400 text-sm truncate mt-1">
                    {preset.extendedProps.preferredActivity}
                  </div>
                )}

                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={(e) => handleEditPreset(preset, e)}
                    className="p-1.5 text-gray-400 hover:text-primary"
                    title="Edit preset"
                  >
                    <FontAwesomeIcon icon={faPen} size="xs" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(preset, e)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                    title="Delete preset"
                  >
                    <FontAwesomeIcon icon={faTrash} size="xs" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-400">
              No presets yet. Click the + button to create one.
            </div>
          )}
        </div>
      )}

      {/* Form modal for creating/editing presets */}
      <PresetFormModal
        isOpen={isFormModalOpen}
        onClose={handleFormModalClose}
        editingPreset={selectedPreset}
      />

      {/* Delete confirmation modal */}
      <DeletePresetModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        preset={selectedPreset}
      />
    </div>
  );
};

export default PresetSidebar;
