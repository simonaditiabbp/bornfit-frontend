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
 */
export default function ActionButton({ 
  href, 
  onClick, 
  variant = 'primary', 
  icon, 
  children,
  type = 'button',
  disabled = false
}) {
  const variants = {
    primary: 'bg-amber-400 text-gray-900 hover:bg-amber-500',
    secondary: 'bg-blue-500 text-white hover:bg-blue-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    gray: 'bg-gray-600 text-white hover:bg-gray-500',
  };

  const baseClasses = `flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {icon}
        {children}
      </Link>
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
