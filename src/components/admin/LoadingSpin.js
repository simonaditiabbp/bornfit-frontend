import React from 'react';

/**
 * Reusable Loading Text Component
 * @param {Object} props
 * @param {string} props.text - Loading text (default: "Loading...")
 * @param {boolean} props.topPosition - If true, spinner positioned at top center (default: false)
 */
export default function LoadingSpin({ text = "Loading...", topPosition = false }) {
  return (
    <div className={`flex justify-center bg-gray-100 dark:bg-gray-900 ${
      topPosition ? 'items-start pt-20 pb-20' : 'items-center min-h-screen'
    }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-amber-300">{text}</p>
        </div>
      </div>
  );
}
