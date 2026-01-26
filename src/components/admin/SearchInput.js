import React from 'react';

/**
 * Reusable Search Input Component
 * @param {Object} props
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 */
export default function SearchInput({ placeholder = "Search...", value, onChange }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="w-full max-w-xs p-2 border text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:border-amber-500 text-base"
      value={value}
      onChange={onChange}
    />
  );
}
