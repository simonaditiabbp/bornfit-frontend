import React from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaEdit, FaTrash, FaSave, FaTimes, FaUndo, FaPaperPlane, FaSnowflake, FaCheck  } from 'react-icons/fa';

/**
 * Reusable Action Button Component
 * @param {Object} props
 * @param {string} props.href - Link destination (if using Link)
 * @param {Function} props.onClick - Click handler (if using button)
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'danger', 'gray', 'back', 'edit', 'delete', 'save', 'cancel'
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
    primary: 'flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-400 hover:to-amber-300 px-4 py-2 rounded-lg font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95',
    secondary: 'bg-blue-500 text-white hover:bg-blue-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    gray: 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-500',
    back: 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-500',
    edit: 'flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-400 hover:to-amber-300 px-4 py-2 rounded-lg font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95',
    submit: 'flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-400 hover:to-amber-300 px-4 py-2 rounded-lg font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95',
    delete: 'bg-red-500 text-white hover:bg-red-600',
    save: 'bg-green-600 text-white hover:bg-green-700',
    cancel: 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-500',
    reset: 'bg-blue-500 text-white hover:bg-blue-600',
    unfreeze: 'bg-blue-600 text-white hover:bg-blue-700',
    approve: 'bg-green-600 text-white hover:bg-green-700',
    reject: 'bg-orange-600 text-white hover:bg-orange-700'
  };

  // Auto-add icon for specific variants
  const getAutoIcon = () => {
    if (icon) return icon;
    switch(variant) {
      case 'back': return <FaArrowLeft className="w-3 h-3" />;
      case 'edit': return <FaEdit className="w-3 h-3" />;
      case 'delete': return <FaTrash className="w-3 h-3" />;
      case 'submit': return <FaPaperPlane className="w-3 h-3" />;
      case 'save': return <FaSave className="w-3 h-3" />;
      case 'cancel': return <FaTimes className="w-3 h-3" />;
      case 'reset': return <FaUndo className="w-3 h-3" />;
      case 'unfreeze': return <FaSnowflake  className="w-3 h-3" />;
      case 'approve': return <FaCheck  className="w-3 h-3" />;
      case 'reject': return <FaTimes  className="w-3 h-3" />;
      default: return null;
    }
  };
  const displayIcon = getAutoIcon();

  const baseClasses = `flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  if (href) {
    if (title) {
      return (
        <div className="relative group inline-block">
          <Link href={href} className={baseClasses}>
            {displayIcon}
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
        {displayIcon}
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
          {displayIcon}
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
      {displayIcon}
      {children}
    </button>
  );
}
