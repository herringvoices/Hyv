import React from "react";
import { Dialog } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function WindowHelpModal({ isOpen, onClose }) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed border border-primary shadow-primary shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="text-xl font-bold text-primary mb-4">
            <span>Windows Help Guide</span>
          </Dialog.Title>

          <div className="space-y-4 text-light">
            <h3 className="font-semibold text-lg text-primary">
              Managing Your Availability with Windows
            </h3>
            <p>
              Easily share when you're available to hang out by adding Windows
              to your schedule.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Transparent Windows show when you're open to plans.</li>
              <li>Opaque Windows indicate confirmed hangouts.</li>
            </ul>

            <h3 className="font-semibold text-lg text-primary mt-4">
              Editing and Customizing Windows
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Drag and drop to adjust the date and time effortlessly.</li>
              <li>Create and apply presets to simplify the process.</li>
              <li>Have a regular Weekday Availability?</li>
              <li>Need a Game Night preset?</li>
              <li>
                Set them up once, then drag them onto your calendar in seconds!
              </li>
            </ul>

            <h3 className="font-semibold text-lg text-primary mt-4">
              Effortless Scheduling
            </h3>
            <p>
              Once you've placed a preset, it behaves just like any other
              Window—you can edit or move it as needed. Stay flexible while
              making planning easier than ever!
            </p>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-dark rounded hover:bg-primary/90"
            >
              Got it
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-primary"
              aria-label="Close"
            >
              <FontAwesomeIcon icon="times" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
