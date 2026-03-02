import React from 'react';
import Link from 'next/link';

/**
 * Reusable Action Button Component
 * @param {Object} props
 * @param {string} props.href - Link destination (if using Link)
 * @param {Function} props.onClick - Click handler (if using button)
 * @param {string} props.variant - Button variant: 'primary' (amber), 'secondary' (blue), 'danger' (red), 'gray'
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.children - Button text
 * @param {string} props.type - Button type (submit, button, reset)
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.title - Tooltip text
 */
export default function ActionButton({ 
  href, 
  onClick, 
  variant = 'primary', 
  icon, 
  children,
  type = 'button',
  disabled = false,
  title
}) {
  const variants = {
    primary: 'flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-700 dark:from-amber-400 dark:to-amber-500 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95',
    secondary: 'bg-blue-500 text-white hover:bg-blue-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    gray: 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-500',
  };

  const baseClasses = `flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  if (href) {
    if (title) {
      return (
        <div className="relative group inline-block">
          <Link href={href} className={baseClasses}>
            {icon}
            {children}
          </Link>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {title}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      );
    }
    return (
      <Link href={href} className={baseClasses}>
        {icon}
        {children}
      </Link>
    );
  }

  if (title) {
    return (
      <div className="relative group inline-block">
        <button 
          type={type}
          onClick={onClick} 
          className={baseClasses}
          disabled={disabled}
        >
          {icon}
          {children}
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {title}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <button 
      type={type}
      onClick={onClick} 
      className={baseClasses}
      disabled={disabled}
    >
      {icon}
      {children}
    </button>
  );
}
