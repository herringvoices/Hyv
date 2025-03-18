import React from "react";
import { Dialog } from "radix-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function HiveHelpModal({ isOpen, onClose }) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed border border-primary shadow-primary shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark p-6 rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="text-xl font-bold text-primary mb-4">
            <span>Hyv View Guide</span>
          </Dialog.Title>

          <div className="space-y-4 text-light">
            <h3 className="font-semibold text-lg text-primary">
              Hyv View: See When Your Friends Are Free
            </h3>
            <p>
              The Hyv View makes it easy to see when your availability aligns
              with your friends.
            </p>

            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium text-primary">
                  Overlapping Windows:
                </span>{" "}
                If a friend has an open window that overlaps with yours, it will
                appear on this page. These windows are semi-opaque, letting you
                know they're free.
              </li>

              <li>
                <span className="font-medium text-primary">
                  Send a Hangout Request:
                </span>{" "}
                Click on a friend's open window to propose a hangout. You'll be
                able to set the details—like time, location, and activity—before
                sending the request.
              </li>

              <li>
                <span className="font-medium text-primary">Open Hangouts:</span>{" "}
                If your friends are already part of a planned hangout and have
                made it open to others, it will show up as a solid orange block.
              </li>

              <li>
                <span className="font-medium text-primary">
                  Join a Hangout:
                </span>{" "}
                Click on an open hangout to send a request to join in.
              </li>
            </ul>

            <p className="mt-4">
              With the Hyv View, planning time with friends is effortless—you'll
              always know when they're available and how to join in on the fun!
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
