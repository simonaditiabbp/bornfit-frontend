import React from "react";

export default function BackendErrorFallback({ onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
      <div className="bg-white p-8 rounded-xl shadow-md text-center border border-red-200">
        <h1 className="text-3xl font-bold text-red-700 mb-4">Connection Error</h1>
        <p className="mb-6 text-lg text-gray-700">Unable to connect to the backend server.<br />Please check your connection and try again.</p>
        <button
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded font-bold shadow"
          onClick={onRetry}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
