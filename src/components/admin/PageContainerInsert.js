import React from 'react';

/**
 * Reusable Page Container Component
 * Wraps content with standard margin, padding, and styling
 */
export default function PageContainerInsert({ children }) {
  return (
    <div className="p-5">
        <div className="max-w-3xl mx-auto bg-gray-800 p-10 rounded-2xl shadow-lg border border-gray-700">
            {children}
        </div>
    </div>
  );
}
