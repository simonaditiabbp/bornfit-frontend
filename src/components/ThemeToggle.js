'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleClick = () => {
    // console.log('Theme toggle clicked, current theme:', theme);
    toggleTheme();
  };

  // console.log('ThemeToggle render, current theme:', theme);

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'} dark:bg-gray-700 dark:hover:bg-gray-600`}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      {theme === 'dark' ? (
        <>
          <FaSun className="text-yellow-400" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <FaMoon className="text-blue-400" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}
