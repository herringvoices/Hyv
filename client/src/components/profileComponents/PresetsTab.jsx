import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faTrash,
  faPlus,
  faPlusSquare,
  faPencilSquare,
  faPenSquare,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { getUserPresets } from "../../services/presetService";
import PresetFormModal from "../presets/PresetFormModal";
import DeletePresetModal from "../presets/DeletePresetModal";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";

function PresetsTab() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Function to fetch presets
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

  // Fetch presets on component mount
  useEffect(() => {
    fetchPresets();
  }, []);

  // Handle add preset
  const handleAddPreset = () => {
    setSelectedPreset(null);
    setIsFormModalOpen(true);
  };

  // Handle edit preset
  const handleEditPreset = (preset) => {
    setSelectedPreset(preset);
    setIsFormModalOpen(true);
  };

  // Handle delete preset
  const handleDeleteClick = (preset) => {
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
    <div className="bg-dark/70 rounded-md p-4 text-light shadow-md shadow-primary border-primary border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-primary text-2xl md:text-3xl font-bold">Presets</h2>
        <button
          onClick={handleAddPreset}
          className="p-2 rounded-full hover:bg-primary/80"
          title="Add new preset"
        >
          <FontAwesomeIcon
            className="text-primary"
            icon={faPlusSquare}
            size="2xl"
          />
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-900/20 border border-red-500 text-red-400 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.length > 0 ? (
            presets.map((preset) => (
              <div
                key={preset.id}
                className="bg-primary text-dark   rounded-md p-4 relative hover:border-primary transition-colors"
              >
                <div className="text-dark font-bold text-lg mb-1">
                  {preset.title}
                </div>
                <div className="-400 text-sm">
                  {formatTime(preset.start)} - {formatTime(preset.end)}
                </div>
                {preset.extendedProps?.preferredActivity && (
                  <div className=" text-sm mt-2">
                    {preset.extendedProps.preferredActivity}
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={() => handleEditPreset(preset)}
                    className="p-1."
                    title="Edit preset"
                  >
                    <FontAwesomeIcon
                      className="text-dark hover:bg-dark hover:text-primary transition-colors rounded-md p-1"
                      icon={faPenToSquare}
                      size="lg"
                    />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(preset)}
                    className="p-1.5 "
                    title="Delete preset"
                  >
                    <FontAwesomeIcon
                      icon={faTrashCan}
                      className="text-dark hover:bg-red-600 hover:text-light/80 transition-colors rounded-md p-1"
                      size="lg"
                    />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 ">
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
}

export default PresetsTab;
