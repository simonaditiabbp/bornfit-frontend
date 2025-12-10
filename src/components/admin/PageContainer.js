import React from 'react';

/**
 * Reusable Page Container Component
 * Wraps content with standard margin, padding, and styling
 */
export default function PageContainer({ children }) {
  return (
    <div className="m-5 p-5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
      {children}
    </div>
  );
}
