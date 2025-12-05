import React from 'react';

/**
 * Reusable Loading Text Component
 * @param {Object} props
 * @param {string} props.text - Loading text (default: "Loading...")
 */
export default function LoadingText({ text = "Loading..." }) {
  return (
    <div className="text-center text-amber-300">
      {text}
    </div>
  );
}
