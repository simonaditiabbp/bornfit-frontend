import React from 'react';

/**
 * Reusable Loading Text Component
 * @param {Object} props
 * @param {string} props.text - Loading text (default: "Loading...")
 */
export default function LoadingSpin({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{text}</p>
        </div>
      </div>
  );
}
