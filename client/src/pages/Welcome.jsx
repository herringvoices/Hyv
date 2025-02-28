import React from "react";

const Welcome = () => {
  return (
    <div className="bg-dark/80 text-primary border border-primary shadow-md shadow-primary p-6 rounded-md max-w-lg mx-auto mt-10">
      <h1 className="text-4xl font-bold mb-4 text-center">Welcome to Hyv!</h1>
      <p className="mb-4 text-lg">
        There's not much here yet, but eventually this will be a place where you
        can plan your social calendar.
      </p>
      <h2 className="text-2xl font-semibold mb-2">Features to add:</h2>
      <ul className="list-disc pl-5 space-y-2 text-lg">
        <li>Display your availability via open windows</li>
        <li>
          See friends who share your availability and send them hangout requests
        </li>
        <li>
          Create presets to make adding open windows as easy as clicking and
          dragging.
        </li>
      </ul>
    </div>
  );
};

export default Welcome;
